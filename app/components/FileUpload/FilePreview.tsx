/**
 * File Preview Component
 * 
 * Displays file previews:
 * - Thumbnails for images
 * - First page preview for PDFs (placeholder)
 * - Icons for other file types
 */

import React from 'react';
import { getFileIcon, getFileCategory } from '../../utils/fileValidation';

export interface FilePreviewProps {
  file: File | { name: string; type: string; url?: string };
  size?: 'sm' | 'md' | 'lg';
  showFilename?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};

export default function FilePreview({
  file,
  size = 'md',
  showFilename = true,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const category = getFileCategory(file as File);

  // Generate preview for images
  React.useEffect(() => {
    if (category === 'image' && file instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      };
    } else if ('url' in file && file.url && category === 'image') {
      setPreviewUrl(file.url);
    }
  }, [file, category]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={`${SIZE_CLASSES[size]} rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-50`}
      >
        {category === 'image' && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : category === 'document' && file.type === 'application/pdf' ? (
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-red-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs font-medium text-gray-600">PDF</p>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="text-4xl mb-2">{getFileIcon(file as File)}</div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              {file.name.split('.').pop()}
            </p>
          </div>
        )}
      </div>

      {showFilename && (
        <p className="text-sm text-gray-700 max-w-full truncate px-2">
          {file.name}
        </p>
      )}
    </div>
  );
}




