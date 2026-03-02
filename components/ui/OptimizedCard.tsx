/**
 * Componente Card otimizado com React.memo e composition pattern
 */
import { ReactNode, memo } from 'react'

import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
};

export const Card = memo<CardProps>(({
  children,
  className,
  hover = false,
  padding = 'md',
  variant = 'default',
  onClick,
}) => {
  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Subcomponentes para composition pattern
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = memo<CardHeaderProps>(({ children, className }) => {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const titleSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export const CardTitle = memo<CardTitleProps>(({ 
  children, 
  className,
  size = 'md' 
}) => {
  return (
    <h3 className={cn(
      'font-bold text-gray-900 dark:text-white',
      titleSizes[size],
      className
    )}>
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const CardDescription = memo<CardDescriptionProps>(({ children, className }) => {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = memo<CardContentProps>(({ children, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = memo<CardFooterProps>(({ children, className }) => {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export default Card;

