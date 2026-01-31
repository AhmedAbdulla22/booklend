import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../types';
import { auth, supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, fullName: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
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
        console.error('Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for Auth Changes
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
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if (password) {
          // Use password login
          const profile = await auth.signInWithPassword(email, password);
          setUser(profile);
      } else {
          // Fallback to existing magic link flow if no password provided
          await auth.signIn(email);
          alert("Check your email for the login link!");
      }
    } catch (error: any) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, fullName: string, password?: string) => {
    setLoading(true);
    try {
      const profile = await auth.signUp(email, fullName, password);
      // If auto-confirm is off, user might be null here or we might need to alert them
      if (profile) setUser(profile);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await auth.resetPassword(email);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!user) return;
    setLoading(true);
    try {
        const newProfile = { ...user, ...updatedData };
        // We use the db method directly from context for specific user updates if needed,
        // but typically we want the auth service to handle the heavy lifting.
        // Re-using the logic from supabaseClient
        const { data, error } = await supabase
            .from('profiles')
            .update({ full_name: updatedData.full_name, avatar_url: updatedData.avatar_url })
            .eq('id', user.id)
            .select()
            .single();
            
        if (error) throw error;
        setUser(data);
    } finally {
        setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword, updateProfile }}>
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