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

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = '8ed7e53d-d67a-476c-ad63-1160c7681975';

export async function submitFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  const ratingLabels: Record<number, string> = {
    1: 'Very Dissatisfied',
    2: 'Dissatisfied',
    3: 'Neutral',
    4: 'Satisfied',
    5: 'Very Satisfied',
  };

  const ratingLabel = ratingLabels[request.rating] || String(request.rating);
  const improvementsText = request.improvements.length > 0
    ? request.improvements.join(', ')
    : 'None selected';

  const message = `Rating: ${request.rating}/5 (${ratingLabel})

Areas for Improvement: ${improvementsText}

Additional Feedback: ${request.additionalFeedback || 'None provided'}`;

  try {
    const response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `Rosetta Feedback - Rating ${request.rating}/5 (${ratingLabel})`,
        from_name: 'Rosetta Feedback',
        message,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        message: 'Feedback submitted successfully',
      };
    } else {
      console.error('[Feedback Error] Web3Forms error:', data);
      return {
        success: true, // Still show success to user
        message: 'Feedback recorded',
      };
    }
  } catch (error) {
    console.error('[Feedback Error] Failed to submit feedback:', error);
    return {
      success: true, // Still show success to user
      message: 'Feedback recorded',
    };
  }
}
