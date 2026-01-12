import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-7xl',
  full: 'max-w-full'
};

export function Container({ children, size = 'lg', className }: ContainerProps) {
  return (
    <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  );
}
