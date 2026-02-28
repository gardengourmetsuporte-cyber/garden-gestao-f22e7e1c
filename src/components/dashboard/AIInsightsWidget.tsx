import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useAIInsights, type AIInsight } from '@/hooks/useAIInsights';
import { ShimmerSkeleton } from '@/components/ui/shimmer-skeleton';

function InsightCard({ insight }: { insight: AIInsight }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => insight.action_route && navigate(insight.action_route)}
      className="w-full text-left p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors card-press"
    >
      <div className="flex gap-2.5 items-start">
        <span className="text-lg leading-none mt-0.5 shrink-0">{insight.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{insight.title}</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{insight.description}</p>
        </div>
        {insight.action_route && (
          <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50 shrink-0 mt-1" />
        )}
      </div>
    </button>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-3.5 rounded-xl bg-muted/40">
          <div className="flex gap-2.5 items-start">
            <ShimmerSkeleton className="w-5 h-5 rounded-md shrink-0" />
            <div className="flex-1 space-y-1.5">
              <ShimmerSkeleton className="h-3.5 w-28" />
              <ShimmerSkeleton className="h-2.5 w-44" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AIInsightsWidget() {
  const { data: insights, isLoading, isError } = useAIInsights();

  if (isError || (!isLoading && (!insights || insights.length === 0))) {
    return null;
  }

  return (
    <div className="card-surface p-4 space-y-3 animate-spring-in">
      <div className="flex items-center gap-2">
        <span className="text-sm">💡</span>
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Insights da IA</span>
      </div>
      {isLoading ? (
        <InsightsSkeleton />
      ) : (
        <div className="space-y-2">
          {insights!.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
