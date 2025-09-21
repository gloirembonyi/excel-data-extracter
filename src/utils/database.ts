// Database utilities for Neon DB integration

export interface MasterDataItem {
  id: string;
  item_description: string;
  serial_number: string;
  tag_number: string;
  quantity: number;
  status: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  master_data_count: number;
}

export interface DataMatch {
  item: MasterDataItem;
  confidence: number;
  match_type: 'exact' | 'partial' | 'serial_only' | 'tag_only';
}

export class DatabaseManager {
  private dbUrl: string;
  private apiUrl: string;

  constructor() {
    this.dbUrl = process.env.NEXT_PUBLIC_NEON_DB_URL || '';
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // Project Management
  async createProject(name: string, description?: string): Promise<Project> {
    const response = await fetch(`${this.apiUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  }

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.apiUrl}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  }

  async getProject(projectId: string): Promise<Project> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  }

  // Master Data Management
  async addMasterData(projectId: string, data: Omit<MasterDataItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/master-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to add master data');
  }

  async getMasterData(projectId: string): Promise<MasterDataItem[]> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/master-data`);
    if (!response.ok) throw new Error('Failed to fetch master data');
    return response.json();
  }

  async updateMasterData(projectId: string, itemId: string, updates: Partial<MasterDataItem>): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/master-data/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error('Failed to update master data');
  }

  async deleteMasterData(projectId: string, itemId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/master-data/${itemId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete master data');
  }

  // Data Matching
  async findMatches(projectId: string, extractedData: any[]): Promise<DataMatch[][]> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/match-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extractedData })
    });
    
    if (!response.ok) throw new Error('Failed to find matches');
    return response.json();
  }

  // Excel Export
  async exportToExcel(projectId: string, format: 'screen_cpu' | 'unified' = 'screen_cpu'): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/export-excel?format=${format}`);
    if (!response.ok) throw new Error('Failed to export Excel');
    return response.blob();
  }

  // Data Validation
  async validateData(projectId: string, data: any[]): Promise<{
    valid: any[];
    invalid: any[];
    suggestions: { [key: string]: MasterDataItem[] };
  }> {
    const response = await fetch(`${this.apiUrl}/projects/${projectId}/validate-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to validate data');
    return response.json();
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();

// Utility functions
export const createProject = (name: string, description?: string) => dbManager.createProject(name, description);
export const getProjects = () => dbManager.getProjects();
export const getProject = (projectId: string) => dbManager.getProject(projectId);
export const addMasterData = (projectId: string, data: Omit<MasterDataItem, 'id' | 'created_at' | 'updated_at'>[]) => 
  dbManager.addMasterData(projectId, data);
export const getMasterData = (projectId: string) => dbManager.getMasterData(projectId);
export const findMatches = (projectId: string, extractedData: any[]) => dbManager.findMatches(projectId, extractedData);
export const exportToExcel = (projectId: string, format?: 'screen_cpu' | 'unified') => dbManager.exportToExcel(projectId, format);
