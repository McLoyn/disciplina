import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockAuth } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = mockAuth.getUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { user } = await mockAuth.signIn({ email, password });
    setUser(user);
    return user;
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const { user } = await mockAuth.signUp({ email, password, name });
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await mockAuth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updated = await mockAuth.updateProfile(updates);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
