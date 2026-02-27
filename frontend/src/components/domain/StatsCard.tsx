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
    <Card variant="default" padding="md" className={cn('relative overflow-hidden group hover:border-primary-500/20', className)}>
      {/* Subtle glow effect in corner */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-all duration-500" />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trendDirection === 'up' && (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              )}
              {trendDirection === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              {trendDirection === 'neutral' && (
                <Minus className="h-4 w-4 text-gray-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trendDirection === 'up' && 'text-emerald-400',
                  trendDirection === 'down' && 'text-red-400',
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
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
