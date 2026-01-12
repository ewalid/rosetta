import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Languages, CheckCircle2 } from 'lucide-react';
import type { TranslateStatus } from '../../../types';
import './Progress.css';

interface ProgressIndicatorProps {
  status: TranslateStatus;
}

const stages = [
  { 
    key: 'uploading' as const, 
    label: 'Uploading file',
    icon: FileText,
    progress: 33
  },
  { 
    key: 'translating' as const, 
    label: 'Translating content',
    icon: Languages,
    progress: 66
  },
  { 
    key: 'success' as const, 
    label: 'Complete',
    icon: CheckCircle2,
    progress: 100
  },
];

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (status === 'idle' || status === 'error') {
    return null;
  }

  const currentStage = stages.find(s => s.key === status) || stages[0];
  const currentIndex = stages.findIndex(s => s.key === status);
  const progress = currentStage.progress;

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
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
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
            key={progress}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {progress}%
          </motion.span>
        </div>
      </div>

      {/* Stage indicators */}
      <div className="progress-stages">
        {stages.map((stage, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex || status === 'success';
          const Icon = stage.icon;

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
                {stage.label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Status hint */}
      <AnimatePresence>
        {status === 'translating' && (
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
