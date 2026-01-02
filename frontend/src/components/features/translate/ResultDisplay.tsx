import { motion } from 'framer-motion';
import { CheckCircle2, Download, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../ui';
import type { TranslateStatus } from '../../../types';
import './Translate.css';

interface ResultDisplayProps {
  status: TranslateStatus;
  filename?: string;
  error?: string;
  onDownload: () => void;
  onRetry: () => void;
}

export function ResultDisplay({
  status,
  filename,
  error,
  onDownload,
  onRetry,
}: ResultDisplayProps) {
  if (status === 'idle' || status === 'uploading' || status === 'translating') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="result-container"
    >
      {status === 'success' && (
        <div className="result-success">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            <div className="result-success-icon">
              <CheckCircle2 />
            </div>
          </motion.div>

          <div className="result-text-center">
            <h3 className="result-success-title">Translation Complete</h3>
            <p className="result-success-subtitle">Your file is ready to download</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="primary"
              onClick={onDownload}
              leftIcon={<Download />}
              className="result-button"
            >
              Download {filename}
            </Button>
          </motion.div>
        </div>
      )}

      {status === 'error' && (
        <div className="result-error">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
          >
            <div className="result-error-icon">
              <AlertCircle />
            </div>
          </motion.div>

          <div className="result-text-center">
            <h3 className="result-error-title">Translation Failed</h3>
            <p className="result-error-subtitle">
              {error || 'An unexpected error occurred. Please try again.'}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={onRetry}
            leftIcon={<RotateCcw />}
            className="result-button"
          >
            Try Again
          </Button>
        </div>
      )}
    </motion.div>
  );
}
