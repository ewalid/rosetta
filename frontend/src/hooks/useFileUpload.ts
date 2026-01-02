import { useState, useCallback } from 'react';
import { formatFileSize, isValidExcelFile, getFileExtension } from '../lib/utils';
import type { FileInfo } from '../types';

interface UseFileUploadReturn {
  fileInfo: FileInfo | null;
  error: string | null;
  selectFile: (file: File) => void;
  clearFile: () => void;
  validateFile: (file: File) => boolean;
}

export function useFileUpload(): UseFileUploadReturn {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    if (!isValidExcelFile(file)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return false;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return false;
    }

    return true;
  }, []);

  const selectFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) {
        setFileInfo(null);
        return;
      }

      const extension = getFileExtension(file.name);
      setFileInfo({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: extension as 'xlsx' | 'xls',
      });
    },
    [validateFile]
  );

  const clearFile = useCallback(() => {
    setFileInfo(null);
    setError(null);
  }, []);

  return {
    fileInfo,
    error,
    selectFile,
    clearFile,
    validateFile,
  };
}
