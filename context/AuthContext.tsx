import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  
  // We use a ref to track the ID without triggering re-renders or infinite loops
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true; 

    // Helper function to fetch and set the profile
    const fetchProfileAndSetUser = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profile && isMounted) {
          currentUserId.current = userId; // Update our tracker
          setUser(profile);
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      }
    };

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          // Only fetch if it's a new user
          if (currentUserId.current !== session.user.id) {
             await fetchProfileAndSetUser(session.user.id);
          }
        }
      } catch (error) {
        console.error('Auth Init Error:', error);
      } finally {
        if (isMounted) setLoading(false); 
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // This check STOPS the tab-switching refresh bug!
        if (currentUserId.current !== session.user.id) {
          await fetchProfileAndSetUser(session.user.id);
        }
      } else {
        if (isMounted) {
          currentUserId.current = null;
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // <-- EMPTY ARRAY! This guarantees the listener is only created ONCE.

  const login = async (email: string, password?: string) => {
    if (password) {
      const profile = await auth.signInWithPassword(email, password);
      currentUserId.current = profile.id;
      setUser(profile);
    } else {
      await auth.signIn(email);
    }
  };

  const signup = async (email: string, fullName: string, password?: string) => {
    const profile = await auth.signUp(email, fullName, password);
    if (profile) {
      currentUserId.current = profile.id;
      setUser(profile);
    }
  };

  const logout = async () => {
    currentUserId.current = null;
    setUser(null);
    try {
      await auth.signOut();
    } catch (error) {
      console.warn("Backend signout issue (safe to ignore):", error);
    }
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