/**
 * File Category Upload Component
 * 
 * Manages file uploads for a specific category:
 * - Project Plans
 * - Technical Specifications
 * - Permits
 * - Environmental Assessments
 * 
 * Features:
 * - Category-specific upload area
 * - Upload progress tracking
 * - Duplicate file prevention
 * - File list display
 * - Batch upload support
 */

import React, { useState } from 'react';
import FileUploadArea from './FileUploadArea';
import UploadedFileList, { UploadedFileData } from './UploadedFileList';
import { uploadFile, deleteFile } from '../../services/uploadService';
import { validateFile, isDuplicateFile, validateTotalSize } from '../../utils/fileValidation';

export interface FileCategoryUploadProps {
  category: string;
  categoryLabel: string;
  categoryDescription?: string;
  initialFiles?: UploadedFileData[];
  maxFiles?: number;
  onFilesChange?: (files: UploadedFileData[]) => void;
}

interface UploadProgress {
  filename: string;
  progress: number;
  estimatedTime?: number;
}

export default function FileCategoryUpload({
  category,
  categoryLabel,
  categoryDescription,
  initialFiles = [],
  maxFiles = 10,
  onFilesChange,
}: FileCategoryUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileData[]>(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFilesSelected = async (files: File[]) => {
    setError(null);

    // Check for duplicates
    const duplicates: string[] = [];
    const newFiles: File[] = [];

    files.forEach((file) => {
      if (isDuplicateFile(file, uploadedFiles)) {
        duplicates.push(file.name);
      } else {
        newFiles.push(file);
      }
    });

    // Show duplicate confirmation
    if (duplicates.length > 0) {
      const confirmed = window.confirm(
        `The following files appear to be duplicates:\n\n${duplicates.join('\n')}\n\nDo you want to upload them anyway?`
      );

      if (!confirmed) {
        return;
      }
    }

    // Validate total size
    const allFiles = newFiles.concat(
      uploadedFiles.map((f) => new File([], f.name, { type: f.type }))
    );
    const totalSizeValidation = validateTotalSize(allFiles as File[]);

    if (!totalSizeValidation.valid) {
      setError(totalSizeValidation.error || 'Total file size exceeds limit');
      return;
    }

    // Check max files limit
    if (uploadedFiles.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed per category`);
      return;
    }

    // Upload files
    for (const file of newFiles) {
      try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(`${file.name}: ${validation.error}`);
          continue;
        }

        // Initialize progress
        setUploadingFiles((prev) => [
          ...prev,
          { filename: file.name, progress: 0 },
        ]);

        // Upload with progress tracking
        const uploadedFile = await uploadFile(file, {
          category,
          onProgress: (progress) => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.filename === file.name
                  ? {
                      ...f,
                      progress: progress.progress,
                      estimatedTime: progress.estimatedTimeRemaining,
                    }
                  : f
              )
            );
          },
        });

        // Add to uploaded files
        const newUploadedFiles = [...uploadedFiles, {
          id: uploadedFile.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: uploadedFile.uploadedAt,
          url: uploadedFile.url,
        }];

        setUploadedFiles(newUploadedFiles);
        onFilesChange?.(newUploadedFiles);

        // Remove from uploading
        setUploadingFiles((prev) =>
          prev.filter((f) => f.filename !== file.name)
        );
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        setError(`Failed to upload ${file.name}: ${(error as Error).message}`);
        
        // Remove from uploading
        setUploadingFiles((prev) =>
          prev.filter((f) => f.filename !== file.name)
        );
      }
    }
  };

  // Handle file deletion
  const handleDelete = async (fileId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this file?');
    
    if (!confirmed) return;

    try {
      await deleteFile(fileId);
      
      const newUploadedFiles = uploadedFiles.filter((f) => f.id !== fileId);
      setUploadedFiles(newUploadedFiles);
      onFilesChange?.(newUploadedFiles);
    } catch (error) {
      console.error('Delete failed:', error);
      setError(`Failed to delete file: ${(error as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {categoryLabel}
        </h3>
        {categoryDescription && (
          <p className="text-sm text-gray-600">{categoryDescription}</p>
        )}
      </div>

      {/* Upload Area */}
      <FileUploadArea
        onFilesSelected={handleFilesSelected}
        multiple={true}
        maxFiles={maxFiles}
        disabled={uploadingFiles.length > 0}
      />

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((file) => (
            <div
              key={file.filename}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {file.filename}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {file.progress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              {file.estimatedTime && (
                <p className="text-xs text-gray-600 mt-1">
                  ~{file.estimatedTime.toFixed(0)}s remaining
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Uploaded Files ({uploadedFiles.length})
        </h4>
        <UploadedFileList
          files={uploadedFiles}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

