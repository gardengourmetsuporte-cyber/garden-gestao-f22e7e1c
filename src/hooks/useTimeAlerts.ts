import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { useTimeAlertSettings } from '@/hooks/useTimeAlertSettings';

interface TimeAlertTrigger {
  id: string;
  hour: number;
  moduleStatusKey: string;
  title: string;
  message: string;
  origin: string;
  settingsKey: string;
  level: 'warning' | 'critical';
}

function buildTriggers(settings: Record<string, { enabled: boolean; warningHour: number | null; criticalHour: number | null }>): TimeAlertTrigger[] {
  const triggers: TimeAlertTrigger[] = [];

  const s = settings;

  if (s.finance?.enabled) {
    if (s.finance.warningHour != null) triggers.push({ id: 'finance_w', hour: s.finance.warningHour, moduleStatusKey: '/finance', title: '💰 Contas do dia em aberto', message: 'Você ainda tem contas a pagar hoje. Confira o módulo Financeiro.', origin: 'financeiro', settingsKey: 'finance', level: 'warning' });
    if (s.finance.criticalHour != null) triggers.push({ id: 'finance_c', hour: s.finance.criticalHour, moduleStatusKey: '/finance', title: '🚨 Urgente: Pagamentos do dia', message: 'O horário comercial está acabando e há contas do dia não pagas!', origin: 'financeiro', settingsKey: 'finance', level: 'critical' });
  }

  if (s.checklist_abertura?.enabled) {
    if (s.checklist_abertura.warningHour != null) triggers.push({ id: 'checklist_ab_w', hour: s.checklist_abertura.warningHour, moduleStatusKey: '/checklists', title: '📋 Checklist de abertura incompleto', message: 'O checklist de abertura ainda não foi concluído. Complete antes do almoço!', origin: 'checklist', settingsKey: 'checklist_abertura', level: 'warning' });
    if (s.checklist_abertura.criticalHour != null) triggers.push({ id: 'checklist_ab_c', hour: s.checklist_abertura.criticalHour, moduleStatusKey: '/checklists', title: '⚠️ Checklist de abertura atrasado!', message: 'O checklist de abertura está muito atrasado. Finalize agora!', origin: 'checklist', settingsKey: 'checklist_abertura', level: 'critical' });
  }

  if (s.checklist_fechamento?.enabled) {
    if (s.checklist_fechamento.warningHour != null) triggers.push({ id: 'checklist_fe_w', hour: s.checklist_fechamento.warningHour, moduleStatusKey: '/checklists', title: '📋 Checklist de fechamento pendente', message: 'Hora de iniciar o checklist de fechamento do dia.', origin: 'checklist', settingsKey: 'checklist_fechamento', level: 'warning' });
    if (s.checklist_fechamento.criticalHour != null) triggers.push({ id: 'checklist_fe_c', hour: s.checklist_fechamento.criticalHour, moduleStatusKey: '/checklists', title: '⚠️ Checklist de fechamento atrasado!', message: 'O checklist de fechamento está muito atrasado!', origin: 'checklist', settingsKey: 'checklist_fechamento', level: 'critical' });
  }

  if (s.cash_closing?.enabled) {
    if (s.cash_closing.criticalHour != null) triggers.push({ id: 'cash_c', hour: s.cash_closing.criticalHour, moduleStatusKey: '/cash-closing', title: '🏦 Fechamento de caixa pendente', message: 'Ainda há fechamentos de caixa pendentes de validação!', origin: 'financeiro', settingsKey: 'cash_closing', level: 'critical' });
  }

  return triggers;
}

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
  const { settings } = useTimeAlertSettings();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !isAdmin) return;

    cleanOldKeys();

    const triggers = buildTriggers(settings);

    const checkTriggers = async () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const fired = getFiredAlerts();

      for (const trigger of triggers) {
        if (currentHour < trigger.hour) continue;
        if (fired.includes(trigger.id)) continue;

        const status = moduleStatuses[trigger.moduleStatusKey];
        if (!status || status.level === 'ok' || status.count === 0) continue;

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

    checkTriggers();

    const interval = setInterval(checkTriggers, 5 * 60_000);
    return () => clearInterval(interval);
  }, [user, isAdmin, activeUnitId, moduleStatuses, settings]);
}
