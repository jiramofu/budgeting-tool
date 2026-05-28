import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percent: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-slate-800 border-slate-700',
    success: 'bg-emerald-900/20 border-emerald-700/50',
    warning: 'bg-amber-900/20 border-amber-700/50',
    danger: 'bg-red-900/20 border-red-700/50',
  };

  const trendColors = {
    up: trend?.direction === 'up' ? 'text-emerald-500' : 'text-red-500',
    down: trend?.direction === 'down' ? 'text-red-500' : 'text-emerald-500',
  };

  return (
    <div className={`rounded-lg border ${variantStyles[variant]} p-6 backdrop-blur-sm`}>
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        </div>
        {icon && (
          <div className="text-slate-500 ml-2">
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-slate-50">{value}</p>
        {subtitle && (
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-2">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trend.direction === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.direction === 'up' ? '+' : '-'}{trend.percent}%
          </span>
          <span className="text-slate-400 text-sm">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
