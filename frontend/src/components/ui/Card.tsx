import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import './Card.css';

type CardProps = {
  variant?: 'default' | 'glass';
  hover?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = false, children }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
        className={cn('card', `card-${variant}`, hover && 'card-hover', className)}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

type CardSectionProps = {
  children?: React.ReactNode;
  className?: string;
};

const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn('card-header', className)}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn('card-content', className)}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn('card-footer', className)}>
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
