import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ isInitialized: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const res = await authService.refresh();
        setAuth(res.data.user, res.data.access_token);
      } catch {
        clearAuth();
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth, clearAuth, setLoading]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm" style={{ color: 'var(--fg-dim)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
