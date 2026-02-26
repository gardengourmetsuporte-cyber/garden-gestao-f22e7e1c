import { useCashClosing } from '@/hooks/useCashClosing';
import { WeeklySummary } from '@/components/cashClosing/WeeklySummary';

export default function LazyWeeklySummaryWidget() {
  const { closings } = useCashClosing();
  return <WeeklySummary closings={closings} />;
}
