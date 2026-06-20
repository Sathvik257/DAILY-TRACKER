import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  fetchMe,
  getToken,
  login as apiLogin,
  register as apiRegister,
  setToken,
  setUnauthorizedHandler,
  type User,
} from '../api/client';

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

  const logout = useCallback(() => {}, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(() => {});
  }, []);

  useEffect(() => {
    const defaultEmail = 'guest@dailytracker.local';
    const defaultPassword = 'guest-password-123';
    const defaultName = 'Sathvik';

    const handleOfflineFallback = () => {
      const mockUser: User = {
        id: 'local-guest-id',
        email: defaultEmail,
        name: defaultName,
      };
      setUser(mockUser);
      setLoading(false);
    };

    const runAutoAuth = () => {
      apiLogin(defaultEmail, defaultPassword)
        .then(({ token, user }) => {
          setToken(token);
          setUser(user);
          setLoading(false);
        })
        .catch(() => {
          apiRegister(defaultEmail, defaultPassword, defaultName)
            .then(({ token, user }) => {
              setToken(token);
              setUser(user);
              setLoading(false);
            })
            .catch(() => {
              handleOfflineFallback();
            });
        });
    };

    const token = getToken();
    if (!token) {
      runAutoAuth();
      return;
    }

    fetchMe()
      .then(({ user }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        runAutoAuth();
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiLogin(email, password);
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


