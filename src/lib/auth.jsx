import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { resetCachedSession } from './chatStore.js';

// Demo identities are intentionally obvious: they never impersonate a real
// account and only exist in this browser. They let the whole flow be tried
// before Supabase (or Midtrans) credentials are configured.
const DEMO_KEY = 'etoile.auth.demo';
export const DEMO_ACCOUNTS = {
  member: { email: 'member@etoileroyale.demo', full_name: 'Demo Member', role: 'user' },
  admin: { email: 'admin@etoileroyale.demo', full_name: 'Demo Admin', role: 'admin' }
};

function readDemoAuth() {
  try {
    const value = JSON.parse(window.localStorage.getItem(DEMO_KEY) || 'null');
    return value && (value.role === 'user' || value.role === 'admin') ? value : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [demoAuth, setDemoAuth] = useState(readDemoAuth);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const lastUserId = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data?.session || null);
      setReady(true);
    }).catch(() => { if (active) setReady(true); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setReady(true);
      const id = nextSession?.user?.id || null;
      if (id !== lastUserId.current) {
        // Chat history must be re-scoped when a real account signs in/out.
        resetCachedSession();
        lastUserId.current = id;
      }
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const id = session?.user?.id;
    if (!isSupabaseConfigured || !supabase || !id || session.user.is_anonymous) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase.from('profiles').select('role, full_name').eq('id', id).maybeSingle()
      .then(({ data }) => { if (active) setProfile(data || null); })
      .catch(() => { if (active) setProfile(null); });
    return () => { active = false; };
  }, [session?.user?.id, session?.user?.is_anonymous]);

  const realUser = session?.user && !session.user.is_anonymous ? session.user : null;
  const user = demoAuth || (realUser
    ? {
        id: realUser.id,
        email: realUser.email,
        full_name: profile?.full_name || realUser.user_metadata?.full_name || realUser.email,
        isDemo: false
      }
    : null);
  const isAdmin = Boolean(demoAuth?.role === 'admin' || profile?.role === 'admin');

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured || !supabase) throw new Error('authUnavailable');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    if (!isSupabaseConfigured || !supabase) throw new Error('authUnavailable');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    });
    if (error) throw error;
    return data;
  }, []);

  const signInDemo = useCallback((role) => {
    const account = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.member;
    const next = { ...account, isDemo: true };
    setDemoAuth(next);
    try { window.localStorage.setItem(DEMO_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    resetCachedSession();
  }, []);

  const signOut = useCallback(async () => {
    setDemoAuth(null);
    try { window.localStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
    setProfile(null);
    resetCachedSession();
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAdmin,
    isDemoSession: Boolean(demoAuth),
    canUseEmailAuth: isSupabaseConfigured,
    ready,
    signIn,
    signUp,
    signInDemo,
    signOut
  }), [user, isAdmin, demoAuth, ready, signIn, signUp, signInDemo, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
