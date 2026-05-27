import React from 'react';

interface SkeletonProps {
  count?: number;
  height?: number;
  circle?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ count = 1, height = 20, circle = false, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 animate-pulse ${circle ? 'rounded-full' : 'rounded'} ${className}`}
          style={{ height: `${height}px`, marginBottom: i < count - 1 ? '12px' : '0' }}
        />
      ))}
    </>
  );
};

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton count={1} height={120} className="w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton count={1} height={300} className="w-full" />
      <Skeleton count={1} height={300} className="w-full" />
    </div>
    <Skeleton count={1} height={400} className="w-full" />
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton count={1} height={20} className="flex-1" />
        <Skeleton count={1} height={20} className="w-24" />
        <Skeleton count={1} height={20} className="w-24" />
      </div>
    ))}
  </div>
);
