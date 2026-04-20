import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, saveToken, clearToken, getToken } from './api';

interface User {
  id: string;
  fullName: string;
  email: string;
  city: string;
  deliveryPlatform: string;
  trustScore: number;
  upiId?: string;
  weeklyEarnings: number;
}

interface AuthContextType {
  user:     User | null;
  token:    string | null;
  loading:  boolean;
  login:    (email: string, otp: string) => Promise<void>;
  logout:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      const stored = await getToken();
      if (stored) {
        setToken(stored);
        try {
          const res = await api.get('/api/user/profile');
          setUser(res.data);
        } catch {
          await clearToken();
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, otp: string) => {
    const res = await api.post('/api/auth/login-verify', { email, otp });
    const { token: jwt, user: userData } = res.data;
    await saveToken(jwt);
    setToken(jwt);
    setUser(userData);
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
