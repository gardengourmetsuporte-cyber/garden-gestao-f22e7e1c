import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  variant?: 'list' | 'grid' | 'dashboard' | 'detail';
  rows?: number;
  cols?: number;
}

function ListSkeleton({ rows = 5 }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 card-surface" style={{ animationDelay: `${i * 60}ms` }}>
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ rows = 2, cols = 2 }: { rows: number; cols: number }) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={i} className="card-surface p-4 space-y-3" style={{ animationDelay: `${i * 60}ms` }}>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-surface p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="card-surface p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      {/* List */}
      <ListSkeleton rows={3} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card-surface p-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}

export function PageSkeleton({ variant = 'list', rows = 5, cols = 2 }: PageSkeletonProps) {
  return (
    <div className="animate-fade-in">
      {variant === 'list' && <ListSkeleton rows={rows} />}
      {variant === 'grid' && <GridSkeleton rows={rows} cols={cols} />}
      {variant === 'dashboard' && <DashboardSkeleton />}
      {variant === 'detail' && <DetailSkeleton />}
    </div>
  );
}
