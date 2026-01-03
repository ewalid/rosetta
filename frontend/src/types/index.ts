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
  recaptchaToken?: string;
}

export interface TranslateResponse {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

export interface SheetsResponse {
  success: boolean;
  sheets?: string[];
  error?: string;
}

export type TranslateStatus = 'idle' | 'uploading' | 'translating' | 'success' | 'error';

export interface FileInfo {
  file: File;
  name: string;
  size: string;
  type: 'xlsx' | 'xlsm' | 'xltx' | 'xltm';
}

export interface FeedbackRequest {
  rating: 1 | 2 | 3 | 4 | 5;
  improvements: string[];
  additionalFeedback?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
}
