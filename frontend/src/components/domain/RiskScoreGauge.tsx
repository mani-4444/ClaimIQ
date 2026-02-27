import { cn } from '../../lib/utils';

interface RiskScoreGaugeProps {
  score: number; // 0-100
  className?: string;
}

function getScoreColor(score: number): string {
  if (score < 30) return 'text-emerald-400';
  if (score < 60) return 'text-amber-400';
  if (score < 80) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreLabel(score: number): string {
  if (score < 30) return 'Low Risk';
  if (score < 60) return 'Medium Risk';
  if (score < 80) return 'High Risk';
  return 'Very High Risk';
}

function getStrokeColor(score: number): string {
  if (score < 30) return '#10b981';
  if (score < 60) return '#f59e0b';
  if (score < 80) return '#f97316';
  return '#ef4444';
}

function getGlowFilter(score: number): string {
  if (score < 30) return 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))';
  if (score < 60) return 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))';
  if (score < 80) return 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))';
  return 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))';
}

export function RiskScoreGauge({ score, className }: RiskScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Fraud risk score: ${clampedScore} out of 100 - ${getScoreLabel(clampedScore)}`}
    >
      <div className="relative h-32 w-32">
        <svg
          viewBox="0 0 100 100"
          className="transform -rotate-90 h-full w-full"
          style={{ filter: getGlowFilter(clampedScore) }}
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getStrokeColor(clampedScore)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', getScoreColor(clampedScore))}>
            {clampedScore}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">/ 100</span>
        </div>
      </div>
      <p className={cn('text-sm font-medium mt-2', getScoreColor(clampedScore))}>
        {getScoreLabel(clampedScore)}
      </p>
    </div>
  );
}
