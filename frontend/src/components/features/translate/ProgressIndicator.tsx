import { motion } from 'framer-motion';
import { FileText, Languages, CheckCircle } from 'lucide-react';
import type { TranslateStatus } from '../../../types';
import './Progress.css';

interface ProgressIndicatorProps {
  status: TranslateStatus;
}

const stages = [
  { key: 'uploading', label: 'Uploading file', icon: FileText },
  { key: 'translating', label: 'Translating content', icon: Languages },
  { key: 'success', label: 'Complete', icon: CheckCircle },
];

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (status === 'idle' || status === 'error') {
    return null;
  }

  const currentIndex = stages.findIndex(s => s.key === status);

  return (
    <motion.div
      className="progress-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: '0%' }}
            animate={{
              width: status === 'uploading' ? '33%' : status === 'translating' ? '66%' : '100%',
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {status === 'translating' && (
            <motion.div
              className="progress-bar-pulse"
              animate={{
                x: ['0%', '100%'],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
      </div>

      {/* Stage indicators */}
      <div className="progress-stages">
        {stages.map((stage, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex || status === 'success';
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className={`progress-stage ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
            >
              <div className="progress-stage-icon">
                <Icon />
              </div>
              <span className="progress-stage-label">{stage.label}</span>
            </div>
          );
        })}
      </div>

      {/* Estimated time hint */}
      {status === 'translating' && (
        <motion.p
          className="progress-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Translation time depends on file size and content complexity
        </motion.p>
      )}
    </motion.div>
  );
}
