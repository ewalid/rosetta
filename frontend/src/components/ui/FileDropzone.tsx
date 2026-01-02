import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { cn, formatFileSize, isValidExcelFile, getFileExtension } from '../../lib/utils';
import type { FileInfo } from '../../types';
import './FileDropzone.css';

interface FileDropzoneProps {
  onFileSelect: (fileInfo: FileInfo | null) => void;
  selectedFile: FileInfo | null;
  disabled?: boolean;
  error?: string;
}

export function FileDropzone({
  onFileSelect,
  selectedFile,
  disabled = false,
  error,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && isValidExcelFile(file)) {
        const extension = getFileExtension(file.name);
        onFileSelect({
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: extension as 'xlsx' | 'xlsm' | 'xltx' | 'xltm',
        });
      }
    },
    [disabled, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidExcelFile(file)) {
        const extension = getFileExtension(file.name);
        onFileSelect({
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: extension as 'xlsx' | 'xlsm' | 'xltx' | 'xltm',
        });
      }
      e.target.value = '';
    },
    [onFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    onFileSelect(null);
  }, [onFileSelect]);

  return (
    <div className="dropzone">
      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="file-preview"
          >
            <div className="file-preview-icon">
              <FileSpreadsheet />
            </div>
            <div className="file-preview-info">
              <p className="file-preview-name">{selectedFile.name}</p>
              <p className="file-preview-meta">
                {selectedFile.size} • {selectedFile.type.toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={disabled}
              className="file-preview-remove"
            >
              <X />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'dropzone-area',
              isDragging && 'dropzone-area-dragging',
              error && 'dropzone-area-error',
              disabled && 'dropzone-area-disabled'
            )}
          >
            <input
              type="file"
              accept=".xlsx,.xlsm,.xltx,.xltm"
              onChange={handleFileInput}
              disabled={disabled}
              className="sr-only"
            />

            <motion.div
              animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'dropzone-icon-wrapper',
                isDragging && 'dropzone-icon-wrapper-dragging'
              )}
            >
              <Upload className={cn('dropzone-icon', isDragging && 'dropzone-icon-dragging')} />
            </motion.div>

            <p className="dropzone-text">
              {isDragging ? 'Drop your file here' : 'Drag and drop your Excel file'}
            </p>
            <p className="dropzone-subtext">or click to browse • XLSX supported</p>

            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="dropzone-overlay"
              />
            )}
          </motion.label>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dropzone-error"
        >
          <AlertCircle />
          {error}
        </motion.div>
      )}
    </div>
  );
}
