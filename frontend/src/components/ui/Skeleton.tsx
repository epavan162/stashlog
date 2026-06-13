import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function LogEditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <Skeleton className="h-11 w-32 rounded-full" />
    </div>
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="space-y-4 p-6 rounded-card border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-card)' }}>
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-14 w-full rounded-card" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <LogEditorSkeleton />
        </div>
        <div className="space-y-4">
          <SummaryCardSkeleton />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-32 rounded-card" />
            <Skeleton className="h-24 flex-1 rounded-card" />
          </div>
        </div>
      </div>
    </div>
  );
}
