"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Edit3,
  Save,
  X,
} from "lucide-react";

interface ExcelTableProps {
  data: Record<string, any>[];
  onDataChange?: (data: Record<string, any>[]) => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  title?: string;
  editable?: boolean;
  onTitleChange?: (title: string) => void;
}

export default function ExcelTable({
  data,
  onDataChange,
  onExport,
  onImport,
  title = "Data Table",
  editable = true,
  onTitleChange,
}: ExcelTableProps) {
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localData, setLocalData] = useState(data);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCellClick = (rowIndex: number, colKey: string) => {
    if (!editable) return;
    setEditingCell({ row: rowIndex, col: colKey });
    setEditValue(String(localData[rowIndex][colKey] || ""));
  };

  const handleCellEdit = (value: string) => {
    setEditValue(value);
  };

  const handleCellSave = () => {
    if (editingCell) {
      const newData = [...localData];
      newData[editingCell.row][editingCell.col] = editValue;
      setLocalData(newData);
      onDataChange?.(newData);
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  const handleTitleClick = () => {
    if (onTitleChange) {
      setEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (onTitleChange) {
      onTitleChange(titleValue);
    }
    setEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(title);
    setEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
        <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-500 mb-4">
          Upload an image or import an Excel file to get started
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  const headers = Object.keys(localData[0] || {});

  return (
    <div
      className="bg-white border border-gray-300 rounded-lg overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyPress}
              onBlur={handleTitleSave}
              className="text-lg font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleTitleSave}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleTitleCancel}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h3
            className="text-lg font-semibold text-gray-800 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
            onClick={handleTitleClick}
            title={onTitleChange ? "Click to edit title" : ""}
          >
            {title}
            {onTitleChange && (
              <Edit3 className="w-4 h-4 inline ml-2 text-gray-500" />
            )}
          </h3>
        )}
        <div className="flex gap-2">
          {onImport && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-96">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-200 w-8">
                #
              </th>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-200 min-w-24"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 text-xs text-gray-500 bg-gray-50 text-center">
                  {rowIndex + 1}
                </td>
                {headers.map((colKey, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 px-2 py-1 text-xs text-gray-900 min-w-24 cursor-pointer hover:bg-blue-50"
                    onClick={() => handleCellClick(rowIndex, colKey)}
                  >
                    {editingCell?.row === rowIndex &&
                    editingCell?.col === colKey ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellEdit(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={handleCellSave}
                          className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleCellSave}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCellCancel}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="block truncate">
                        {String(row[colKey] || "")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
        {localData.length} rows × {headers.length} columns
      </div>
    </div>
  );
}
