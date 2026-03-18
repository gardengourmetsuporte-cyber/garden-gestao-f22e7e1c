import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useSubscriptions } from './useSubscriptions';
import { useState, useCallback } from 'react';

export interface RecurringSuggestion {
  description: string;
  name: string;
  price: number;
  category: string;
  type: 'assinatura' | 'conta_fixa';
  billing_cycle: 'mensal' | 'anual' | 'semanal';
  management_url: string;
  months_detected: number;
  source: 'known_service' | 'ai' | 'pattern';
}

const DISMISSED_KEY_VERSION = 'v2';

function getDismissedKey(unitId: string) {
  return `recurring_dismissed_${DISMISSED_KEY_VERSION}_${unitId}`;
}

function getDismissed(unitId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(getDismissedKey(unitId)) || '[]');
  } catch {
    return [];
  }
}

function addDismissed(unitId: string, name: string) {
  const current = getDismissed(unitId);
  current.push(name.toLowerCase().trim());
  localStorage.setItem(getDismissedKey(unitId), JSON.stringify(current));
}

export function useRecurringSuggestions() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const { create } = useSubscriptions();
  const [dismissedLocal, setDismissedLocal] = useState<string[]>([]);

  const { data: suggestions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['recurring-suggestions', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];

      const { data, error } = await supabase.functions.invoke('detect-recurring', {
        body: { unit_id: activeUnitId },
      });

      if (error) {
        console.error('detect-recurring error:', error);
        throw error;
      }

      const dismissed = getDismissed(activeUnitId);
      const items = (data?.suggestions || []) as RecurringSuggestion[];
      return items.filter((s) => !dismissed.includes(s.name.toLowerCase().trim()));
    },
    enabled: !!activeUnitId && !!user,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    retry: 1,
  });

  const filteredSuggestions = suggestions.filter(
    (s) => !dismissedLocal.includes(s.name.toLowerCase().trim())
  );

  const dismiss = useCallback((name: string) => {
    if (!activeUnitId) return;
    addDismissed(activeUnitId, name);
    setDismissedLocal((prev) => [...prev, name.toLowerCase().trim()]);
  }, [activeUnitId]);

  const accept = useCallback(async (suggestion: RecurringSuggestion) => {
    await create({
      name: suggestion.name,
      category: suggestion.category,
      type: suggestion.type,
      price: suggestion.price,
      billing_cycle: suggestion.billing_cycle,
      next_payment_date: null,
      status: 'ativo',
      management_url: suggestion.management_url || null,
      notes: null,
      icon: null,
      color: null,
    });
    dismiss(suggestion.name);
  }, [create, dismiss]);

  return {
    suggestions: filteredSuggestions,
    isLoading,
    isError: !!error,
    accept,
    dismiss,
    refetch,
  };
}
