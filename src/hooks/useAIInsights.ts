import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIInsight {
  emoji: string;
  title: string;
  description: string;
  action_route?: string;
}

export function useAIInsights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-insights', user?.id],
    queryFn: async (): Promise<AIInsight[]> => {
      const { data, error } = await supabase.functions.invoke('ai-insights');
      
      if (error) {
        console.error('AI insights error:', error);
        return [];
      }

      return data?.insights || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
