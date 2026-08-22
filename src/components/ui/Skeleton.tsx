import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white border border-border rounded p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full bg-white border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-border bg-card p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 px-2">
            <Skeleton className="h-5 w-2/3" />
          </div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b border-border p-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1 px-2">
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonProfile: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 bg-white border border-border rounded p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-border">
        <Skeleton className="w-24 h-24 rounded-full md:shrink-0" />
        <div className="flex-1 flex flex-col items-center md:items-start gap-3 w-full">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex flex-wrap gap-2 w-full justify-center md:justify-start">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
};
