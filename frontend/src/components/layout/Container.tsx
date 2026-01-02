import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import './Layout.css';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Container({ children, size = 'lg', className }: ContainerProps) {
  return (
    <div className={cn('container', `container-${size}`, className)}>
      {children}
    </div>
  );
}
