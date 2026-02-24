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
  const [isLoading, setIsLoading] = useState(!cached);
  const subIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('check-subscription error:', error);
        return;
      }
      if (data) {
        const newPlan = (data.plan as PlanTier) || 'free';
        setPlan(newPlan);
        setPlanStatus(data.subscribed ? 'active' : 'canceled');
        setSubscriptionEnd(data.subscription_end || null);
        // Update cache
        setCachedAuth(profile, role, newPlan, data.subscribed ? 'active' : 'canceled');
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  }, [profile, role]);

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION' && initialSessionHandled) return;

        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          setSession(session);
          setUser(session?.user ?? null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole(null);
          setPlan('free');
          setPlanStatus('active');
          setSubscriptionEnd(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialSessionHandled = true;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        clearCachedAuth();
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Poll subscription every 60s when logged in
  useEffect(() => {
    if (user) {
      // Initial check (after a small delay to not block rendering)
      const timeout = setTimeout(() => refreshSubscription(), 2000);
      subIntervalRef.current = setInterval(refreshSubscription, 60_000);
      return () => {
        clearTimeout(timeout);
        if (subIntervalRef.current) clearInterval(subIntervalRef.current);
      };
    } else {
      if (subIntervalRef.current) clearInterval(subIntervalRef.current);
    }
  }, [user, refreshSubscription]);

  async function fetchUserData(userId: string) {
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
          .eq('user_id', userId)
          .maybeSingle(),
      ]);
      
      const p = profileResult.data as any;
      const r = (roleResult.data?.role as AppRole) ?? 'funcionario';
      
      // Extract plan from profile (instant, no Stripe call)
      const profilePlan = (p?.plan as PlanTier) || 'free';
      const profilePlanStatus = p?.plan_status || 'active';
      
      setProfile(p as Profile | null);
      setRole(r);
      setPlan(profilePlan);
      setPlanStatus(profilePlanStatus);
      setCachedAuth(p, r, profilePlan, profilePlanStatus);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setIsLoading(false);
    }
  }

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
    clearCachedAuth();
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isPro = plan === 'pro' || plan === 'business';
  const isBusiness = plan === 'business';
  const isFree = plan === 'free';

  const hasPlan = useCallback((required: PlanTier) => planSatisfies(plan, required), [plan]);

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
