/**
 * Category Breakdown Chart - Pie/Donut chart for spending distribution
 * Shows how much is spent in each category as a percentage
 */

import React from 'react';

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  showLegend?: boolean;
  showPercentage?: boolean;
  donutMode?: boolean;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data,
  showLegend = true,
  showPercentage = true,
  donutMode = false,
}) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let currentAngle = -90; // Start from top

  const size = 240;
  const radius = 80;
  const innerRadius = donutMode ? 50 : 0;

  const slices = data.map((item, index) => {
    const percentage = (item.amount / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate path
    const x1 = (size / 2) + radius * Math.cos(startRad);
    const y1 = (size / 2) + radius * Math.sin(startRad);
    const x2 = (size / 2) + radius * Math.cos(endRad);
    const y2 = (size / 2) + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    let pathData = `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    if (donutMode) {
      const ix1 = (size / 2) + innerRadius * Math.cos(startRad);
      const iy1 = (size / 2) + innerRadius * Math.sin(startRad);
      const ix2 = (size / 2) + innerRadius * Math.cos(endRad);
      const iy2 = (size / 2) + innerRadius * Math.sin(endRad);
      pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    }

    const labelAngle = startAngle + angle / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelRadius = donutMode ? (radius + innerRadius) / 2 : radius * 0.65;
    const labelX = (size / 2) + labelRadius * Math.cos(labelRad);
    const labelY = (size / 2) + labelRadius * Math.sin(labelRad);

    currentAngle = endAngle;

    return {
      path: pathData,
      percentage,
      labelX,
      labelY,
      ...item,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-4">
        {/* Background circle */}
        {donutMode ? (
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" opacity="0.1" />
        ) : (
          <circle cx={size / 2} cy={size / 2} r={radius} fill="currentColor" opacity="0.05" />
        )}

        {/* Slices */}
        {slices.map((slice, index) => (
          <g key={index} className="hover:opacity-80 transition-opacity cursor-pointer">
            <path d={slice.path} fill={slice.color} opacity="0.85" />
            {slice.percentage > 5 && showPercentage && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="white"
                opacity="0.9"
              >
                {Math.round(slice.percentage)}%
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="w-full grid grid-cols-2 gap-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-700 dark:text-gray-300 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ${item.amount.toFixed(2)} ({((item.amount / total) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Simple Bar Chart for category spending comparison
 */
interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  maxValue?: number;
}

export const SimpleBudgetBarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
}) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  const barHeight = 30;
  const height = data.length * (barHeight + 12) + 40;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`}>
        {data.map((item, i) => {
          const y = 20 + i * (barHeight + 12);
          const barWidth = (item.value / max) * 300;

          return (
            <g key={item.name}>
              {/* Category label */}
              <text x="10" y={y + barHeight / 2 + 4} fontSize="13" fontWeight="600">
                {item.name}
              </text>

              {/* Bar background */}
              <rect
                x="100"
                y={y}
                width="300"
                height={barHeight}
                fill="currentColor"
                opacity="0.05"
                rx="4"
              />

              {/* Bar */}
              <rect
                x="100"
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                opacity="0.8"
                rx="4"
              />

              {/* Value label */}
              <text
                x={110 + barWidth}
                y={y + barHeight / 2 + 4}
                fontSize="12"
                fontWeight="600"
                fill="currentColor"
              >
                ${item.value.toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default CategoryBreakdownChart;
