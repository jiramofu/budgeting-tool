import React from 'react';

interface SkeletonRowProps {
  count?: number;
  columns?: number;
}

const SkeletonRow: React.FC<SkeletonRowProps> = ({ count = 6, columns = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
        >
          {/* Checkbox skeleton */}
          <div className="h-5 w-5 bg-slate-700/50 rounded animate-pulse flex-shrink-0" />

          {/* Column skeletons */}
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 min-w-0">
              <div
                className="h-4 bg-slate-700/50 rounded animate-pulse"
                style={{
                  width: `${60 + Math.random() * 30}%`,
                }}
              />
            </div>
          ))}

          {/* Action button skeleton */}
          <div className="h-8 w-8 bg-slate-700/50 rounded animate-pulse flex-shrink-0" />
        </div>
      ))}
    </>
  );
};

export default SkeletonRow;
