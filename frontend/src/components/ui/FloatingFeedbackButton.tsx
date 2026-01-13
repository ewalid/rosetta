import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { FeedbackModal } from '../features/feedback';

interface FloatingFeedbackButtonProps {
  containerRef: React.RefObject<HTMLElement>;
}

export function FloatingFeedbackButton({
  containerRef,
}: FloatingFeedbackButtonProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use motion value for smooth spring animation
  const rawY = useMotionValue(100);
  const smoothY = useSpring(rawY, {
    stiffness: 100,
    damping: 30,
    mass: 0.5
  });

  // Check if desktop (comment this condition to enable on mobile)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Update button position on scroll
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const buttonHeight = 100;
      const padding = 20;

      const containerTop = rect.top;
      const containerBottom = rect.bottom;
      const containerHeight = rect.height;

      // Check if container is visible in viewport
      const isContainerVisible = containerBottom > 0 && containerTop < viewportHeight;
      setIsVisible(isContainerVisible);

      if (!isContainerVisible) return;

      // Calculate scroll progress through the container (0 to 1)
      // When container top is at viewport top, progress = 0
      // When container bottom is at viewport bottom, progress = 1
      const scrollableDistance = containerHeight - viewportHeight;

      let progress: number;
      if (scrollableDistance <= 0) {
        // Container is smaller than viewport, keep button centered
        progress = 0.5;
      } else {
        // How much the container has scrolled past the viewport top
        const scrolledAmount = -containerTop;
        progress = Math.max(0, Math.min(1, scrolledAmount / scrollableDistance));
      }

      // Calculate button position range within the visible container
      const minY = Math.max(padding, containerTop + padding);
      const maxY = Math.min(viewportHeight - buttonHeight - padding, containerBottom - buttonHeight - padding);

      // Interpolate button position based on scroll progress
      const newButtonY = minY + (maxY - minY) * progress;

      rawY.set(newButtonY);
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [containerRef, rawY]);

  // Pulse animation state
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 5000);

    return () => clearInterval(pulseInterval);
  }, []);

  // Don't render on mobile (comment this to enable on mobile)
  if (!isDesktop) return null;

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed right-0 z-50 flex flex-col items-center gap-1.5 px-2 py-4 rounded-l-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-white text-xs font-medium shadow-lg cursor-pointer select-none border border-r-0 border-gray-200 border-l-2 border-l-emerald-500 dark:border-transparent dark:border-l-2 dark:border-l-emerald-500"
        style={{
          top: smoothY,
          boxShadow: isPulsing
            ? '0 0 20px rgba(16, 185, 129, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        initial={{ opacity: 0, x: 50 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          x: isVisible ? 0 : 50,
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.6), 0 8px 30px rgba(0, 0, 0, 0.4)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          opacity: { duration: 0.2 },
          x: { duration: 0.2 },
        }}
      >
        <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Feedback</span>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-l-lg bg-emerald-500/20 -z-10"
          animate={{
            scale: isPulsing ? [1, 1.1, 1] : 1,
            opacity: isPulsing ? [0.3, 0, 0.3] : 0,
          }}
          transition={{
            duration: 1,
            ease: 'easeInOut',
          }}
        />
      </motion.button>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
