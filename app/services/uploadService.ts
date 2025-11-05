/**
 * Upload Service
 * 
 * Handles API calls for file uploads with progress tracking
 */

export interface UploadProgress {
  filename: string;
  progress: number;
  uploaded: number;
  total: number;
  estimatedTimeRemaining?: number;
}

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  category: string;
  url: string;
  uploadedAt: string;
}

export interface UploadOptions {
  category: string;
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload a single file
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', options.category);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options.onProgress) {
        const progress = (event.loaded / event.total) * 100;
        const bytesPerSecond = event.loaded / ((Date.now() - startTime) / 1000);
        const remainingBytes = event.total - event.loaded;
        const estimatedTimeRemaining = remainingBytes / bytesPerSecond;

        options.onProgress({
          filename: file.name,
          progress,
          uploaded: event.loaded,
          total: event.total,
          estimatedTimeRemaining,
        });
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.file);
        } catch (error) {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    const startTime = Date.now();
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions
): Promise<UploadedFile[]> {
  const uploadPromises = files.map((file) => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

/**
 * Delete uploaded file
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/upload/${fileId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete file');
  }
}

/**
 * Get uploaded files for a category
 */
export async function getFiles(category: string): Promise<UploadedFile[]> {
  const response = await fetch(`/api/upload?category=${category}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch files');
  }

  const data = await response.json();
  return data.files;
}

export default {
  uploadFile,
  uploadFiles,
  deleteFile,
  getFiles,
};






