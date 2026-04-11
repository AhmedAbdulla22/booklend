import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/supabaseClient';
import { Loan, Role } from '../types';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [myLoans, setMyLoans] = useState<Loan[]>([]);

  // Fetch loans for notifications
  useEffect(() => {
    let isMounted = true;
    
    const fetchLoans = async () => {
      if (!user) return;
      try {
        const loans = await db.getLoans(user.role === Role.ADMIN ? undefined : user.id);
        if (isMounted) setMyLoans(loans || []);
      } catch (error) {
        // Silently catch the error so React doesn't crash during logout
        console.warn("Could not fetch loans, user might be logging out.");
      }
    };
    
    fetchLoans();
    return () => { isMounted = false; };
  }, [user]);

const handleLogout = async () => {
  try {
    // 1. Instantly navigate to clear the screen
    navigate('/login', { replace: true });
    // 2. Perform background cleanup
    await logout();
  } catch (error) {
    console.warn("Logout background error ignored:", error);
  }
};

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen pb-20 transition-all duration-300 ${language === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <Navbar 
        user={user} 
        notifications={myLoans} 
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />
      <main className="max-w-7xl mx-auto px-4 mt-8 min-h-[50vh]">
        <Outlet context={{ 
            myLoans, 
            refreshLoans: async () => {
              if (!user) return;
              try {
                const loans = await db.getLoans(user.role === Role.ADMIN ? undefined : user.id);
                setMyLoans(loans || []);
              } catch (error) {
                console.warn("Failed to refresh loans");
              }
            }
        }} />
      </main>
    </div>
  );
};