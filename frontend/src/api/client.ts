import type { TranslateRequest, TranslateResponse, SheetsResponse, FeedbackRequest, FeedbackResponse } from '../types';
import { generateOutputFilename } from '../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getSheets(file: File): Promise<SheetsResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/sheets`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Failed to get sheets with status ${response.status}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return {
      success: true,
      sheets: data.sheets,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function translateFile(request: TranslateRequest): Promise<TranslateResponse> {
  const formData = new FormData();

  formData.append('file', request.file);
  formData.append('target_lang', request.targetLanguage);

  if (request.sourceLanguage) {
    formData.append('source_lang', request.sourceLanguage);
  }

  if (request.context) {
    formData.append('context', request.context);
  }

  if (request.sheets && request.sheets.length > 0) {
    formData.append('sheets', request.sheets.join(','));
  }

  try {
    const response = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Translation failed with status ${response.status}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    const blob = await response.blob();
    const filename = generateOutputFilename(request.file.name, request.targetLanguage);

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function submitFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: request.rating,
        improvements: request.improvements,
        additional_feedback: request.additionalFeedback,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || `Failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
