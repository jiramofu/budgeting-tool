import React from 'react';

interface SkeletonCardProps {
  count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm"
        >
          <div className="space-y-4">
            {/* Title skeleton */}
            <div className="h-6 bg-slate-700/50 rounded w-3/4 animate-pulse" />

            {/* Content skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse" />
              <div className="h-4 bg-slate-700/50 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-slate-700/50 rounded w-4/6 animate-pulse" />
            </div>

            {/* Footer skeleton */}
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-slate-700/50 rounded w-20 animate-pulse" />
              <div className="h-8 bg-slate-700/50 rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;
