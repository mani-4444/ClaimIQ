import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-sm transition-all duration-[var(--transition-fast)]',
            'bg-dark-700/50 text-gray-200 placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-dark-800 disabled:text-gray-500 disabled:cursor-not-allowed',
            'read-only:bg-dark-800/50',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/[0.08] focus:border-primary-500 focus:ring-primary-500/20',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [errorId, hintId].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
