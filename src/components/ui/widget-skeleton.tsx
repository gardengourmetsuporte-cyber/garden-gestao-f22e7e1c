import { cn } from '@/lib/utils';

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-secondary/60 relative overflow-hidden", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

/** Finance hero card skeleton */
export function FinanceSkeleton() {
  return (
    <div className="card-surface p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-6 w-32" />
        </div>
      </div>
      <div className="flex gap-3">
        <Shimmer className="h-9 flex-1 rounded-lg" />
        <Shimmer className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/** Stats grid skeleton (2x3) */
export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card-surface p-3">
          <div className="flex items-center gap-3">
            <Shimmer className="w-9 h-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Shimmer className="h-2.5 w-16" />
              <Shimmer className="h-6 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Leaderboard list skeleton */
export function LeaderboardSkeleton() {
  return (
    <div className="card-surface p-4 space-y-3">
      <Shimmer className="h-4 w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="w-8 h-8 rounded-full" />
          <Shimmer className="h-3.5 flex-1" />
          <Shimmer className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Calendar widget skeleton */
export function CalendarSkeleton() {
  return (
    <div className="card-surface p-4 space-y-3">
      <Shimmer className="h-4 w-28" />
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Shimmer className="h-3.5 w-32" />
              <Shimmer className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic card skeleton */
export function GenericWidgetSkeleton() {
  return (
    <div className="card-surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Shimmer className="w-9 h-9 rounded-xl" />
        <Shimmer className="h-3.5 w-24" />
      </div>
      <Shimmer className="h-16 w-full rounded-lg" />
    </div>
  );
}
