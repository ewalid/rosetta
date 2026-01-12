import { motion } from 'motion/react';
import { Upload, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  currentStep: 'uploading' | 'translating' | 'complete';
  progress: number;
}

export function ProgressBar({ currentStep, progress }: ProgressBarProps) {
  const steps = [
    { id: 'uploading', label: 'Uploading file', icon: Upload },
    { id: 'translating', label: 'Translating content', icon: Sparkles },
    { id: 'complete', label: 'Complete', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-gray-900 dark:bg-black rounded-2xl border border-emerald-500/20">
      {/* Header with animated loader */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-5 h-5 text-emerald-400" />
        </motion.div>
        <h3 className="text-lg font-medium text-emerald-400">
          {currentStep === 'complete' ? 'Translation Complete!' : 'Translating...'}
        </h3>
      </div>

      {/* Custom Progress Bar with personality */}
      <div className="relative mb-8">
        {/* Background track with glow */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 10px,
                rgba(16, 185, 129, 0.3) 10px,
                rgba(16, 185, 129, 0.3) 20px
              )`
            }}
            animate={{ x: [0, 20] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Progress fill with bounce animation */}
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 w-1 h-1 bg-white rounded-full"
                style={{ left: `${20 + i * 30}%` }}
                animate={{
                  y: [-4, 4, -4],
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Playful bouncing progress indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${progress}%` }}
          animate={{ 
            y: [-2, 2, -2],
            rotate: [-5, 5, -5]
          }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative -translate-x-1/2">
            <div className="w-6 h-6 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
            <motion.div
              className="absolute inset-0 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>

      {/* Steps with icons */}
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              {/* Icon with animation */}
              <motion.div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                    : 'bg-gray-800 border-2 border-gray-700'
                }`}
                animate={isCurrent ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={isCurrent ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <Icon className={`w-6 h-6 ${
                  isActive ? 'text-emerald-400' : 'text-gray-600'
                }`} />
                
                {/* Checkmark overlay for completed steps */}
                {isActive && index < currentStepIndex && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                
                {/* Pulsing ring for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-400"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <p className={`text-sm font-medium text-center ${
                isActive ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {step.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Footer text with typewriter effect */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500 mt-6"
      >
        Translation time depends on file size and content complexity
      </motion.p>
    </div>
  );
}
