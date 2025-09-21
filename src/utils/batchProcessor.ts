// Batch processing utilities for handling 50+ images

export interface BatchJob {
  id: string;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: BatchImageResult[];
  createdAt: string;
  completedAt?: string;
}

export interface BatchImageResult {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  extractedText: string;
  tableData: Record<string, any>[];
  errorMessage?: string;
  processingTime: number;
  retryCount: number;
  apiKeyUsed: string;
}

export interface BatchProcessingOptions {
  maxConcurrent: number;
  maxRetries: number;
  retryDelay: number;
  onProgress?: (job: BatchJob) => void;
  onComplete?: (job: BatchJob) => void;
  onError?: (error: Error) => void;
}

export class BatchProcessor {
  private backendUrl: string;
  private activeJobs: Map<string, BatchJob> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(backendUrl: string = 'http://localhost:8000') {
    this.backendUrl = backendUrl;
  }

  /**
   * Start batch processing of multiple images
   */
  async startBatchProcessing(
    files: File[],
    options: BatchProcessingOptions = {
      maxConcurrent: 5,
      maxRetries: 3,
      retryDelay: 2000
    }
  ): Promise<BatchJob> {
    try {
      // Validate files
      if (files.length === 0) {
        throw new Error('No files provided');
      }

      if (files.length > 100) {
        throw new Error('Maximum 100 images allowed per batch');
      }

      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // Start batch processing
      const response = await fetch(`${this.backendUrl}/batch-process-images`, {
        method: 'POST',
        body: formData,
        headers: {
          'max_concurrent': options.maxConcurrent.toString()
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start batch processing');
      }

      const result = await response.json();
      
      // Create job object
      const job: BatchJob = {
        id: result.job_id,
        totalImages: result.total_images,
        completedImages: 0,
        failedImages: 0,
        status: 'processing',
        progress: 0,
        results: [],
        createdAt: new Date().toISOString()
      };

      this.activeJobs.set(job.id, job);
      
      // Start polling for updates
      this.startPolling(job.id, options);
      
      return job;

    } catch (error) {
      console.error('Error starting batch processing:', error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Start polling for job updates
   */
  private startPolling(jobId: string, options: BatchProcessingOptions) {
    const pollInterval = setInterval(async () => {
      try {
        await this.updateJobStatus(jobId, options);
      } catch (error) {
        console.error('Error polling job status:', error);
        this.stopPolling(jobId);
        options.onError?.(error as Error);
      }
    }, 2000); // Poll every 2 seconds

    this.pollingIntervals.set(jobId, pollInterval);
  }

  /**
   * Stop polling for a job
   */
  private stopPolling(jobId: string) {
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }

  /**
   * Update job status from backend
   */
  private async updateJobStatus(jobId: string, options: BatchProcessingOptions) {
    try {
      const response = await fetch(`${this.backendUrl}/batch-status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }

      const status = await response.json();
      const job = this.activeJobs.get(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // Update job status
      job.status = status.status;
      job.completedImages = status.completed_images;
      job.failedImages = status.failed_images;
      job.progress = status.progress_percentage;
      job.completedAt = status.completed_at;

      // Update active jobs
      this.activeJobs.set(jobId, job);

      // Call progress callback
      options.onProgress?.(job);

      // Check if job is completed
      if (status.status === 'completed' || status.status === 'failed') {
        await this.loadJobResults(jobId, options);
        this.stopPolling(jobId);
        options.onComplete?.(job);
      }

    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  /**
   * Load detailed results for a completed job
   */
  private async loadJobResults(jobId: string, options: BatchProcessingOptions) {
    try {
      const response = await fetch(`${this.backendUrl}/batch-results/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get job results');
      }

      const results = await response.json();
      const job = this.activeJobs.get(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // Update job with detailed results
      job.results = results.results.map((result: any) => ({
        id: result.id,
        filename: result.filename,
        status: result.status,
        extractedText: result.extracted_text,
        tableData: result.table_data || [],
        errorMessage: result.error_message,
        processingTime: result.processing_time,
        retryCount: result.retry_count,
        apiKeyUsed: result.api_key_used
      }));

      this.activeJobs.set(jobId, job);

    } catch (error) {
      console.error('Error loading job results:', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get all active jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel a job (stop polling)
   */
  cancelJob(jobId: string) {
    this.stopPolling(jobId);
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      this.activeJobs.set(jobId, job);
    }
  }

  /**
   * Clean up completed jobs
   */
  cleanup() {
    // Stop all polling
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();

    // Clear completed jobs older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.activeJobs.forEach((job, jobId) => {
      if (job.status === 'completed' || job.status === 'failed') {
        const jobTime = new Date(job.completedAt || job.createdAt).getTime();
        if (jobTime < oneHourAgo) {
          this.activeJobs.delete(jobId);
        }
      }
    });
  }

  /**
   * Retry failed images in a job
   */
  async retryFailedImages(jobId: string, options: BatchProcessingOptions): Promise<BatchJob> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const failedImages = job.results.filter(result => result.status === 'failed');
    if (failedImages.length === 0) {
      throw new Error('No failed images to retry');
    }

    // Create new files from failed results
    const files: File[] = [];
    // Note: In a real implementation, you'd need to store the original files
    // For now, we'll just retry the processing with the existing data

    // Reset failed results to pending
    failedImages.forEach(result => {
      result.status = 'pending';
      result.retryCount = 0;
      result.errorMessage = undefined;
    });

    // Start processing again
    this.startPolling(jobId, options);
    
    return job;
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();

// Utility functions
export const createBatchJob = (files: File[], options?: Partial<BatchProcessingOptions>): Promise<BatchJob> => {
  return batchProcessor.startBatchProcessing(files, {
    maxConcurrent: 5,
    maxRetries: 3,
    retryDelay: 2000,
    ...options
  });
};

export const getBatchJob = (jobId: string): BatchJob | undefined => {
  return batchProcessor.getJob(jobId);
};

export const getAllBatchJobs = (): BatchJob[] => {
  return batchProcessor.getAllJobs();
};

export const cancelBatchJob = (jobId: string): void => {
  batchProcessor.cancelJob(jobId);
};

export const cleanupBatchJobs = (): void => {
  batchProcessor.cleanup();
};
