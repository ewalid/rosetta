export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslateRequest {
  file: File;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
  sheets?: string[];
}

export interface TranslateResponse {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

export type TranslateStatus = 'idle' | 'uploading' | 'translating' | 'success' | 'error';

export interface FileInfo {
  file: File;
  name: string;
  size: string;
  type: 'xlsx' | 'xlsm' | 'xltx' | 'xltm';
}
