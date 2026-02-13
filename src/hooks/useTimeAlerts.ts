import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useModuleStatus } from '@/hooks/useModuleStatus';

interface TimeAlertTrigger {
  id: string;
  hour: number;
  module: string;
  title: string;
  message: string;
  origin: string;
}

const ALERT_TRIGGERS: TimeAlertTrigger[] = [
  { id: 'finance_16', hour: 16, module: '/finance', title: '💰 Contas do dia em aberto', message: 'Você ainda tem contas a pagar hoje. Confira o módulo Financeiro.', origin: 'financeiro' },
  { id: 'finance_18', hour: 18, module: '/finance', title: '🚨 Urgente: Pagamentos do dia', message: 'O horário comercial está acabando e há contas do dia não pagas!', origin: 'financeiro' },
  { id: 'checklist_ab_12', hour: 12, module: '/checklists', title: '📋 Checklist de abertura incompleto', message: 'O checklist de abertura ainda não foi concluído. Complete antes do almoço!', origin: 'checklist' },
  { id: 'checklist_ab_14', hour: 14, module: '/checklists', title: '⚠️ Checklist de abertura atrasado!', message: 'O checklist de abertura está muito atrasado. Finalize agora!', origin: 'checklist' },
  { id: 'checklist_fe_18', hour: 18.5, module: '/checklists', title: '📋 Checklist de fechamento pendente', message: 'Hora de iniciar o checklist de fechamento do dia.', origin: 'checklist' },
  { id: 'checklist_fe_21', hour: 21, module: '/checklists', title: '⚠️ Checklist de fechamento atrasado!', message: 'O checklist de fechamento está muito atrasado!', origin: 'checklist' },
  { id: 'cash_22', hour: 22, module: '/cash-closing', title: '🏦 Fechamento de caixa pendente', message: 'Ainda há fechamentos de caixa pendentes de validação!', origin: 'financeiro' },
];

function getTodayKey(): string {
  return `time_alerts_fired_${format(new Date(), 'yyyy-MM-dd')}`;
}

function getFiredAlerts(): string[] {
  try {
    const stored = localStorage.getItem(getTodayKey());
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markAlertFired(alertId: string) {
  const fired = getFiredAlerts();
  if (!fired.includes(alertId)) {
    fired.push(alertId);
    localStorage.setItem(getTodayKey(), JSON.stringify(fired));
  }
}

// Clean old keys
function cleanOldKeys() {
  const todayKey = getTodayKey();
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('time_alerts_fired_') && key !== todayKey) {
      localStorage.removeItem(key);
    }
  }
}

export function useTimeAlerts() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const moduleStatuses = useModuleStatus();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !isAdmin) return;

    cleanOldKeys();

    const checkTriggers = async () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const fired = getFiredAlerts();

      for (const trigger of ALERT_TRIGGERS) {
        if (currentHour < trigger.hour) continue;
        if (fired.includes(trigger.id)) continue;

        // Only fire if module actually has pending items
        const status = moduleStatuses[trigger.module];
        if (!status || status.level === 'ok' || status.count === 0) continue;

        // Insert notification (push is auto-triggered by DB trigger)
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'alert',
          title: trigger.title,
          description: trigger.message,
          origin: trigger.origin,
          unit_id: activeUnitId || undefined,
        });

        markAlertFired(trigger.id);
      }

      lastCheckRef.current = Date.now();
    };

    // Initial check
    checkTriggers();

    // Check every 5 minutes
    const interval = setInterval(checkTriggers, 5 * 60_000);
    return () => clearInterval(interval);
  }, [user, isAdmin, activeUnitId, moduleStatuses]);
}
