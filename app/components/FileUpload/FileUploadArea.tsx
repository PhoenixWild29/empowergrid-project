/**
 * File Upload Area
 * 
 * Drag-and-drop file upload area with visual feedback
 * 
 * Features:
 * - Drag and drop support
 * - Click to select files
 * - Visual states (idle, dragover, uploading)
 * - Multiple file selection
 * - File type and size validation
 */

import React, { useRef, useState } from 'react';
import { validateFile, formatFileSize } from '../../utils/fileValidation';

export interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export default function FileUploadArea({
  onFilesSelected,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  multiple = true,
  maxFiles = 10,
  disabled = false,
  className = '',
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter((file) => {
      const validation = validateFile(file);
      return validation.valid;
    });

    const filesToUpload = multiple ? validFiles.slice(0, maxFiles) : validFiles.slice(0, 1);
    
    if (filesToUpload.length > 0) {
      onFilesSelected(filesToUpload);
    }
  };

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter((file) => {
        const validation = validateFile(file);
        return validation.valid;
      });

      const filesToUpload = multiple ? validFiles.slice(0, maxFiles) : validFiles.slice(0, 1);
      
      if (filesToUpload.length > 0) {
        onFilesSelected(filesToUpload);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          disabled
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
            : isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="sr-only"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <svg
            className={`w-16 h-16 ${
              isDragOver ? 'text-blue-600' : 'text-gray-400'
            } transition-colors`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-600">
              or <span className="text-blue-600 font-medium">browse</span> to upload
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
            <p>Max {formatFileSize(10 * 1024 * 1024)} per file, {formatFileSize(50 * 1024 * 1024)} total</p>
          </div>
        </div>
      </div>
    </div>
  );
}






