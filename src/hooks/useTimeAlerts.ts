import { useEffect, useRef, useCallback } from 'react';
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
  level: 'warning' | 'critical';
}

function buildTriggers(settings: Record<string, { enabled: boolean; warningHour: number | null; criticalHour: number | null }>): TimeAlertTrigger[] {
  const triggers: TimeAlertTrigger[] = [];
  const s = settings;

  if (s.finance?.enabled) {
    if (s.finance.warningHour != null) triggers.push({ id: 'finance_w', hour: s.finance.warningHour, moduleStatusKey: '/finance', title: '💰 Contas do dia em aberto', message: 'Você ainda tem contas a pagar hoje. Confira o módulo Financeiro.', origin: 'financeiro', level: 'warning' });
    if (s.finance.criticalHour != null) triggers.push({ id: 'finance_c', hour: s.finance.criticalHour, moduleStatusKey: '/finance', title: '🚨 Urgente: Pagamentos do dia', message: 'O horário comercial está acabando e há contas do dia não pagas!', origin: 'financeiro', level: 'critical' });
  }

  if (s.checklist_abertura?.enabled) {
    if (s.checklist_abertura.warningHour != null) triggers.push({ id: 'checklist_ab_w', hour: s.checklist_abertura.warningHour, moduleStatusKey: '/checklists', title: '📋 Checklist de abertura incompleto', message: 'O checklist de abertura ainda não foi concluído.', origin: 'checklist', level: 'warning' });
    if (s.checklist_abertura.criticalHour != null) triggers.push({ id: 'checklist_ab_c', hour: s.checklist_abertura.criticalHour, moduleStatusKey: '/checklists', title: '⚠️ Checklist de abertura atrasado!', message: 'O checklist de abertura está muito atrasado!', origin: 'checklist', level: 'critical' });
  }

  if (s.checklist_fechamento?.enabled) {
    if (s.checklist_fechamento.warningHour != null) triggers.push({ id: 'checklist_fe_w', hour: s.checklist_fechamento.warningHour, moduleStatusKey: '/checklists', title: '📋 Checklist de fechamento pendente', message: 'Hora de iniciar o checklist de fechamento do dia.', origin: 'checklist', level: 'warning' });
    if (s.checklist_fechamento.criticalHour != null) triggers.push({ id: 'checklist_fe_c', hour: s.checklist_fechamento.criticalHour, moduleStatusKey: '/checklists', title: '⚠️ Checklist de fechamento atrasado!', message: 'O checklist de fechamento está muito atrasado!', origin: 'checklist', level: 'critical' });
  }

  if (s.cash_closing?.enabled) {
    if (s.cash_closing.criticalHour != null) triggers.push({ id: 'cash_c', hour: s.cash_closing.criticalHour, moduleStatusKey: '/cash-closing', title: '🏦 Fechamento de caixa pendente', message: 'Ainda há fechamentos de caixa pendentes de validação!', origin: 'financeiro', level: 'critical' });
  }

  return triggers;
}

function getTodayKey(): string {
  return `time_alerts_fired_${format(new Date(), 'yyyy-MM-dd')}`;
}

function getFiredAlerts(): Set<string> {
  try {
    const stored = localStorage.getItem(getTodayKey());
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markAlertFired(alertId: string) {
  const fired = getFiredAlerts();
  fired.add(alertId);
  localStorage.setItem(getTodayKey(), JSON.stringify([...fired]));
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
  // Refs to avoid effect re-runs on every render
  const moduleStatusesRef = useRef(moduleStatuses);
  const settingsRef = useRef(settings);
  const activeUnitIdRef = useRef(activeUnitId);
  const isRunningRef = useRef(false);

  // Update refs without re-triggering the effect
  useEffect(() => { moduleStatusesRef.current = moduleStatuses; }, [moduleStatuses]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { activeUnitIdRef.current = activeUnitId; }, [activeUnitId]);

  const checkTriggers = useCallback(async () => {
    if (!user || !isAdmin || isRunningRef.current) return;
    isRunningRef.current = true;

    try {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const fired = getFiredAlerts();
      const triggers = buildTriggers(settingsRef.current);

      for (const trigger of triggers) {
        if (currentHour < trigger.hour) continue;
        if (fired.has(trigger.id)) continue;

        const status = moduleStatusesRef.current[trigger.moduleStatusKey];
        if (!status || status.level === 'ok' || status.count === 0) continue;

        // Mark FIRST to prevent duplicates even if insert is slow
        markAlertFired(trigger.id);

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'alert',
          title: trigger.title,
          description: trigger.message,
          origin: trigger.origin,
          unit_id: activeUnitIdRef.current || undefined,
        });
      }
    } finally {
      isRunningRef.current = false;
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    cleanOldKeys();

    // Initial check after a delay to let module statuses settle
    const initialTimeout = setTimeout(checkTriggers, 3000);
    const interval = setInterval(checkTriggers, 5 * 60_000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, isAdmin, checkTriggers]);
}
