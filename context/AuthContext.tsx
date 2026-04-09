import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../types';
import { auth, supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: Profile | null;
  loading: boolean; // Keep this ONLY for the initial app load
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, fullName: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Initial load flag

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setUser(profile);
        }
      } catch (error) {
        console.error('Auth Init Error:', error);
      } finally {
        setLoading(false); // Initial load finished
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
      // Do not touch 'setLoading' here; it only matters for the first boot
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (password) {
      const profile = await auth.signInWithPassword(email, password);
      setUser(profile);
    } else {
      await auth.signIn(email);
    }
  };

  const signup = async (email: string, fullName: string, password?: string) => {
    const profile = await auth.signUp(email, fullName, password);
    if (profile) setUser(profile);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: updatedData.full_name, avatar_url: updatedData.avatar_url })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword: auth.resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};