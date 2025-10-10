/**
 * Milestone Evidence Upload
 * 
 * WO-113: File upload component for verification evidence
 */

import React, { useState } from 'react';

interface MilestoneEvidenceUploadProps {
  onFilesUploaded: (files: string[]) => void;
}

export default function MilestoneEvidenceUpload({ onFilesUploaded }: MilestoneEvidenceUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file size
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed the ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(f => !ALLOWED_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      alert('Only PDF, images, and Word documents are allowed');
      return;
    }

    // In production, would upload to S3/IPFS
    const fileUrls = files.map(f => `uploaded://${f.name}`);
    
    const newFiles = [...uploadedFiles, ...fileUrls];
    setUploadedFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Evidence Files
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-gray-400 text-4xl mb-2">📁</div>
          <div className="text-sm text-gray-600">
            Click to upload or drag and drop
          </div>
          <div className="text-xs text-gray-500 mt-1">
            PDF, Images, Word Documents (max {MAX_FILE_SIZE_MB}MB each)
          </div>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-900">{file.replace('uploaded://', '')}</span>
              </div>
              <button
                onClick={() => {
                  const newFiles = uploadedFiles.filter((_, i) => i !== idx);
                  setUploadedFiles(newFiles);
                  onFilesUploaded(newFiles);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



