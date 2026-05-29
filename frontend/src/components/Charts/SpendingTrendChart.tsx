/**
 * Spending Trend Chart - Line/Area chart for historical spending
 * Shows spending over time (last 12 months)
 */

import React from 'react';

interface TrendDataPoint {
  month: string;
  spent: number;
  budget: number;
}

interface SpendingTrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  height = 300,
}) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.spent, d.budget)));
  const padding = 40;
  const width = Math.max(data.length * 60, 400);
  const innerHeight = height - padding * 2;
  const innerWidth = width - padding * 2;

  const yScale = innerHeight / maxValue;
  const xScale = innerWidth / (data.length - 1 || 1);

  // Create path for spending line
  const spentPath = data
    .map((point, i) => {
      const x = padding + i * xScale;
      const y = padding + innerHeight - point.spent * yScale;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Create path for budget line
  const budgetPath = data
    .map((point, i) => {
      const x = padding + i * xScale;
      const y = padding + innerHeight - point.budget * yScale;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + innerHeight * (1 - ratio);
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          );
        })}

        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />

        {/* X-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + innerHeight * (1 - ratio);
          const value = Math.round(maxValue * ratio);
          return (
            <text
              key={`y-label-${i}`}
              x={padding - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="currentColor"
              opacity="0.6"
            >
              ${value}
            </text>
          );
        })}

        {/* Budget line (dashed) */}
        <path
          d={budgetPath}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Spent line (solid) */}
        <path
          d={spentPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points for spent */}
        {data.map((point, i) => {
          const x = padding + i * xScale;
          const y = padding + innerHeight - point.spent * yScale;
          return (
            <circle
              key={`point-spent-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill="#2563eb"
              opacity="0.8"
            />
          );
        })}

        {/* X-axis labels */}
        {data.map((point, i) => {
          if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
            const x = padding + i * xScale;
            return (
              <text
                key={`x-label-${i}`}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
                opacity="0.6"
              >
                {point.month}
              </text>
            );
          }
          return null;
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-6 mt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Actual Spending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gray-400" style={{ borderTop: '2px dashed' }}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Budget Target</span>
        </div>
      </div>
    </div>
  );
};

export default SpendingTrendChart;
