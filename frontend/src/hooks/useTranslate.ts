import { useState, useCallback, useRef } from 'react';
import { translateFile, downloadBlob } from '../api/client';
import type { TranslateRequest, TranslateStatus, TranslationProgress } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cache SSE support check result
let sseSupported: boolean | null = null;

interface UseTranslateReturn {
  status: TranslateStatus;
  error: string | undefined;
  filename: string | undefined;
  progress: TranslationProgress | null;
  translate: (request: TranslateRequest) => Promise<void>;
  downloadResult: () => void;
  reset: () => void;
}

function base64ToBlob(base64: string, mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Check if SSE/streaming is supported by testing the health endpoint.
 * Corporate proxies often buffer responses or block streaming.
 */
async function checkSSESupport(): Promise<boolean> {
  // Return cached result if available
  if (sseSupported !== null) {
    return sseSupported;
  }

  try {
    // Quick test: check if fetch with streaming works
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if we can get a reader (streaming support)
    if (!response.body?.getReader) {
      sseSupported = false;
      return false;
    }

    // Additional check: some proxies modify headers or add buffering
    const cacheControl = response.headers.get('cache-control');

    // If proxy adds caching headers, SSE might not work properly
    if (cacheControl?.includes('transform') || cacheControl?.includes('cache')) {
      console.info('[SSE] Proxy detected, using fallback endpoint');
      sseSupported = false;
      return false;
    }

    sseSupported = true;
    return true;
  } catch {
    // Network error or timeout - SSE likely won't work
    sseSupported = false;
    return false;
  }
}

export function useTranslate(): UseTranslateReturn {
  const [status, setStatus] = useState<TranslateStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const resultBlobRef = useRef<Blob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const translateWithRegularEndpoint = useCallback(async (request: TranslateRequest) => {
    setStatus('uploading');
    setError(undefined);
    setProgress(null);
    resultBlobRef.current = null;
    setFilename(undefined);

    // Simulate upload progress briefly
    await new Promise((resolve) => setTimeout(resolve, 300));
    setStatus('translating');

    // Use simulated progress for non-SSE fallback
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (!prev) return { translated: 0, total: 100, percentage: 10, stage: 'translating' };
        const newPercentage = Math.min(prev.percentage + 5, 90);
        return { ...prev, percentage: newPercentage };
      });
    }, 1000);

    try {
      const response = await translateFile(request);

      clearInterval(progressInterval);

      if (response.success && response.blob) {
        resultBlobRef.current = response.blob;
        setFilename(response.filename);
        setProgress(null);
        setStatus('success');
      } else {
        setError(response.error);
        setProgress(null);
        setStatus('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      setProgress(null);
      setStatus('error');
    }
  }, []);

  const translateWithSSE = useCallback(async (request: TranslateRequest): Promise<boolean> => {
    setStatus('uploading');
    setError(undefined);
    setProgress(null);
    resultBlobRef.current = null;
    setFilename(undefined);

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

    if (request.recaptchaToken) {
      formData.append('recaptcha_token', request.recaptchaToken);
    }

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/translate-stream`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Translation failed with status ${response.status}`;
        setError(errorMessage);
        setStatus('error');
        return true; // Error handled, don't fallback
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      setStatus('translating');

      if (!reader) {
        // No streaming support - signal to use fallback
        return false;
      }

      let buffer = '';
      let receivedProgress = false;
      let completed = false;

      // Set a timeout for receiving first progress update
      const progressTimeoutId = setTimeout(() => {
        if (!receivedProgress && !completed) {
          console.info('[SSE] No progress received, connection may be buffered');
          // Don't abort here - let it continue, the translation might still work
        }
      }, 10000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.percentage !== undefined && data.stage !== undefined) {
                // Progress update
                receivedProgress = true;
                setProgress({
                  translated: data.translated,
                  total: data.total,
                  percentage: data.percentage,
                  stage: data.stage,
                });
              } else if (data.file_base64) {
                // Translation complete
                completed = true;
                clearTimeout(progressTimeoutId);
                const blob = base64ToBlob(data.file_base64);
                resultBlobRef.current = blob;
                setFilename(data.filename);
                setProgress(null);
                setStatus('success');
              } else if (data.error) {
                // Error from server
                completed = true;
                clearTimeout(progressTimeoutId);
                setError(data.error);
                setProgress(null);
                setStatus('error');
              }
            } catch {
              // Ignore invalid JSON lines
            }
          }
        }
      }

      clearTimeout(progressTimeoutId);

      // If we finished reading but didn't complete, something went wrong
      if (!completed) {
        // Stream ended unexpectedly - might be proxy issue
        return false;
      }

      return true; // Successfully handled with SSE
    } catch (err) {
      // Check if it was aborted intentionally
      if (err instanceof Error && err.name === 'AbortError') {
        return true; // Don't fallback on intentional abort
      }

      // Network error - might be proxy blocking SSE
      console.info('[SSE] Streaming failed, will use fallback:', err);
      return false;
    }
  }, []);

  const translate = useCallback(async (request: TranslateRequest) => {
    // Check if SSE is likely to work
    const canUseSSE = await checkSSESupport();

    if (!canUseSSE) {
      // Use regular endpoint directly
      console.info('[Translate] Using regular endpoint (SSE not supported)');
      await translateWithRegularEndpoint(request);
      return;
    }

    // Try SSE first
    const sseHandled = await translateWithSSE(request);

    if (!sseHandled) {
      // SSE failed mid-stream, fall back to regular endpoint
      console.info('[Translate] SSE failed, falling back to regular endpoint');
      // Mark SSE as not supported for future requests
      sseSupported = false;
      await translateWithRegularEndpoint(request);
    }
  }, [translateWithSSE, translateWithRegularEndpoint]);

  const downloadResult = useCallback(() => {
    if (resultBlobRef.current && filename) {
      downloadBlob(resultBlobRef.current, filename);
    }
  }, [filename]);

  const reset = useCallback(() => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setStatus('idle');
    setError(undefined);
    setFilename(undefined);
    setProgress(null);
    resultBlobRef.current = null;
  }, []);

  return {
    status,
    error,
    filename,
    progress,
    translate,
    downloadResult,
    reset,
  };
}
