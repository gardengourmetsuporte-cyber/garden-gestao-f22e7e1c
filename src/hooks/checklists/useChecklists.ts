import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChecklistType } from '@/types/database';
import { fetchSectorsData, fetchCompletionsData } from './useChecklistFetch';
import { useChecklistCRUD } from './useChecklistCRUD';
import { useChecklistCompletions } from './useChecklistCompletions';

export function useChecklists() {
  const { user } = useAuth();
  const { activeUnitId, isLoading: unitLoading } = useUnit();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentType, setCurrentType] = useState<ChecklistType>('abertura');

  const sectorsKey = useMemo(() => ['checklist-sectors', activeUnitId], [activeUnitId]);
  const completionsKey = useMemo(() => ['checklist-completions', currentDate, currentType, activeUnitId], [currentDate, currentType, activeUnitId]);

  const { data: sectors = [], isLoading: sectorsLoading } = useQuery({
    queryKey: sectorsKey,
    queryFn: () => fetchSectorsData(activeUnitId),
    enabled: !!user && !!activeUnitId,
  });

  const { data: completions = [], isFetched: completionsFetched } = useQuery({
    queryKey: completionsKey,
    queryFn: () => fetchCompletionsData(currentDate, currentType, activeUnitId),
    enabled: !!user && !!currentDate && !!currentType && !!activeUnitId,
    staleTime: 30_000,
  });

  const isLoading = unitLoading || sectorsLoading || (!activeUnitId && !!user);

  const invalidateSectors = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: sectorsKey });
  }, [queryClient, sectorsKey]);

  const fetchCompletions = useCallback(async (date: string, type: ChecklistType) => {
    setCurrentDate(date);
    setCurrentType(type);
    await queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, type, activeUnitId] });
  }, [queryClient, activeUnitId]);

  const crud = useChecklistCRUD({ sectors, sectorsKey, activeUnitId, invalidateSectors });
  const completionOps = useChecklistCompletions({
    completions, sectors, userId: user?.id, activeUnitId,
  });

  return {
    sectors, completions, completionsFetched, isLoading,
    ...crud,
    ...completionOps,
    fetchCompletions,
    refetch: invalidateSectors,
  };
}
