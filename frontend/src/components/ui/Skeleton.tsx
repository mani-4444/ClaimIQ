import { cn } from '../../lib/utils';

type SkeletonVariant = 'text' | 'card' | 'table' | 'chart' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  lines?: number;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 bg-gray-200 rounded animate-pulse',
        className,
      )}
    />
  );
}

export function Skeleton({ variant = 'text', className, lines = 3 }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div className={cn('h-10 w-10 bg-gray-200 rounded-full animate-pulse', className)} />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6 space-y-4', className)}>
        <SkeletonLine className="h-5 w-1/3" />
        <SkeletonLine className="h-8 w-1/2" />
        <SkeletonLine className="h-4 w-2/3" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        <SkeletonLine className="h-10 w-full" />
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <SkeletonLine className="h-5 w-1/4 mb-4" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Text variant
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full',
          )}
        />
      ))}
    </div>
  );
}
