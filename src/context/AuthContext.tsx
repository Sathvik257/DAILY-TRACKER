import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  ApiError,
  clearToken,
  fetchMe,
  getToken,
  login as apiLogin,
  register as apiRegister,
  setToken,
  setUnauthorizedHandler,
  type User,
} from '../api/client';
import { clearLegacyLocalStorage } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    clearLegacyLocalStorage();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(() => {});
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then(({ user }) => setUser(user))
      .catch(() => {
        clearToken();
        clearLegacyLocalStorage();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    clearLegacyLocalStorage();
    const { token, user } = await apiLogin(email, password);
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    clearLegacyLocalStorage();
    const { token, user } = await apiRegister(email, password, name);
    setToken(token);
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
