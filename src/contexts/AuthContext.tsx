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
  trialEndsAt: string | null;
  isPro: boolean;
  isBusiness: boolean;
  isFree: boolean;
  hasPlan: (required: PlanTier) => boolean;
  setEffectivePlan: (plan: PlanTier) => void;
  setUnitRole: (unitRole: string | null) => void;
  refreshSubscription: () => Promise<void>;
  refreshUserData: () => Promise<void>;
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
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Unit-level role set by UnitContext to override global isAdmin determination
  const [unitRole, setUnitRoleState] = useState<string | null>(null);
  const subIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchUserDataRef = useRef<(userId: string) => Promise<void>>();
  // Track whether a fetchUserData call is in-flight to prevent double calls
  const fetchingRef = useRef(false);
  // Track the effective plan set by UnitContext so refreshSubscription doesn't overwrite it
  const effectivePlanRef = useRef<PlanTier | null>(null);

  const resolveInheritedUnitPlan = useCallback(async (userId: string, retryCount = 0): Promise<PlanTier | null> => {
    try {
      const { data: userUnits, error: userUnitsError } = await supabase
        .from('user_units')
        .select('unit_id, is_default')
        .eq('user_id', userId);

      if (userUnitsError || !userUnits?.length) {
        // Retry once after 1.5s to handle race condition on first login after email confirm
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 1500));
          return resolveInheritedUnitPlan(userId, retryCount + 1);
        }
        return null;
      }

      const preferredUnitId = userUnits.find((u) => u.is_default)?.unit_id ?? userUnits[0].unit_id;
      if (!preferredUnitId) return null;

      // Primary source: backend RPC
      const { data: unitPlan, error: unitPlanError } = await supabase.rpc('get_unit_plan', {
        p_unit_id: preferredUnitId,
      });

      const rpcPlan = (unitPlan as PlanTier | null) ?? null;
      if (!unitPlanError && rpcPlan && rpcPlan !== 'free') {
        effectivePlanRef.current = rpcPlan;
        return rpcPlan;
      }

      // Fallback for legacy units where created_by has no profile:
      // infer highest active plan among members of the unit
      const { data: members, error: membersError } = await supabase
        .from('user_units')
        .select('user_id')
        .eq('unit_id', preferredUnitId);

      if (membersError || !members?.length) return rpcPlan;

      const memberIds = members.map((m) => m.user_id);
      const { data: memberProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('plan, plan_status')
        .in('user_id', memberIds);

      if (profilesError || !memberProfiles?.length) return rpcPlan;

      const activePlans = memberProfiles
        .filter((p) => (p.plan_status ?? 'active') === 'active')
        .map((p) => (p.plan as PlanTier) || 'free');

      const inferredPlan: PlanTier = activePlans.includes('business')
        ? 'business'
        : activePlans.includes('pro')
          ? 'pro'
          : 'free';

      if (inferredPlan !== 'free') {
        effectivePlanRef.current = inferredPlan;
      }

      return inferredPlan;
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

        // Handle trial info from check-subscription
        if (data.trial && data.trial_ends_at) {
          setTrialEndsAt(data.trial_ends_at);
        } else {
          setTrialEndsAt(null);
        }

        if (stripePlan === 'free') {
          const inheritedPlan = user?.id ? await resolveInheritedUnitPlan(user.id) : null;

          if (inheritedPlan && inheritedPlan !== 'free') {
            setPlan(inheritedPlan);
            setPlanStatus('active');
            setSubscriptionEnd(data.subscription_end || null);
            setCachedAuth(profile, role, inheritedPlan, 'active');
            return;
          }
        }

        setPlan(stripePlan);
        setPlanStatus(data.trial ? 'trialing' : stripeStatus);
        setSubscriptionEnd(data.subscription_end || null);
        setCachedAuth(profile, role, stripePlan, data.trial ? 'trialing' : stripeStatus);
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
        let nextPlanStatus = profilePlanStatus;
        // Always try to resolve inherited plan for employees
        if (profilePlan === 'free') {
          const inheritedPlan = await resolveInheritedUnitPlan(userId);
          if (inheritedPlan && inheritedPlan !== 'free') {
            nextPlan = inheritedPlan;
            nextPlanStatus = 'active';
          }
        }
        effectivePlanRef.current = nextPlan;
        setPlan(nextPlan);
        setPlanStatus(nextPlanStatus);

        setCachedAuth(p, r, nextPlan, nextPlanStatus);
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
            // Only update user if ID changed to avoid re-render cascades
            setUser(prev => prev?.id === session?.user?.id ? prev : session?.user ?? null);
          }
          return;
        }

        if (isMounted) {
          setSession(session);
          // Only update user if ID changed to avoid unmounting pages on refocus
          setUser(prev => prev?.id === session?.user?.id ? prev : session?.user ?? null);
        }

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock warning
          setTimeout(() => fetchUserData(session.user.id), 0);

          // Audit login event
          if (event === 'SIGNED_IN') {
            supabase.rpc('log_audit_event' as any, {
              p_user_id: session.user.id,
              p_unit_id: null,
              p_action: 'user_login',
              p_entity_type: 'auth',
              p_entity_id: null,
              p_details: { email: session.user.email },
            }).then(() => {});
          }
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

  // Check subscription only ONCE after login (not polling).
  // Webhook handles plan updates in real-time. Only re-check on login + unit switch.
  useEffect(() => {
    if (user) {
      // Single delayed check after login to sync Stripe state
      const timeout = setTimeout(() => refreshSubscription(), 10_000);
      return () => clearTimeout(timeout);
    }
  }, [user?.id]); // Only re-run when user changes (login/logout), NOT on refreshSubscription reference change

  // Re-validate user data when tab regains focus (debounced to avoid rapid re-fetches)
  useEffect(() => {
    let lastFetchAt = 0;
    const DEBOUNCE_MS = 30_000; // 30s minimum between visibility refetches

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        const now = Date.now();
        if (now - lastFetchAt > DEBOUNCE_MS) {
          lastFetchAt = now;
          fetchUserDataRef.current?.(user.id);
        }
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
    setUnitRoleState(null);
    effectivePlanRef.current = null;
    clearCachedAuth();
  };

  // isAdmin is derived from unit-level role when available, with fallback to global role
  // super_admin always has admin access regardless of unit role
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = isSuperAdmin || (
    unitRole !== null
      ? (unitRole === 'owner' || unitRole === 'admin')
      : (role === 'admin')
  );
  const isPro = plan === 'pro' || plan === 'business';
  const isBusiness = plan === 'business';
  const isFree = plan === 'free';

  const hasPlan = useCallback((required: PlanTier) => planSatisfies(plan, required), [plan]);

  const setEffectivePlan = useCallback((newPlan: PlanTier) => {
    effectivePlanRef.current = newPlan;
    setPlan(newPlan);
    setCachedAuth(profile, role, newPlan, planStatus);
  }, [profile, role, planStatus]);

  const setUnitRole = useCallback((newUnitRole: string | null) => {
    setUnitRoleState(newUnitRole);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) {
      effectivePlanRef.current = null; // clear stale plan so it re-resolves
      fetchingRef.current = false; // allow re-fetch
      await fetchUserDataRef.current?.(user.id);
    }
  }, [user]);

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
        trialEndsAt,
        isPro,
        isBusiness,
        isFree,
        hasPlan,
        setEffectivePlan,
        setUnitRole,
        refreshSubscription,
        refreshUserData,
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
