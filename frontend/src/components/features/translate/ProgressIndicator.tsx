import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Languages, CheckCircle2 } from 'lucide-react';
import type { TranslateStatus, TranslationProgress } from '../../../types';
import './Progress.css';

interface ProgressIndicatorProps {
  status: TranslateStatus;
  progress?: TranslationProgress | null;
}

const stages = [
  {
    key: 'uploading' as const,
    label: 'Uploading file',
    icon: FileText,
    baseProgress: 10
  },
  {
    key: 'translating' as const,
    label: 'Translating content',
    icon: Languages,
    baseProgress: 50
  },
  {
    key: 'success' as const,
    label: 'Complete',
    icon: CheckCircle2,
    baseProgress: 100
  },
];

function getStageLabel(stage: string): string {
  switch (stage) {
    case 'extracting':
      return 'Extracting cells...';
    case 'translating':
      return 'Translating...';
    case 'rich_text':
      return 'Processing rich text...';
    case 'dropdowns':
      return 'Translating dropdowns...';
    case 'writing':
      return 'Writing file...';
    case 'complete':
      return 'Complete!';
    default:
      return 'Processing...';
  }
}

export function ProgressIndicator({ status, progress }: ProgressIndicatorProps) {
  if (status === 'idle' || status === 'error') {
    return null;
  }

  // Calculate progress percentage
  let displayProgress: number;
  if (status === 'uploading') {
    displayProgress = 5;
  } else if (status === 'translating' && progress) {
    // Map the translation progress (0-100) to 10-95 range
    displayProgress = Math.max(10, Math.min(95, 10 + (progress.percentage * 0.85)));
  } else if (status === 'success') {
    displayProgress = 100;
  } else {
    displayProgress = 10;
  }

  const currentIndex = stages.findIndex(s => s.key === status);

  // Build the label for translating status
  let translatingLabel = 'Translating content';
  if (status === 'translating' && progress) {
    const stageText = getStageLabel(progress.stage);
    if (progress.total > 0) {
      translatingLabel = `${stageText} ${progress.translated}/${progress.total} cells`;
    } else {
      translatingLabel = stageText;
    }
  }

  return (
    <motion.div
      className="progress-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      {/* Elegant progress bar */}
      <div className="progress-bar-wrapper">
        <div className="progress-bar-track">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.div
            className="progress-bar-shine"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 0.5,
            }}
          />
        </div>
        <div className="progress-percentage">
          <motion.span
            key={Math.round(displayProgress)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(displayProgress)}%
          </motion.span>
        </div>
      </div>

      {/* Stage indicators */}
      <div className="progress-stages">
        {stages.map((stage, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex || status === 'success';
          const Icon = stage.icon;

          // Use dynamic label for translating stage
          const label = stage.key === 'translating' && isActive ? translatingLabel : stage.label;

          return (
            <motion.div
              key={stage.key}
              className={`progress-stage ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              initial={{ opacity: 0.4, y: 5 }}
              animate={{
                opacity: isActive || isComplete ? 1 : 0.4,
                y: 0,
              }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <motion.div
                className="progress-stage-icon"
                animate={isActive ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Icon size={18} strokeWidth={2.5} />
              </motion.div>
              <motion.span
                className="progress-stage-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Status hint */}
      <AnimatePresence>
        {status === 'translating' && !progress && (
          <motion.p
            className="progress-hint"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ delay: 0.3 }}
          >
            Translation time depends on file size and content complexity
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
