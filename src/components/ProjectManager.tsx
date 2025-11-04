"use client";

import React, { useState } from "react";
import {
  Plus,
  Folder,
  FileSpreadsheet,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import ExcelLikeTable from "./ExcelLikeTable";

interface Project {
  id: string;
  name: string;
  description: string;
  tables: TableData[];
  createdAt: Date;
  updatedAt: Date;
}

interface TableData {
  id: string;
  name: string;
  data: Record<string, any>[];
  source: string; // 'image' | 'excel' | 'manual'
  originalFile?: File;
}

interface ProjectManagerProps {
  onExportProject?: (project: Project) => void;
  onImportExcel?: (file: File) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  onExportProject,
  onImportExcel,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [showTablePreview, setShowTablePreview] = useState<string | null>(null);

  const createProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      tables: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjects((prev) => [...prev, newProject]);
    setCurrentProject(newProject);
    setNewProjectName("");
    setNewProjectDescription("");
    setShowCreateProject(false);
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    setSelectedTables(new Set());
  };

  const addTableToProject = (tableData: TableData) => {
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      tables: [...currentProject.tables, tableData],
      updatedAt: new Date(),
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === currentProject.id ? updatedProject : p))
    );
    setCurrentProject(updatedProject);
  };

  const removeTableFromProject = (tableId: string) => {
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      tables: currentProject.tables.filter((t) => t.id !== tableId),
      updatedAt: new Date(),
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === currentProject.id ? updatedProject : p))
    );
    setCurrentProject(updatedProject);
  };

  const updateTableData = (tableId: string, data: Record<string, any>[]) => {
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      tables: currentProject.tables.map((t) =>
        t.id === tableId ? { ...t, data } : t
      ),
      updatedAt: new Date(),
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === currentProject.id ? updatedProject : p))
    );
    setCurrentProject(updatedProject);
  };

  const handleTableSelect = (tableId: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId);
    } else {
      newSelected.add(tableId);
    }
    setSelectedTables(newSelected);
  };

  const handleSelectAllTables = () => {
    if (!currentProject) return;

    if (selectedTables.size === currentProject.tables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(currentProject.tables.map((t) => t.id)));
    }
  };

  const exportSelectedTables = () => {
    if (!currentProject || selectedTables.size === 0) return;

    const selectedTableData = currentProject.tables.filter((t) =>
      selectedTables.has(t.id)
    );
    const exportData = {
      project: currentProject,
      tables: selectedTableData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject.name}_tables.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportProject = () => {
    if (!currentProject || onExportProject) return;
    onExportProject(currentProject);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar - Project List */}
      <div className="w-80 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            <Plus size={16} />
            <span>New</span>
          </button>
        </div>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={createProject}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateProject(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project List */}
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                currentProject?.id === project.id
                  ? "bg-blue-100 border-blue-300"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => selectProject(project)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder size={16} className="text-blue-500" />
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {project.tables.length} tables
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Import Excel */}
        <div className="mt-6 p-4 border border-gray-300 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Import Excel</h4>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer text-sm"
          >
            <Upload size={16} />
            <span>Upload Excel File</span>
          </label>
        </div>
      </div>

      {/* Main Content - Project Details */}
      <div className="flex-1 p-6 overflow-y-auto">
        {currentProject ? (
          <div>
            {/* Project Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentProject.name}
                </h2>
                <p className="text-gray-600">{currentProject.description}</p>
                <p className="text-sm text-gray-500">
                  Created: {currentProject.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportSelectedTables}
                  disabled={selectedTables.size === 0}
                  className="flex items-center space-x-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  <span>Export Selected</span>
                </button>
                <button
                  onClick={exportProject}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Download size={16} />
                  <span>Export Project</span>
                </button>
              </div>
            </div>

            {/* Tables List */}
            <div className="space-y-4">
              {currentProject.tables.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedTables.size === currentProject.tables.length &&
                        currentProject.tables.length > 0
                      }
                      onChange={handleSelectAllTables}
                    />
                    <span className="text-sm text-gray-600">
                      Select All ({selectedTables.size} selected)
                    </span>
                  </div>
                </div>
              )}

              {currentProject.tables.map((table) => (
                <div
                  key={table.id}
                  className="border border-gray-300 rounded-lg"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTables.has(table.id)}
                        onChange={() => handleTableSelect(table.id)}
                      />
                      <FileSpreadsheet size={16} className="text-green-500" />
                      <h3 className="font-medium text-gray-800">
                        {table.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({table.data.length} rows)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setShowTablePreview(
                            showTablePreview === table.id ? null : table.id
                          )
                        }
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {showTablePreview === table.id ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => removeTableFromProject(table.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {showTablePreview === table.id && (
                    <div className="p-4">
                      <ExcelLikeTable
                        data={table.data}
                        title={table.name}
                        onDataChange={(data) => updateTableData(table.id, data)}
                        onDelete={() => removeTableFromProject(table.id)}
                        className="max-h-96"
                      />
                    </div>
                  )}
                </div>
              ))}

              {currentProject.tables.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileSpreadsheet
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>No tables in this project yet.</p>
                  <p className="text-sm">
                    Add tables by processing images or importing Excel files.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Folder size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No project selected.</p>
            <p className="text-sm">
              Create a new project or select an existing one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
