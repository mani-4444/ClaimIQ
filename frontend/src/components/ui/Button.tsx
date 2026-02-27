import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'btn-gradient text-white focus-visible:ring-primary-400',
  secondary:
    'bg-dark-600 text-gray-200 hover:bg-dark-500 active:bg-dark-400 border border-white/[0.06] focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-gray-300 hover:bg-white/[0.06] active:bg-white/[0.1] focus-visible:ring-gray-400',
  danger:
    'bg-red-600/90 text-white hover:bg-red-600 active:bg-red-700 shadow-glow-red focus-visible:ring-red-400',
  outline:
    'border border-white/[0.1] bg-transparent text-gray-300 hover:bg-white/[0.06] active:bg-white/[0.1] focus-visible:ring-primary-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 min-h-[36px]',
  md: 'text-sm px-4 py-2 min-h-[40px]',
  lg: 'text-base px-6 py-2.5 min-h-[44px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-[var(--transition-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
          'active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={isDisabled}
        type={type}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  },
);

Button.displayName = 'Button';
