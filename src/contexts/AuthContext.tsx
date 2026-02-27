import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/database';
import type { PlanTier } from '@/lib/plans';
import { planSatisfies } from '@/lib/plans';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  plan: PlanTier;
  planStatus: string;
  subscriptionEnd: string | null;
  isPro: boolean;
  isBusiness: boolean;
  isFree: boolean;
  hasPlan: (required: PlanTier) => boolean;
  setEffectivePlan: (plan: PlanTier) => void;
  refreshSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CACHE_KEY = 'garden_auth_cache';

function getCachedAuth() {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (cached) return JSON.parse(cached) as { profile: Profile | null; role: AppRole | null; plan?: PlanTier; planStatus?: string };
  } catch {}
  return null;
}

function setCachedAuth(profile: Profile | null, role: AppRole | null, plan?: PlanTier, planStatus?: string) {
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ profile, role, plan, planStatus }));
  } catch {}
}

function clearCachedAuth() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = getCachedAuth();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null);
  const [role, setRole] = useState<AppRole | null>(cached?.role ?? null);
  const [plan, setPlan] = useState<PlanTier>((cached?.plan as PlanTier) ?? 'free');
  const [planStatus, setPlanStatus] = useState<string>(cached?.planStatus ?? 'active');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchUserDataRef = useRef<(userId: string) => Promise<void>>();
  // Track whether a fetchUserData call is in-flight to prevent double calls
  const fetchingRef = useRef(false);
  // Track the effective plan set by UnitContext so refreshSubscription doesn't overwrite it
  const effectivePlanRef = useRef<PlanTier | null>(null);

  const resolveInheritedUnitPlan = useCallback(async (userId: string): Promise<PlanTier | null> => {
    try {
      const { data: userUnits, error: userUnitsError } = await supabase
        .from('user_units')
        .select('unit_id, is_default')
        .eq('user_id', userId);

      if (userUnitsError || !userUnits?.length) return null;

      const preferredUnitId = userUnits.find((u) => u.is_default)?.unit_id ?? userUnits[0].unit_id;
      if (!preferredUnitId) return null;

      const { data: unitPlan, error: unitPlanError } = await supabase.rpc('get_unit_plan', {
        p_unit_id: preferredUnitId,
      });

      if (unitPlanError || !unitPlan) return null;

      const inheritedPlan = unitPlan as PlanTier;
      if (inheritedPlan !== 'free') {
        effectivePlanRef.current = inheritedPlan;
      }

      return inheritedPlan;
    } catch (err) {
      console.error('[AuthContext] Failed to resolve inherited unit plan:', err);
      return null;
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('check-subscription error:', error);
        return;
      }
      if (data) {
        const stripePlan = (data.plan as PlanTier) || 'free';
        const stripeStatus = data.subscribed ? 'active' : 'canceled';

        if (stripePlan === 'free') {
          const currentEffective = effectivePlanRef.current;
          const inheritedPlan = !currentEffective || currentEffective === 'free'
            ? (user?.id ? await resolveInheritedUnitPlan(user.id) : null)
            : currentEffective;

          if (inheritedPlan && inheritedPlan !== 'free') {
            setPlan(inheritedPlan);
            setPlanStatus(stripeStatus);
            setSubscriptionEnd(data.subscription_end || null);
            setCachedAuth(profile, role, inheritedPlan, stripeStatus);
            return;
          }
        }

        setPlan(stripePlan);
        setPlanStatus(stripeStatus);
        setSubscriptionEnd(data.subscription_end || null);
        setCachedAuth(profile, role, stripePlan, stripeStatus);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  }, [profile, role, user?.id, resolveInheritedUnitPlan]);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData(userId: string) {
      // Deduplicate: skip if already fetching
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId),
        ]);

        if (!isMounted) return;

        const p = profileResult.data as any;

        const ROLE_PRIORITY: Record<string, number> = { super_admin: 3, admin: 2, funcionario: 1 };
        const rolesData = (roleResult.data as { role: AppRole }[] | null) ?? [];
        const r: AppRole = rolesData.length > 0
          ? rolesData.reduce((best, cur) => (ROLE_PRIORITY[cur.role] ?? 0) > (ROLE_PRIORITY[best.role] ?? 0) ? cur : best).role
          : 'funcionario';

        const profilePlan = (p?.plan as PlanTier) || 'free';
        const profilePlanStatus = p?.plan_status || 'active';

        setProfile(p as Profile | null);
        setRole(r);

        let nextPlan = profilePlan;
        if (!effectivePlanRef.current || effectivePlanRef.current === 'free') {
          const inheritedPlan = await resolveInheritedUnitPlan(userId);
          if (inheritedPlan && inheritedPlan !== 'free') {
            nextPlan = inheritedPlan;
          }
          setPlan(nextPlan);
          setPlanStatus(profilePlanStatus);
        } else {
          nextPlan = effectivePlanRef.current;
        }

        setCachedAuth(p, r, nextPlan, profilePlanStatus);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        fetchingRef.current = false;
        if (isMounted) setIsLoading(false);
      }
    }

    // Keep ref in sync for visibilitychange handler
    fetchUserDataRef.current = fetchUserData;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
          if (isMounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock warning
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setProfile(null);
            setRole(null);
            setPlan('free');
            setPlanStatus('active');
            setSubscriptionEnd(null);
            effectivePlanRef.current = null;
            setIsLoading(false);
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (cached) {
          setIsLoading(false);
        }
        fetchUserData(session.user.id);
      } else {
        clearCachedAuth();
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error('[AuthContext] getSession failed:', err);
      if (isMounted) {
        clearCachedAuth();
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Poll subscription every 5min when logged in
  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => refreshSubscription(), 5000);
      subIntervalRef.current = setInterval(refreshSubscription, 300_000);
      return () => {
        clearTimeout(timeout);
        if (subIntervalRef.current) clearInterval(subIntervalRef.current);
      };
    } else {
      if (subIntervalRef.current) clearInterval(subIntervalRef.current);
    }
  }, [user, refreshSubscription]);

  // Re-validate user data when tab regains focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchUserDataRef.current?.(user.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, redirectTo?: string) => {
    const finalRedirect = redirectTo || `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: finalRedirect,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setPlan('free');
    setPlanStatus('active');
    setSubscriptionEnd(null);
    effectivePlanRef.current = null;
    clearCachedAuth();
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isPro = plan === 'pro' || plan === 'business';
  const isBusiness = plan === 'business';
  const isFree = plan === 'free';

  const hasPlan = useCallback((required: PlanTier) => planSatisfies(plan, required), [plan]);

  const setEffectivePlan = useCallback((newPlan: PlanTier) => {
    effectivePlanRef.current = newPlan;
    setPlan(newPlan);
    setCachedAuth(profile, role, newPlan, planStatus);
  }, [profile, role, planStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin,
        isSuperAdmin,
        isLoading,
        plan,
        planStatus,
        subscriptionEnd,
        isPro,
        isBusiness,
        isFree,
        hasPlan,
        setEffectivePlan,
        refreshSubscription,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
