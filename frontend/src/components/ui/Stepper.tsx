import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      {/* Horizontal on md+, vertical on mobile */}
      <ol className="flex flex-col md:flex-row md:items-center md:gap-0 gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li
              key={step.label}
              className={cn(
                'flex items-center md:flex-1',
                index < steps.length - 1 && 'md:after:content-[""] md:after:flex-1 md:after:h-0.5 md:after:mx-4',
                index < steps.length - 1 && isCompleted
                  ? 'md:after:bg-primary-600'
                  : 'md:after:bg-gray-200',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium flex-shrink-0 transition-colors',
                    isCompleted && 'bg-primary-600 text-white',
                    isCurrent && 'bg-primary-600 text-white ring-4 ring-primary-100',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      (isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-500',
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500">{step.description}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
