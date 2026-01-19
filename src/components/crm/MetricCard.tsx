import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  className,
}: MetricCardProps) {
  return (
    <div className={cn('metric-card animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-primary/10'
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-1 mt-3">
          {change.trend === 'up' ? (
            <>
              <TrendingUp className="w-4 h-4 text-status-converted" />
              <span className="metric-trend-up">+{change.value}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-status-lost" />
              <span className="metric-trend-down">-{change.value}%</span>
            </>
          )}
          <span className="text-sm text-muted-foreground ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}
