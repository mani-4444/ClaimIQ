import { cn } from '../../lib/utils';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'glass-card rounded-xl',
  elevated: 'glass-card rounded-xl shadow-card-hover',
  outlined: 'bg-dark-700/50 border border-white/[0.06] rounded-xl',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
}: CardProps) {
  return (
    <div
      className={cn(
        'transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>;
}
