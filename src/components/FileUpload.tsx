"use client";

import React, { useRef } from "react";
import { Upload, Image, FileSpreadsheet, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onMultipleFilesSelect: (files: File[]) => void;
  onClear: () => void;
  isLoading?: boolean;
  hasFiles?: boolean;
  acceptedTypes?: string[];
  maxFiles?: number;
}

export default function FileUpload({
  onFileSelect,
  onMultipleFilesSelect,
  onClear,
  isLoading = false,
  hasFiles = false,
  acceptedTypes = ["image/*", ".xlsx", ".xls", ".csv"],
  maxFiles = 100,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleMultipleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter((file) => {
        return acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type);
          }
          return file.type.match(type);
        });
      });

      if (validFiles.length > maxFiles) {
        alert(
          `Maximum ${maxFiles} files allowed. Only the first ${maxFiles} files will be processed.`
        );
        onMultipleFilesSelect(validFiles.slice(0, maxFiles));
      } else {
        onMultipleFilesSelect(validFiles);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    if (files.length > 1) {
      onMultipleFilesSelect(files);
    } else {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-blue-500 transition-colors duration-200 bg-gray-50"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-solid rounded-full border-t-transparent animate-spin mb-2"></div>
              <p className="text-sm text-gray-600">Processing...</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center text-gray-500">
          <div className="flex gap-4 mb-4">
            <Image className="w-12 h-12 text-gray-400" />
            <FileSpreadsheet className="w-12 h-12 text-gray-400" />
          </div>

          <p className="text-lg font-semibold mb-2">
            Drag and drop files here, or click to browse
          </p>

          <p className="text-sm text-gray-600 mb-4">
            Images, Excel files, or CSV files
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Select Single File
            </button>

            <button
              onClick={() => multipleFileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Select Multiple Files
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={multipleFileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleMultipleFilesChange}
          className="hidden"
        />
      </div>

      {/* Clear button */}
      {hasFiles && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
            Clear All Files
          </button>
        </div>
      )}
    </div>
  );
}
