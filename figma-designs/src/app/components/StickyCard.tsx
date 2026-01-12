import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Github, Package, MessageSquare } from 'lucide-react';

export function StickyCard() {
  const [cardBounds, setCardBounds] = useState({ start: 0, end: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Calculate the bounds when component mounts
  useEffect(() => {
    const updateBounds = () => {
      const uploadSection = document.querySelector('[data-upload-section]');
      if (uploadSection) {
        const rect = uploadSection.getBoundingClientRect();
        const scrollTop = window.scrollY;
        
        setCardBounds({
          start: scrollTop + rect.top,
          end: scrollTop + rect.bottom - 400 // Card height + padding
        });
      }
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Create smooth animations based on scroll
  const cardY = useTransform(
    scrollY,
    [cardBounds.start - 100, cardBounds.start, cardBounds.end, cardBounds.end + 100],
    [50, 0, 0, -50]
  );
  
  const smoothY = useSpring(cardY, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  });

  // Wiggle animation based on scroll velocity
  const rotate = useTransform(
    scrollY,
    (latest) => {
      const prev = scrollY.getPrevious() || 0;
      const velocity = latest - prev;
      return Math.max(-3, Math.min(3, velocity * 0.1));
    }
  );

  const smoothRotate = useSpring(rotate, {
    stiffness: 50,
    damping: 10
  });

  // Parallax float effect
  const floatY = useTransform(
    scrollY,
    (latest) => Math.sin(latest * 0.01) * 3
  );

  return (
    <motion.div
      ref={cardRef}
      className="hidden lg:block fixed right-6 z-40"
      style={{
        top: 96, // Starting position (24 * 4px = 96px)
        y: smoothY,
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <motion.div
        style={{ 
          rotate: smoothRotate,
          y: floatY,
        }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-56 relative overflow-hidden"
      >
        {/* Animated background blob */}
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative flex flex-col gap-3">
          <motion.a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors group"
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </motion.div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
          </motion.a>
          
          <motion.a
            href="https://pypi.org/project/yourpackage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors group"
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Package className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </motion.div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PyPI</span>
          </motion.a>
          
          <motion.a
            href="https://forms.gle/yourfeedbackform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors group"
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </motion.div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Feedback</span>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}
