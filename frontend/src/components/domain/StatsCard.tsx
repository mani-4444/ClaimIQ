import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number; // Percentage change
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ title, value, trend, icon, className }: StatsCardProps) {
  const trendDirection =
    trend === undefined || trend === 0
      ? 'neutral'
      : trend > 0
        ? 'up'
        : 'down';

  return (
    <Card variant="default" padding="md" className={cn('relative', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trendDirection === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              {trendDirection === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              {trendDirection === 'neutral' && (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trendDirection === 'up' && 'text-green-600',
                  trendDirection === 'down' && 'text-red-600',
                  trendDirection === 'neutral' && 'text-gray-500',
                )}
              >
                {trend > 0 ? '+' : ''}
                {trend}% from last month
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-50 text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
