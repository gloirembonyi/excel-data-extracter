"use client";

import React, { useState, useEffect } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
} from "firebase/auth";
import { Download, X } from "lucide-react";
import {
  Container,
  Paper,
  Button,
  Text,
  Title,
  Group,
  Stack,
  Badge,
  Card,
  Avatar,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  FileInput,
  Progress,
  Alert,
  Grid,
  Center,
  Box,
  Divider,
  ThemeIcon,
  Flex,
  SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import ExcelTable from "../components/ExcelTable";
import ExcelLikeTable from "../components/ExcelLikeTable";
import ImagePreview from "../components/ImagePreview";
import FileUpload from "../components/FileUpload";
import DataComparison from "../components/DataComparison";
import ProjectManager from "../components/ProjectManager";
import ImageNamingModal from "../components/ImageNamingModal";
import {
  parseExcelFile,
  exportToExcel,
  exportToCSV,
  compareDatasets,
} from "../utils/excelUtils";
import {
  extractTextFromImageWithFailover,
  formatTextAsTableWithFailover,
  initializeApiKeyStatuses,
  updateApiKeyStatus,
  getWorkingApiKey,
  type ApiKeyStatus,
} from "../utils/aiUtils";
import {
  createBatchJob,
  getBatchJob,
  getAllBatchJobs,
  cancelBatchJob,
  cleanupBatchJobs,
  type BatchJob,
  type BatchImageResult,
} from "../utils/batchProcessor";
import {
  createProject,
  getProjects,
  getProject,
  addMasterData,
  getMasterData,
  findMatches,
  exportToExcel as exportProjectToExcel,
  type Project,
  type MasterDataItem,
} from "../utils/database";
import DataMatching from "../components/DataMatching";
import MasterDataManager from "../components/MasterDataManager";
import Sidebar from "../components/Sidebar";
import ProjectWorkflow from "../components/ProjectWorkflow";
import SearchPage from "../components/SearchPage";

// Firebase configuration - you'll need to add your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

const initialAuthToken = null; // Add your auth token if needed
const appId = "default-app-id";

// Image processing result interface
interface ImageResult {
  id: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "error";
  extractedText: string;
  tableData: Record<string, any>[];
  error?: string;
  apiKeyUsed?: string;
  processingTime?: number;
}

// Main App Component
export default function Home() {
  // File management
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);

  // Data management
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, any>[]>(
    []
  );
  const [extractedText, setExtractedText] = useState("");
  const [tableName, setTableName] = useState("Extracted Data");
  const [comparisonTableName1, setComparisonTableName1] = useState("Dataset 1");
  const [comparisonTableName2, setComparisonTableName2] = useState("Dataset 2");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] =
    useState<string>("");

  // API key management
  const [apiKeyStatuses, setApiKeyStatuses] = useState<ApiKeyStatus[]>(
    initializeApiKeyStatuses()
  );

  // UI state
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "extract" | "compare" | "tools" | "projects" | "search"
  >("extract");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showImageNaming, setShowImageNaming] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [imageNames, setImageNames] = useState<{ [key: string]: string }>({});
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [currentBatchJob, setCurrentBatchJob] = useState<BatchJob | null>(null);
  const [batchResults, setBatchResults] = useState<BatchImageResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
  const [correctedData, setCorrectedData] = useState<any[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<any | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Firebase
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and authenticate
  useEffect(() => {
    try {
      // Temporarily disabled Firebase to prevent auth errors
      // const app = initializeApp(firebaseConfig);
      // const authInstance = getAuth(app);
      // const dbInstance = getFirestore(app);

      // const handleAuth = async () => {
      //   try {
      //     if (initialAuthToken) {
      //       await signInWithCustomToken(authInstance, initialAuthToken);
      //     } else {
      //       await signInAnonymously(authInstance);
      //     }
      //     const user = authInstance.currentUser;
      //     setUserId(user?.uid || null);
      //   } catch (error) {
      //     console.error("Firebase auth error:", error);
      //     setUserId(null); // Fallback to null user ID on auth failure
      //   } finally {
      //     setIsAuthReady(true);
      //   }
      // };

      // handleAuth();
      // setAuth(authInstance);
      // setDb(dbInstance);

      // Set auth ready without Firebase
      setIsAuthReady(true);
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }, []);

  // Cleanup batch jobs on unmount
  useEffect(() => {
    return () => {
      cleanupBatchJobs();
    };
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
    loadDatasets();
  }, []);

  // Load datasets function
  const loadDatasets = async () => {
    try {
      const response = await fetch("http://localhost:8000/datasets");
      if (response.ok) {
        const datasetsData = await response.json();
        setDatasets(datasetsData);
      } else {
        console.error("Failed to load datasets:", response.status);
        setMessage("Failed to load datasets");
      }
    } catch (error) {
      console.error("Error loading datasets:", error);
      setMessage("Error loading datasets");
    }
  };

  // Load master data when project changes
  useEffect(() => {
    if (currentProject) {
      loadMasterData();
    }
  }, [currentProject]);

  // Project Management Functions
  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadMasterData = async () => {
    if (!currentProject) return;

    try {
      const data = await getMasterData(currentProject.id);
      setMasterData(data);
    } catch (error) {
      console.error("Error loading master data:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      const project = await createProject(
        newProjectName,
        newProjectDescription
      );
      setProjects((prev) => [...prev, project]);
      setCurrentProject(project);
      setShowProjectModal(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setMessage(`Project "${project.name}" created successfully`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setMessage(`Selected project: ${project.name}`);
  };

  const handleDataCorrected = (correctedData: any[]) => {
    setCorrectedData(correctedData);
    setMessage(`Data corrected: ${correctedData.length} items updated`);
  };

  const handleExportProjectExcel = async () => {
    if (!currentProject) return;

    try {
      const blob = await exportProjectToExcel(currentProject.id, "screen_cpu");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject.name}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage(`Exported Excel file for project: ${currentProject.name}`);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Failed to export Excel");
    }
  };

  const handleExcelUpload = async () => {
    if (!currentProject || !excelFile) return;

    try {
      const formData = new FormData();
      formData.append("file", excelFile);

      const response = await fetch(
        `http://localhost:8000/projects/${currentProject.id}/upload-excel`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload Excel");

      const result = await response.json();
      setMessage(result.message);
      setShowExcelUpload(false);
      setExcelFile(null);
      loadMasterData(); // Refresh master data
    } catch (error) {
      console.error("Error uploading Excel:", error);
      alert("Failed to upload Excel file");
    }
  };

  // Dataset Management Functions
  const handleDatasetUpload = async (
    files: File[],
    datasetName: string,
    description?: string
  ) => {
    try {
      // Process files using backend API
      let combinedData: any[] = [];

      for (const file of files) {
        try {
          // Use backend Excel processing
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("http://localhost:8000/upload-excel", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to process file");
          }

          const result = await response.json();
          if (result.success) {
            combinedData = [...combinedData, ...result.data];
          } else {
            throw new Error(result.message || "Failed to process file");
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Add a placeholder entry for failed files
          combinedData.push({
            filename: file.name,
            error: "Failed to process file",
            status: "error",
          });
        }
      }

      // Create dataset via API
      const response = await fetch("http://localhost:8000/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: datasetName,
          description: description || "",
          files: files.map((f) => f.name),
          data: combinedData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create dataset");
      }

      const dataset = await response.json();

      // Refresh datasets list
      await loadDatasets();

      // If this is the first dataset or user wants to select it
      if (datasets.length === 0) {
        setSelectedDataset(dataset);
      }

      setMessage(
        `Dataset "${datasetName}" created with ${combinedData.length} rows from ${files.length} files`
      );
    } catch (error) {
      console.error("Error creating dataset:", error);
      setMessage(
        `Error creating dataset: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const handleDatasetSelect = (dataset: any) => {
    setSelectedDataset(dataset);
    setMessage(`Selected dataset: ${dataset.name}`);
  };

  const handleUseDatasetAsMasterData = async () => {
    if (!selectedDataset || !currentProject) return;

    try {
      // Get the full dataset data
      const response = await fetch(
        `http://localhost:8000/datasets/${selectedDataset.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch dataset data");

      const datasetData = await response.json();

      // Convert dataset data to master data format
      const masterDataItems = datasetData.data.map(
        (item: any, index: number) => ({
          item_description:
            item.Item_Description ||
            item.item_description ||
            `Item ${index + 1}`,
          serial_number: item.Serial_Number || item.serial_number || "",
          tag_number: item.Tag_Number || item.tag_number || "",
          quantity: parseInt(item.Quantity || item.quantity || "1"),
          status: item.Status || item.status || "New",
        })
      );

      // Add to master data
      await addMasterData(currentProject.id, masterDataItems);
      await loadMasterData(); // Refresh master data

      setMessage(
        `Dataset "${selectedDataset.name}" added as master data: ${masterDataItems.length} items`
      );
    } catch (error) {
      console.error("Error using dataset as master data:", error);
      alert("Failed to add dataset as master data");
    }
  };

  // Handler functions
  const handleFileSelect = (file: File) => {
    setCurrentFile(file);
    setMessage(`File selected: ${file.name}`);
    setTableData([]);
    setExtractedText("");
    setImagePreviewUrl(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setShowImagePreview(true);
    }
  };

  const handleImportForComparison = async (file: File, dataset: 1 | 2) => {
    try {
      setIsLoading(true);
      const excelData = await parseExcelFile(file);

      if (dataset === 1) {
        setTableData(excelData.data);
      } else {
        setComparisonData(excelData.data);
      }

      setMessage(`Dataset ${dataset} loaded: ${excelData.data.length} rows`);
    } catch (error) {
      setMessage(
        `Error loading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportTable = async (file: File) => {
    try {
      setIsLoading(true);
      const excelData = await parseExcelFile(file);
      setTableData(excelData.data);
      setMessage(`Table imported: ${excelData.data.length} rows`);
    } catch (error) {
      setMessage(
        `Error importing file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTable = () => {
    try {
      const fileName = `${tableName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      exportToExcel(tableData, fileName, tableName);
      setMessage(`Data exported to Excel successfully as "${fileName}"!`);
    } catch (error) {
      setMessage(
        `Export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Export all tables to Excel
  const handleExportAllTables = () => {
    if (imageResults.length === 0) {
      setMessage("No tables to export.");
      return;
    }

    const tablesWithData = imageResults.filter(
      (result) => result.tableData && result.tableData.length > 0
    );

    if (tablesWithData.length === 0) {
      setMessage("No tables with data to export.");
      return;
    }

    // Export each table as a separate Excel file
    tablesWithData.forEach((result, index) => {
      const tableFilename = `Table_${index + 1}_${result.fileName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 20)}.xlsx`;
      exportToExcel(result.tableData, tableFilename, result.fileName);
    });

    setMessage(`Exported ${tablesWithData.length} tables to Excel files.`);
  };

  const handleFormatAsTable = async () => {
    if (!extractedText) {
      setMessage("No text to format. Please extract data from an image first.");
      return;
    }

    setIsLoading(true);
    setMessage("Formatting text as a table...");

    try {
      const parsedData = await formatTextAsTableWithFailover(
        extractedText,
        apiKeyStatuses
      );
      setTableData(parsedData);
      setMessage("Data formatted into a table successfully!");
    } catch (error) {
      console.error("Failed to format text as table:", error);
      setMessage(
        `Failed to format data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultipleFilesSelect = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      const imageFiles = selectedFiles.filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length > 100) {
        setMessage(
          "Maximum 100 images allowed. Only the first 100 images will be processed."
        );
        setFiles(imageFiles.slice(0, 100));
      } else {
        setFiles(imageFiles);
      }

      // Initialize results for all images
      const results: ImageResult[] = imageFiles
        .slice(0, 100)
        .map((file, index) => ({
          id: `image-${index}`,
          fileName: file.name,
          status: "pending",
          extractedText: "",
          tableData: [],
        }));

      setImageResults(results);
      setMessage(
        `${Math.min(imageFiles.length, 100)} images selected for processing.`
      );

      // Clear single file selection
      setCurrentFile(null);
      setImagePreviewUrl(null);
      setTableData([]);
      setExtractedText("");
    }
  };

  // Handle image naming confirmation
  const handleImageNamingConfirm = (names: { [key: string]: string }) => {
    setImageNames(names);
    const imageFiles = pendingFiles;
    setFiles(imageFiles);

    // Initialize results for all images
    const results: ImageResult[] = imageFiles.map((file, index) => {
      const fileKey = `${file.name}-${file.size}`;
      const displayName = names[fileKey] || file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      return {
        id: `image-${index}`,
        fileName: displayName,
        status: "pending",
        extractedText: "",
        tableData: [],
      };
    });

    setImageResults(results);
    setMessage(`${imageFiles.length} images selected for processing.`);

    // Clear single file selection
    setCurrentFile(null);
    setShowImageNaming(false);
  };

  // Start batch processing with backend
  const handleStartBatchProcessing = async () => {
    if (files.length === 0) {
      setMessage("Please select images to process.");
      return;
    }

    try {
      setIsProcessing(true);
      setMessage("Starting batch processing...");

      const job = await createBatchJob(files, {
        maxConcurrent: 5,
        maxRetries: 3,
        retryDelay: 2000,
        onProgress: (job) => {
          setCurrentBatchJob(job);
          setMessage(
            `Processing: ${job.completedImages + job.failedImages}/${
              job.totalImages
            } images completed`
          );
        },
        onComplete: (job) => {
          setCurrentBatchJob(job);
          setBatchResults(job.results);
          setMessage(
            `Batch processing completed: ${job.completedImages} successful, ${job.failedImages} failed`
          );
          setIsProcessing(false);
        },
        onError: (error) => {
          console.error("Batch processing error:", error);
          setMessage(`Batch processing error: ${error.message}`);
          setIsProcessing(false);
        },
      });

      setCurrentBatchJob(job);
      setBatchJobs((prev) => [...prev, job]);
    } catch (error) {
      console.error("Error starting batch processing:", error);
      setMessage(
        `Error starting batch processing: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsProcessing(false);
    }
  };

  // Retry failed images
  const handleRetryFailedImages = async () => {
    if (!currentBatchJob) return;

    try {
      setIsProcessing(true);
      setMessage("Retrying failed images...");

      // Reset failed results to pending
      const updatedResults = batchResults.map((result) =>
        result.status === "failed"
          ? {
              ...result,
              status: "pending" as const,
              retryCount: 0,
              errorMessage: undefined,
            }
          : result
      );

      setBatchResults(updatedResults);
      setMessage("Retrying failed images...");
    } catch (error) {
      console.error("Error retrying failed images:", error);
      setMessage(
        `Error retrying failed images: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsProcessing(false);
    }
  };

  // Cancel batch processing
  const handleCancelBatchProcessing = () => {
    if (currentBatchJob) {
      cancelBatchJob(currentBatchJob.id);
      setMessage("Batch processing cancelled");
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setCurrentFile(null);
    setFiles([]);
    setImageResults([]);
    setImagePreviewUrl(null);
    setMessage("");
    setTableData([]);
    setComparisonData([]);
    setExtractedText("");
    setProcessingProgress(0);
    setCurrentProcessingFile("");
    setShowImagePreview(false);
  };

  // Extract text from image and automatically format as table
  const handleExtractText = async () => {
    if (!currentFile || !currentFile.type.startsWith("image/")) {
      setMessage("Please select an image file to analyze.");
      return;
    }

    setIsLoading(true);
    setMessage("Extracting data from image...");

    try {
      // Use backend endpoint for image extraction
      const formData = new FormData();
      formData.append("file", currentFile);

      const response = await fetch("http://localhost:8000/extract-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to extract image data");
      }

      const result = await response.json();

      if (result.success) {
        setExtractedText(result.extracted_text);
        setTableData(result.table_data);
        setMessage(
          `Data extracted and formatted successfully! Found ${result.item_count} items.`
        );

        // Show the table data in the UI
        if (result.table_data && result.table_data.length > 0) {
          setShowImagePreview(true);
        }
      } else {
        throw new Error("Image extraction failed");
      }
    } catch (error) {
      console.error("Failed to extract text from image:", error);
      setMessage(
        `Failed to extract data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Batch processing for multiple images
  const processBatchImages = async () => {
    if (files.length === 0) {
      setMessage("Please select images to process.");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setMessage("Starting batch processing...");

    const batchSize = 5; // Process 5 images concurrently
    const batches = [];

    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    let processedCount = 0;
    const totalFiles = files.length;
    let allExtractedData: Record<string, any>[] = [];

    for (const batch of batches) {
      const promises = batch.map(async (file, batchIndex) => {
        const globalIndex = processedCount + batchIndex;
        const resultId = `image-${globalIndex}`;

        setCurrentProcessingFile(file.name);

        // Update result status to processing
        setImageResults((prev) =>
          prev.map((result) =>
            result.id === resultId
              ? { ...result, status: "processing" }
              : result
          )
        );

        const startTime = Date.now();

        try {
          const extractedText = await extractTextFromImageWithFailover(
            file,
            apiKeyStatuses
          );
          const processingTime = Date.now() - startTime;

          // Automatically try to format as table
          let tableData: Record<string, any>[] = [];
          try {
            tableData = await formatTextAsTableWithFailover(
              extractedText,
              apiKeyStatuses
            );
            console.log(
              `Successfully formatted table for ${file.name}:`,
              tableData.length,
              "items"
            );
            console.log("Table data:", tableData);

            // Add to combined extracted data
            allExtractedData = [...allExtractedData, ...tableData];
          } catch (formatError) {
            console.log(
              `Table formatting failed for ${file.name}, will show raw text`
            );
            console.error("Format error:", formatError);
          }

          // Update result with success
          setImageResults((prev) =>
            prev.map((result) =>
              result.id === resultId
                ? {
                    ...result,
                    status: "completed",
                    extractedText,
                    tableData,
                    processingTime,
                    apiKeyUsed: getWorkingApiKey(apiKeyStatuses) || "unknown",
                  }
                : result
            )
          );
        } catch (error) {
          // Update result with error
          setImageResults((prev) =>
            prev.map((result) =>
              result.id === resultId
                ? {
                    ...result,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : result
            )
          );
        }
      });

      await Promise.all(promises);
      processedCount += batch.length;
      setProcessingProgress((processedCount / totalFiles) * 100);
    }

    // Update the main extracted data with all combined table data
    console.log("Final combined extracted data:", allExtractedData);
    setTableData(allExtractedData);

    setIsProcessing(false);
    setCurrentProcessingFile("");
    setMessage(
      `Batch processing completed! Processed ${processedCount} images and extracted ${allExtractedData.length} items.`
    );
  };

  // Format individual image result as table
  const formatImageResultAsTable = async (resultId: string) => {
    const result = imageResults.find((r) => r.id === resultId);
    if (!result || !result.extractedText) return;

    setImageResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, status: "processing" } : r))
    );

    try {
      const tableData = await formatTextAsTableWithFailover(
        result.extractedText,
        apiKeyStatuses
      );
      setImageResults((prev) =>
        prev.map((r) =>
          r.id === resultId ? { ...r, tableData, status: "completed" } : r
        )
      );
    } catch (error) {
      setImageResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? {
                ...r,
                status: "error",
                error: `Table formatting failed: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              }
            : r
        )
      );
    }
  };

  const workingApiKeys = apiKeyStatuses.filter((s) => s.isWorking).length;
  const totalApiKeys = apiKeyStatuses.length;

  return (
    <Box
      style={{ minHeight: "100vh", backgroundColor: "#EEF5FF" }}
      className="flex"
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentProject={currentProject}
        masterDataCount={masterData.length}
        apiKeyStatuses={apiKeyStatuses.map((status) => ({
          status: status.isWorking ? "working" : "error",
          isWorking: status.isWorking,
        }))}
        datasets={datasets}
        onDatasetUpload={handleDatasetUpload}
        onDatasetSelect={handleDatasetSelect}
        selectedDataset={selectedDataset}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Main Content */}
      <Box
        style={{
          flex: 1,
          marginLeft: isSidebarCollapsed ? "60px" : "280px", // Dynamic margin based on sidebar state
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
        }}
        className="flex flex-col"
      >
        {/* Sticky Header */}
        <Paper
          shadow="sm"
          style={{
            backgroundColor: "#B4D4FF",
            borderBottom: "1px solid #86B6F6",
            borderRadius: 0,
            position: "sticky",
            top: 0,
            zIndex: 100,
            minHeight: 0,
            padding: 0,
          }}
        >
          <Container
            size="xl"
            py={8}
            px="xs"
            style={{ minHeight: 0, paddingTop: 8, paddingBottom: 8 }}
          >
            <Group
              justify="space-between"
              align="center"
              style={{ minHeight: 0 }}
            >
              <Stack gap={7} style={{ minHeight: 0 }}>
                <Title
                  order={3}
                  style={{
                    color: "#176B87",
                    fontFamily: "Inter Tight, sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    margin: 0,
                  }}
                >
                  {activeTab === "extract" && "Data Extraction & Correction"}
                  {activeTab === "compare" && "Data Comparison"}
                  {activeTab === "projects" && "Project Management"}
                  {activeTab === "tools" && "Tools & Utilities"}
                  {activeTab === "search" && "Search Datasets"}
                </Title>
                <Text
                  size="xs"
                  style={{
                    color: "#176B87",
                    opacity: 0.8,
                    fontFamily: "Inter Tight, sans-serif",
                    fontSize: "12px",
                  }}
                >
                  {activeTab === "extract" &&
                    "Extract data from images and correct with master dataset"}
                  {activeTab === "compare" &&
                    "Compare and validate extracted data"}
                  {activeTab === "projects" &&
                    "Manage your projects and datasets"}
                  {activeTab === "tools" && "Additional tools and utilities"}
                  {activeTab === "search" &&
                    "Search across all datasets and master data"}
                </Text>
              </Stack>

              {/* API Status in Header */}
              <Group gap="sm">
                <Group gap="xs" align="center">
                  <Text
                    size="xs"
                    style={{
                      color: "#176B87",
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      minHeight: 0,
                    }}
                  >
                    API Keys:
                  </Text>
                  <Badge
                    color={workingApiKeys > 0 ? "green" : "red"}
                    variant="light"
                    size="xs"
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      minHeight: 0,
                    }}
                  >
                    {workingApiKeys}/{totalApiKeys}
                  </Badge>
                </Group>
                {message && (
                  <Badge
                    color="blue"
                    variant="light"
                    size="xs"
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      fontSize: "11px",
                      minHeight: 0,
                    }}
                  >
                    {message}
                  </Badge>
                )}
              </Group>
            </Group>
          </Container>
        </Paper>

        {/* Main Content Area */}
        <Container size="xl" py="md" px="md" style={{ flex: 1 }}>
          {/* Main Content */}
          <Stack gap="lg">
            {/* {activeTab === "projects" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Project Management
                    </h3>
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Create New Project
                    </button>
                  </div>

                  {currentProject ? (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            {currentProject.name}
                          </h4>
                          <p className="text-sm text-blue-700">
                            {currentProject.description}
                          </p>
                          <p className="text-xs text-blue-600">
                            {masterData.length} items in master data
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentProject(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>
                        No project selected. Create a new project or select an
                        existing one.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          currentProject?.id === project.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">
                          {project.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {project.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {project.master_data_count} items
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {currentProject && (
                  <MasterDataManager
                    projectId={currentProject.id}
                    onDataUpdated={loadMasterData}
                  />
                )}


                {currentProject &&
                  tableData.length > 0 &&
                  activeTab === "projects" && (
                    <DataMatching
                      extractedData={tableData}
                      projectId={currentProject.id}
                      onDataCorrected={handleDataCorrected}
                      onExportExcel={handleExportProjectExcel}
                      selectedDataset={selectedDataset}
                      datasets={datasets}
                    />
                  )}
              </div>
            )} */}
            {activeTab === "extract" && (
              <ProjectWorkflow
                currentProject={currentProject}
                masterData={masterData}
                onProjectSelect={handleSelectProject}
                onProjectDeselect={() => setCurrentProject(null)}
                onMasterDataUpdate={loadMasterData}
                onDataCorrected={handleDataCorrected}
                onExportExcel={handleExportProjectExcel}
                extractedData={tableData}
                onExtractedDataChange={setTableData}
                onFilesSelect={handleMultipleFilesSelect}
                onFilesClear={handleClear}
                files={files}
                isProcessing={isProcessing}
                processingProgress={processingProgress}
                onStartProcessing={processBatchImages}
                imageResults={imageResults}
                selectedDataset={selectedDataset}
                datasets={datasets}
              />
            )}

            {activeTab === "projects" && (
              <div className="space-y-4">
                {/* Project Selection for Projects Tab */}
                <Card
                  shadow="lg"
                  radius="xl"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #86B6F6",
                    marginBottom: "24px",
                  }}
                  p="xl"
                >
                  <Group justify="space-between" mb="xl">
                    <Stack gap="xs">
                      <Title
                        order={2}
                        style={{
                          color: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        Project & Dataset
                      </Title>
                      <Text
                        size="sm"
                        style={{
                          color: "#176B87",
                          opacity: 0.8,
                          fontFamily: "Inter Tight, sans-serif",
                        }}
                      >
                        Manage your projects and master datasets
                      </Text>
                    </Stack>
                    <Group gap="md">
                      <Button
                        onClick={() => setShowProjectModal(true)}
                        style={{
                          backgroundColor: "#176B87",
                          fontFamily: "Inter Tight, sans-serif",
                          fontWeight: 600,
                        }}
                        radius="lg"
                        size="sm"
                      >
                        + Create Project
                      </Button>
                      {currentProject && (
                        <Button
                          onClick={() => setShowExcelUpload(true)}
                          style={{
                            backgroundColor: "#86B6F6",
                            color: "#176B87",
                            fontFamily: "Inter Tight, sans-serif",
                            fontWeight: 600,
                          }}
                          radius="lg"
                          size="sm"
                        >
                          📊 Upload Dataset
                        </Button>
                      )}
                      {currentProject && selectedDataset && (
                        <Button
                          onClick={handleUseDatasetAsMasterData}
                          style={{
                            backgroundColor: "#176B87",
                            color: "white",
                            fontFamily: "Inter Tight, sans-serif",
                            fontWeight: 600,
                          }}
                          radius="lg"
                          size="sm"
                        >
                          📋 Use as Master Data
                        </Button>
                      )}
                    </Group>
                  </Group>

                  {currentProject ? (
                    <Paper
                      style={{
                        background:
                          "linear-gradient(135deg, #B4D4FF 0%, #86B6F6 100%)",
                        border: "1px solid #86B6F6",
                        borderRadius: "16px",
                      }}
                      p="lg"
                    >
                      <Group justify="space-between">
                        <Group gap="md">
                          <Avatar
                            size="lg"
                            style={{
                              backgroundColor: "#176B87",
                              borderRadius: "12px",
                            }}
                          >
                            📁
                          </Avatar>
                          <Stack gap="xs">
                            <Title
                              order={3}
                              style={{
                                color: "#176B87",
                                fontFamily: "Inter Tight, sans-serif",
                                fontWeight: 700,
                              }}
                            >
                              {currentProject.name}
                            </Title>
                            <Text
                              size="sm"
                              style={{
                                color: "#176B87",
                                opacity: 0.8,
                                fontFamily: "Inter Tight, sans-serif",
                              }}
                            >
                              {currentProject.description}
                            </Text>
                            <Group gap="lg">
                              <Group gap="xs">
                                <Badge color="green" variant="light" size="sm">
                                  {masterData.length} items
                                </Badge>
                                <Text
                                  size="xs"
                                  style={{
                                    color: "#176B87",
                                    opacity: 0.7,
                                    fontFamily: "Inter Tight, sans-serif",
                                  }}
                                >
                                  Created:{" "}
                                  {new Date(
                                    currentProject.created_at
                                  ).toLocaleDateString()}
                                </Text>
                              </Group>
                            </Group>
                          </Stack>
                        </Group>
                        <ActionIcon
                          onClick={() => setCurrentProject(null)}
                          style={{
                            color: "#176B87",
                            backgroundColor: "rgba(23, 107, 135, 0.1)",
                          }}
                          radius="lg"
                          size="lg"
                        >
                          <X size={20} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ) : (
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <Avatar
                          size="xl"
                          style={{
                            backgroundColor: "#B4D4FF",
                            color: "#176B87",
                          }}
                        >
                          📂
                        </Avatar>
                        <Stack align="center" gap="xs">
                          <Title
                            order={3}
                            style={{
                              color: "#176B87",
                              fontFamily: "Inter Tight, sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            No Project Selected
                          </Title>
                          <Text
                            size="sm"
                            style={{
                              color: "#176B87",
                              opacity: 0.7,
                              fontFamily: "Inter Tight, sans-serif",
                              textAlign: "center",
                            }}
                          >
                            Create a new project or select an existing one to
                            start extracting data
                          </Text>
                        </Stack>
                      </Stack>
                    </Center>
                  )}

                  {/* Selected Dataset Info */}
                  {selectedDataset && (
                    <Paper
                      style={{
                        background:
                          "linear-gradient(135deg, #EEF5FF 0%, #B4D4FF 100%)",
                        border: "1px solid #86B6F6",
                        borderRadius: "16px",
                        marginBottom: "24px",
                      }}
                      p="lg"
                    >
                      <Group justify="space-between" mb="md">
                        <Group gap="md">
                          <Avatar
                            size="lg"
                            style={{
                              backgroundColor: "#176B87",
                              borderRadius: "12px",
                            }}
                          >
                            📊
                          </Avatar>
                          <Stack gap="xs">
                            <Title
                              order={3}
                              style={{
                                color: "#176B87",
                                fontFamily: "Inter Tight, sans-serif",
                                fontWeight: 700,
                              }}
                            >
                              {selectedDataset.name}
                            </Title>
                            <Text
                              size="sm"
                              style={{
                                color: "#176B87",
                                opacity: 0.8,
                                fontFamily: "Inter Tight, sans-serif",
                              }}
                            >
                              {selectedDataset.description}
                            </Text>
                            <Group gap="lg">
                              <Group gap="xs">
                                <Badge color="blue" variant="light" size="sm">
                                  {selectedDataset.fileCount} files
                                </Badge>
                                <Badge color="green" variant="light" size="sm">
                                  {selectedDataset.totalRows} rows
                                </Badge>
                              </Group>
                              <Text
                                size="xs"
                                style={{
                                  color: "#176B87",
                                  opacity: 0.7,
                                  fontFamily: "Inter Tight, sans-serif",
                                }}
                              >
                                Created:{" "}
                                {new Date(
                                  selectedDataset.created_at
                                ).toLocaleDateString()}
                              </Text>
                            </Group>
                          </Stack>
                        </Group>
                        <ActionIcon
                          onClick={() => setSelectedDataset(null)}
                          style={{
                            color: "#176B87",
                            backgroundColor: "rgba(23, 107, 135, 0.1)",
                          }}
                          radius="lg"
                          size="lg"
                        >
                          <X size={20} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  )}

                  {/* Project List */}
                  <SimpleGrid
                    cols={{ base: 1, md: 2, lg: 3 }}
                    spacing="sm"
                    mt="lg"
                  >
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        style={{
                          cursor: "pointer",
                          border:
                            currentProject?.id === project.id
                              ? "2px solid #176B87"
                              : "2px solid #B4D4FF",
                          backgroundColor:
                            currentProject?.id === project.id
                              ? "linear-gradient(135deg, #B4D4FF 0%, #86B6F6 100%)"
                              : "white",
                          transition: "all 0.2s ease",
                          borderRadius: "16px",
                        }}
                        p="lg"
                        shadow={currentProject?.id === project.id ? "lg" : "sm"}
                        className="hover:shadow-md"
                      >
                        <Group justify="space-between" mb="md">
                          <Avatar
                            size="md"
                            style={{
                              backgroundColor: "#B4D4FF",
                              color: "#176B87",
                              borderRadius: "8px",
                            }}
                          >
                            📁
                          </Avatar>
                          {currentProject?.id === project.id && (
                            <Badge
                              color="blue"
                              variant="filled"
                              size="sm"
                              style={{ backgroundColor: "#176B87" }}
                            >
                              ✓
                            </Badge>
                          )}
                        </Group>
                        <Stack gap="xs">
                          <Title
                            order={4}
                            style={{
                              color: "#176B87",
                              fontFamily: "Inter Tight, sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {project.name}
                          </Title>
                          <Text
                            size="xs"
                            style={{
                              color: "#176B87",
                              opacity: 0.7,
                              fontFamily: "Inter Tight, sans-serif",
                              lineHeight: 1.4,
                            }}
                            lineClamp={2}
                          >
                            {project.description}
                          </Text>
                          <Group justify="space-between" mt="sm">
                            <Group gap="xs">
                              <Badge color="green" variant="light" size="xs">
                                {project.master_data_count} items
                              </Badge>
                            </Group>
                            <Text
                              size="xs"
                              style={{
                                color: "#176B87",
                                opacity: 0.6,
                                fontFamily: "Inter Tight, sans-serif",
                              }}
                            >
                              {new Date(
                                project.created_at
                              ).toLocaleDateString()}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Card>
              </div>
            )}

            {activeTab === "compare" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* First Dataset */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Dataset 1
                    </h2>
                    <FileUpload
                      onFileSelect={(file) =>
                        handleImportForComparison(file, 1)
                      }
                      onMultipleFilesSelect={() => {}}
                      onClear={() => setTableData([])}
                      hasFiles={tableData.length > 0}
                    />
                    {tableData.length > 0 && (
                      <div className="mt-4">
                        <ExcelLikeTable
                          data={tableData}
                          onDataChange={setTableData}
                          title={comparisonTableName1}
                          onTitleChange={setComparisonTableName1}
                        />
                      </div>
                    )}
                  </div>

                  {/* Second Dataset */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Dataset 2
                    </h2>
                    <FileUpload
                      onFileSelect={(file) =>
                        handleImportForComparison(file, 2)
                      }
                      onMultipleFilesSelect={() => {}}
                      onClear={() => setComparisonData([])}
                      hasFiles={comparisonData.length > 0}
                    />
                    {comparisonData.length > 0 && (
                      <div className="mt-4">
                        <ExcelLikeTable
                          data={comparisonData}
                          onDataChange={setComparisonData}
                          title={comparisonTableName2}
                          onTitleChange={setComparisonTableName2}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparison Results */}
                {(tableData.length > 0 || comparisonData.length > 0) && (
                  <DataComparison
                    data1={tableData}
                    data2={comparisonData}
                    title1="Dataset 1"
                    title2="Dataset 2"
                  />
                )}
              </div>
            )}

            {activeTab === "tools" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Data Tools
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                      <h3 className="font-medium text-gray-800">
                        Data Validation
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Validate data integrity and format
                      </p>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                      <h3 className="font-medium text-gray-800">
                        Data Cleaning
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Clean and standardize data
                      </p>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                      <h3 className="font-medium text-gray-800">
                        Data Analysis
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Generate insights and statistics
                      </p>
                    </button>
                  </div>
                </div>

                {/* Batch Processing Results */}
                {batchResults.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-md font-semibold text-gray-800">
                      Batch Processing Results
                    </h3>
                    <div className="grid gap-4">
                      {batchResults.map((result, index) => (
                        <div
                          key={result.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">
                              {result.filename}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  result.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : result.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : result.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {result.status}
                              </span>
                              {result.retryCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  Retries: {result.retryCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {result.status === "completed" &&
                            result.tableData &&
                            result.tableData.length > 0 && (
                              <div className="mt-2">
                                <ExcelLikeTable
                                  data={result.tableData}
                                  title={result.filename}
                                  className="max-h-64"
                                />
                              </div>
                            )}

                          {result.status === "failed" &&
                            result.errorMessage && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                Error: {result.errorMessage}
                              </div>
                            )}

                          {result.status === "processing" && (
                            <div className="mt-2 flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm text-gray-600">
                                Processing...
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Retry Failed Images */}
                    {batchResults.some(
                      (result) => result.status === "failed"
                    ) && (
                      <div className="flex justify-center">
                        <button
                          onClick={handleRetryFailedImages}
                          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                        >
                          Retry Failed Images
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "search" && (
              <SearchPage
                datasets={datasets}
                projects={projects}
                onExportResults={(results) => {
                  // Handle export results if needed
                  console.log("Exporting results:", results);
                }}
              />
            )}
          </Stack>
        </Container>
      </Box>

      {/* Image Naming Modal */}
      <ImageNamingModal
        isOpen={showImageNaming}
        onClose={() => setShowImageNaming(false)}
        onConfirm={handleImageNamingConfirm}
        files={pendingFiles}
      />

      {/* Project Creation Modal */}
      <Modal
        opened={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create New Project"
        size="md"
        centered
        radius="xl"
        styles={{
          header: {
            backgroundColor: "#B4D4FF",
            borderBottom: "1px solid #86B6F6",
          },
          body: {
            backgroundColor: "white",
          },
        }}
      >
        <Stack gap="lg">
          <TextInput
            label="Project Name"
            placeholder="Enter project name (e.g., Health Center Inventory)"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
            radius="lg"
            styles={{
              label: {
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              },
              input: {
                borderColor: "#86B6F6",
                fontFamily: "Inter Tight, sans-serif",
                "&:focus": {
                  borderColor: "#176B87",
                },
              },
            }}
          />

          <Textarea
            label="Description"
            placeholder="Enter project description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            rows={4}
            radius="lg"
            styles={{
              label: {
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              },
              input: {
                borderColor: "#86B6F6",
                fontFamily: "Inter Tight, sans-serif",
                "&:focus": {
                  borderColor: "#176B87",
                },
              },
            }}
          />
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button
            onClick={() => setShowProjectModal(false)}
            variant="outline"
            radius="lg"
            style={{
              borderColor: "#86B6F6",
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            radius="lg"
            style={{
              backgroundColor: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
          >
            Create Project
          </Button>
        </Group>
      </Modal>

      {/* Excel Upload Modal */}
      <Modal
        opened={showExcelUpload}
        onClose={() => setShowExcelUpload(false)}
        title="Upload Master Dataset"
        size="md"
        centered
        radius="xl"
        styles={{
          header: {
            backgroundColor: "#B4D4FF",
            borderBottom: "1px solid #86B6F6",
          },
          body: {
            backgroundColor: "white",
          },
        }}
      >
        <Stack gap="lg">
          <FileInput
            label="Excel File"
            placeholder="Click to select Excel file"
            accept=".xlsx,.xls"
            value={excelFile}
            onChange={setExcelFile}
            required
            radius="lg"
            styles={{
              label: {
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
              },
              input: {
                borderColor: "#86B6F6",
                fontFamily: "Inter Tight, sans-serif",
                "&:focus": {
                  borderColor: "#176B87",
                },
              },
            }}
          />

          <Paper
            style={{
              backgroundColor: "#B4D4FF",
              border: "1px solid #86B6F6",
              borderRadius: "12px",
            }}
            p="md"
          >
            <Title
              order={4}
              style={{
                color: "#176B87",
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              Supported Formats:
            </Title>
            <Stack gap="xs">
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                • <strong>Screen/CPU format:</strong> Like your example with
                separate columns
              </Text>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                • <strong>Standard format:</strong> Item_Description,
                Serial_Number, Tag_Number
              </Text>
              <Text
                size="sm"
                style={{
                  color: "#176B87",
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                • <strong>Files:</strong> .xlsx, .xls
              </Text>
            </Stack>
          </Paper>
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button
            onClick={() => setShowExcelUpload(false)}
            variant="outline"
            radius="lg"
            style={{
              borderColor: "#86B6F6",
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExcelUpload}
            disabled={!excelFile}
            radius="lg"
            style={{
              backgroundColor: "#86B6F6",
              color: "#176B87",
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 600,
            }}
          >
            Upload Dataset
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
