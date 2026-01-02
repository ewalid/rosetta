import { useState, useCallback, useRef } from 'react';
import { translateFile, downloadBlob } from '../api/client';
import type { TranslateRequest, TranslateStatus } from '../types';

interface UseTranslateReturn {
  status: TranslateStatus;
  error: string | undefined;
  filename: string | undefined;
  translate: (request: TranslateRequest) => Promise<void>;
  downloadResult: () => void;
  reset: () => void;
}

export function useTranslate(): UseTranslateReturn {
  const [status, setStatus] = useState<TranslateStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const resultBlobRef = useRef<Blob | null>(null);

  const translate = useCallback(async (request: TranslateRequest) => {
    setStatus('uploading');
    setError(undefined);
    resultBlobRef.current = null;
    setFilename(undefined);

    // Simulate a brief upload phase
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStatus('translating');

    const response = await translateFile(request);

    if (response.success && response.blob) {
      resultBlobRef.current = response.blob;
      setFilename(response.filename);
      setStatus('success');
    } else {
      setError(response.error);
      setStatus('error');
    }
  }, []);

  const downloadResult = useCallback(() => {
    if (resultBlobRef.current && filename) {
      downloadBlob(resultBlobRef.current, filename);
    }
  }, [filename]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(undefined);
    setFilename(undefined);
    resultBlobRef.current = null;
  }, []);

  return {
    status,
    error,
    filename,
    translate,
    downloadResult,
    reset,
  };
}
