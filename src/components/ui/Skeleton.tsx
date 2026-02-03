'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
    text: 'rounded',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-mono-light/10',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// 텍스트 스켈레톤
export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = '60%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className="h-4"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

// 카드 스켈레톤
export function SkeletonCard({
  hasImage = true,
  className,
}: {
  hasImage?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-2xl overflow-hidden', className)}>
      {hasImage && (
        <Skeleton variant="default" className="aspect-[16/9] rounded-none" />
      )}
      <div className="p-5 space-y-3">
        <Skeleton variant="rounded" className="h-6 w-20" />
        <Skeleton variant="text" className="h-5" width="90%" />
        <Skeleton variant="text" className="h-5" width="70%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

// 아바타 스켈레톤
export function SkeletonAvatar({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

// 프로필 스켈레톤
export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <SkeletonAvatar size={56} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-5" width="40%" />
        <Skeleton variant="text" className="h-4" width="60%" />
      </div>
    </div>
  );
}

// 히어로 스켈레톤
export function SkeletonHero({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-screen w-full', className)}>
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">
        <Skeleton variant="text" className="h-16 w-96 max-w-full" />
        <Skeleton variant="text" className="h-8 w-64 max-w-full" />
        <Skeleton variant="rounded" className="h-12 w-40 mt-4" />
      </div>
    </div>
  );
}

// 그리드 스켈레톤
export function SkeletonGrid({
  count = 6,
  columns = 3,
  hasImage = true,
  className,
}: {
  count?: number;
  columns?: number;
  hasImage?: boolean;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns as keyof typeof gridCols] || gridCols[3], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} hasImage={hasImage} />
      ))}
    </div>
  );
}

// 섹션 헤더 스켈레톤
export function SkeletonSectionHeader({ className }: { className?: string }) {
  return (
    <div className={cn('text-center space-y-4 mb-12', className)}>
      <Skeleton variant="text" className="h-8 w-32 mx-auto" />
      <Skeleton variant="text" className="h-12 w-64 mx-auto" />
      <Skeleton variant="text" className="h-5 w-96 max-w-full mx-auto" />
    </div>
  );
}

export default Skeleton;
