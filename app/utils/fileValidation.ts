/**
 * File Validation Utilities
 * 
 * Functions for validating file uploads:
 * - File type validation
 * - File size validation
 * - Duplicate detection
 * - MIME type checking
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizePerFile?: number; // in bytes
  maxTotalSize?: number; // in bytes
  allowedTypes?: string[];
}

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  documents: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  },
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
};

// Combine all allowed types
export const ALL_ALLOWED_TYPES = {
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.images,
};

// Default limits
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validate file type
 */
export function validateFileType(file: File): FileValidationResult {
  const allowedExtensions = Object.values(ALL_ALLOWED_TYPES).flat();
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
    };
  }

  // Also check MIME type
  const allowedMimeTypes = Object.keys(ALL_ALLOWED_TYPES);
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid MIME type: ${file.type}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): FileValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validate total size of multiple files
 */
export function validateTotalSize(
  files: File[],
  maxTotal: number = DEFAULT_MAX_TOTAL_SIZE
): FileValidationResult {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > maxTotal) {
    const maxTotalMB = (maxTotal / (1024 * 1024)).toFixed(1);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Total file size (${totalSizeMB} MB) exceeds maximum allowed (${maxTotalMB} MB)`,
    };
  }

  return { valid: true };
}

/**
 * Check for duplicate files
 */
export function isDuplicateFile(
  file: File,
  existingFiles: Array<{ name: string; size: number }>
): boolean {
  return existingFiles.some(
    (existing) => existing.name === file.name && existing.size === file.size
  );
}

/**
 * Validate file with comprehensive checks
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSizePerFile = DEFAULT_MAX_FILE_SIZE,
    allowedTypes = Object.values(ALL_ALLOWED_TYPES).flat(),
  } = options;

  // Check file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Check file size
  const sizeValidation = validateFileSize(file, maxSizePerFile);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file type category
 */
export function getFileCategory(file: File): 'document' | 'image' | 'unknown' {
  if (Object.keys(ALLOWED_FILE_TYPES.documents).includes(file.type)) {
    return 'document';
  }
  if (Object.keys(ALLOWED_FILE_TYPES.images).includes(file.type)) {
    return 'image';
  }
  return 'unknown';
}

/**
 * Get file icon based on type
 */
export function getFileIcon(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️';
    default:
      return '📎';
  }
}

export default {
  validateFileType,
  validateFileSize,
  validateTotalSize,
  isDuplicateFile,
  validateFile,
  formatFileSize,
  getFileCategory,
  getFileIcon,
};




