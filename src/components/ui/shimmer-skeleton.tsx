import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps {
  className?: string;
}

export function ShimmerSkeleton({ className }: ShimmerSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-secondary/60 relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function CardShimmer({ className }: { className?: string }) {
  return (
    <div className={cn("card-surface p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <ShimmerSkeleton className="w-9 h-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <ShimmerSkeleton className="h-3.5 w-24" />
          <ShimmerSkeleton className="h-2.5 w-16" />
        </div>
      </div>
      <ShimmerSkeleton className="h-8 w-32" />
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-5 w-20 rounded-full" />
        <ShimmerSkeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
