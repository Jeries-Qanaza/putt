import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();
const ADMIN_SESSION_KEY = 'putt_admin_session';

async function fetchAdminProfile(userId, email = '') {
  if (!supabase || (!userId && !email)) return null;

  let query = supabase.from('users').select('*');
  if (userId && email) {
    query = query.or(`id.eq.${userId},email.eq.${email}`);
  } else if (userId) {
    query = query.eq('id', userId);
  } else {
    query = query.eq('email', email);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ standalone: true });

  const resetAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const syncAdminAuth = useCallback(async () => {
    const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    if (!isAdminRoute || !isSupabaseConfigured || !supabase) {
      resetAuthState();
      setAuthError(null);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const sessionFlag = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session || !sessionFlag) {
        if (session && !sessionFlag) {
          await supabase.auth.signOut();
        }
        resetAuthState();
        setAuthError(null);
        setIsLoadingAuth(false);
        return;
      }

      const profile = await fetchAdminProfile(session.user.id, session.user.email || '');

      if (!profile || profile.role !== 'admin') {
        window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
        await supabase.auth.signOut();
        resetAuthState();
        setAuthError({
          type: 'auth_required',
          message: 'This user is not allowed to access the admin area.',
        });
        setIsLoadingAuth(false);
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email || profile.email || '',
        name: profile.name || profile.full_name || session.user.email || 'Admin',
        role: profile.role,
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      resetAuthState();
      setAuthError({
        type: 'auth_required',
        message: error?.message || 'Failed to verify admin access.',
      });
    } finally {
      setIsLoadingAuth(false);
    }
  }, [resetAuthState]);

  useEffect(() => {
    syncAdminAuth();

    if (!isSupabaseConfigured || !supabase) return undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncAdminAuth();
    });

    return () => subscription.unsubscribe();
  }, [syncAdminAuth]);

  const checkAppState = async () => {
    setIsLoadingAuth(true);
    await syncAdminAuth();
    setIsLoadingPublicSettings(false);
  };

  const login = async ({ email, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    const authUser = data.user;
    if (!authUser) {
      throw new Error('No user returned from Supabase.');
    }

    const profile = await fetchAdminProfile(authUser.id, authUser.email || '');
    if (!profile || profile.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account does not have admin access.');
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'active');
    setUser({
      id: authUser.id,
      email: authUser.email || profile.email || '',
      name: profile.name || profile.full_name || authUser.email || 'Admin',
      role: profile.role,
    });
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const logout = async (shouldRedirect = true) => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    resetAuthState();

    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    resetAuthState();
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      logout,
      navigateToLogin,
      checkAppState,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
