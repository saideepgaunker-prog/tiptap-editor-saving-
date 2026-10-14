import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuthSession,
  readAuthToken,
  readAuthUser,
  writeAuthSession,
} from '../utils/authStorage.js';
import {
  fetchCurrentUser,
  loginAccount,
  registerAccount,
} from '../utils/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readAuthUser());
  const [token, setToken] = useState(() => readAuthToken());
  const [booting, setBooting] = useState(Boolean(readAuthToken()));

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!readAuthToken()) {
        setBooting(false);
        return;
      }
      try {
        const me = await fetchCurrentUser();
        if (cancelled) return;
        if (!me) {
          clearAuthSession();
          setUser(null);
          setToken('');
        } else {
          setUser(me);
          writeAuthSession({ token: readAuthToken(), user: me });
        }
      } catch {
        if (!cancelled) {
          // Keep cached user if network fails; manuscripts may still sync later
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((session) => {
    writeAuthSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const session = await loginAccount({ email, password });
      applySession(session);
      return session;
    },
    [applySession]
  );

  const register = useCallback(
    async ({ email, password, name }) => {
      const session = await registerAccount({ email, password, name });
      applySession(session);
      return session;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setToken('');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
