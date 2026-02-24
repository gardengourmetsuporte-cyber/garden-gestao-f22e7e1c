import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUnitTheme, applyUnitTheme } from '@/lib/unitThemes';
import { toast } from 'sonner';

export interface Unit {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UnitContextType {
  units: Unit[];
  activeUnit: Unit | null;
  activeUnitId: string | null;
  setActiveUnitId: (id: string) => void;
  isLoading: boolean;
  isTransitioning: boolean;
  refetchUnits: () => Promise<void>;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

const ACTIVE_UNIT_KEY = 'garden_active_unit_id';

export function UnitProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasInitialized = useRef(false);
  const fetchedForUserRef = useRef<string | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!user) {
      setUnits([]);
      fetchedForUserRef.current = null;
      setIsLoading(false);
      return;
    }

    // Reset loading state so ProtectedRoute waits for fresh data
    setIsLoading(true);

    try {
      // Fetch units the user has access to
      const { data: userUnitsData } = await supabase
        .from('user_units')
        .select('unit_id, is_default')
        .eq('user_id', user.id);

      if (!userUnitsData || userUnitsData.length === 0) {
        if (isSuperAdmin) {
          // Super admin with no specific assignments - fetch all active units
          const { data: allUnits } = await supabase
            .from('units')
            .select('*')
            .eq('is_active', true)
            .order('name');

          setUnits((allUnits as Unit[]) || []);

          const stored = localStorage.getItem(ACTIVE_UNIT_KEY);
          const validUnit = (allUnits || []).find(u => u.id === stored);
          if (validUnit) {
            setActiveUnitIdState(validUnit.id);
          } else if (allUnits && allUnits.length > 0) {
            setActiveUnitIdState(allUnits[0].id);
          }
        } else {
          // Regular user with no units - auto-provision a default unit
          try {
            const { data: newUnitId, error: provisionError } = await supabase
              .rpc('auto_provision_unit', { p_user_id: user.id });
            if (provisionError) throw provisionError;
            if (newUnitId) {
              // Re-fetch units after provisioning
              const { data: newUnits } = await supabase
                .from('units')
                .select('*')
                .eq('id', newUnitId);
              setUnits((newUnits as Unit[]) || []);
              if (newUnits && newUnits.length > 0) {
                setActiveUnitIdState(newUnits[0].id);
                localStorage.setItem(ACTIVE_UNIT_KEY, newUnits[0].id);
              }
            }
          } catch (err) {
            console.error('Auto-provision failed:', err);
            setUnits([]);
          }
        }
      } else {
        const unitIds = userUnitsData.map(u => u.unit_id);
        const { data: unitsData } = await supabase
          .from('units')
          .select('*')
          .in('id', unitIds)
          .eq('is_active', true)
          .order('name');

        setUnits((unitsData as Unit[]) || []);

        // Restore from localStorage, or use default, or first
        const stored = localStorage.getItem(ACTIVE_UNIT_KEY);
        const validUnit = (unitsData || []).find(u => u.id === stored);
        if (validUnit) {
          setActiveUnitIdState(validUnit.id);
        } else {
          const defaultAssign = userUnitsData.find(u => u.is_default);
          const defaultUnit = defaultAssign
            ? (unitsData || []).find(u => u.id === defaultAssign.unit_id)
            : (unitsData || [])[0];
          if (defaultUnit) {
            setActiveUnitIdState(defaultUnit.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
      toast.error('Erro ao carregar unidades. Tente recarregar a página.');
    } finally {
      fetchedForUserRef.current = user.id;
      setIsLoading(false);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Prevent flash: if user exists but we haven't fetched for them yet, stay loading
  const effectiveLoading = isLoading || authLoading || (!!user && fetchedForUserRef.current !== user.id);

  const activeUnit = units.find(u => u.id === activeUnitId) || null;

  // Apply theme when activeUnit changes
  useEffect(() => {
    if (!activeUnit) return;
    const theme = getUnitTheme(activeUnit.slug);
    applyUnitTheme(theme);

    // Only show transition after initial load
    if (hasInitialized.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
    hasInitialized.current = true;
  }, [activeUnit?.id, activeUnit?.slug]);

  const setActiveUnitId = useCallback((id: string) => {
    setActiveUnitIdState(id);
    localStorage.setItem(ACTIVE_UNIT_KEY, id);
  }, []);

  return (
    <UnitContext.Provider
      value={{
        units,
        activeUnit,
        activeUnitId,
        setActiveUnitId,
        isLoading: effectiveLoading,
        isTransitioning,
        refetchUnits: fetchUnits,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}
