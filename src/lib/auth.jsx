// @refresh reset
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, api } from "./api";

const AuthContext = createContext(null);

async function buildUser(authUser) {
  if (!authUser) return null;
  const profile = await api.fetchProfile(authUser.id);
  return {
    ...authUser,
    full_name: profile.full_name || authUser.user_metadata?.full_name || '',
    onboarding_complete: profile.onboarding_complete ?? false,
    bless_points_balance: profile.bless_points_balance ?? 0,
    veda_streak: profile.veda_streak ?? 0,
    last_activity_date: profile.last_activity_date || null,
    selected_pillars: profile.selected_pillars || [],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const enriched = await buildUser(session.user);
      setUser(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const enriched = await buildUser(data.user);
    setUser(enriched);
    return enriched;
  };

  const register = async (email, password, full_name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
    });
    if (error) throw error;
    if (!data.user || !data.session) return null;
    const enriched = await buildUser(data.user);
    setUser(enriched);
    return enriched;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const refresh = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setUser(null); return null; }
    const enriched = await buildUser(authUser);
    setUser(enriched);
    return enriched;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
