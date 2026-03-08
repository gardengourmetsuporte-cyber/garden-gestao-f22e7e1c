import { useDashboardStats } from '@/hooks/useDashboardStats';
import { QuickStats } from './QuickStats';
import { DashboardSection } from './DashboardSection';

export function QuickStatsWidget() {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) return null;

  const quickStatsData = [
    {
      title: 'Itens Críticos',
      value: stats.criticalItems,
      icon: 'AlertTriangle',
      variant: stats.criticalItems > 0 ? 'warning' : 'default',
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pendingOrders,
      icon: 'ShoppingCart',
      variant: stats.pendingOrders > 0 ? 'primary' : 'default',
    },
    {
      title: 'Fechamentos Pendentes',
      value: stats.pendingClosings,
      icon: 'FileText',
      variant: stats.pendingClosings > 0 ? 'destructive' : 'default',
    },
    {
      title: 'Resgates Pendentes',
      value: stats.pendingRedemptions,
      icon: 'Gift',
      variant: stats.pendingRedemptions > 0 ? 'success' : 'default',
    },
  ];

  return (
    <DashboardSection
      title="Visão Geral"
      className="animate-fade-in"
    >
      <QuickStats stats={quickStatsData} columns={2} />
    </DashboardSection>
  );
}
