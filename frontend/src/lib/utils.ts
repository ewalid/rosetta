import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

export function isValidExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const validExtensions = ['xlsx', 'xlsm', 'xltx', 'xltm'];

  const extension = getFileExtension(file.name);
  return validTypes.includes(file.type) || validExtensions.includes(extension);
}

export function generateOutputFilename(originalName: string, targetLanguage: string): string {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = originalName.substring(0, lastDot);
  const extension = originalName.substring(lastDot);

  return `${baseName}_${targetLanguage}${extension}`;
}
