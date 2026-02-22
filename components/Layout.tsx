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
    const fetchLoans = async () => {
      if (user) {
        const loans = await db.getLoans(user.role === Role.ADMIN ? undefined : user.id);
        setMyLoans(loans);
      }
    };
    fetchLoans();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen pb-20 bg-gray-50 transition-colors ${language === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <Navbar 
        user={user} 
        notifications={myLoans} 
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />
      {/* Main Content Area with Outlet for Child Routes */}
      <main className="max-w-7xl mx-auto px-4 mt-8 min-h-[50vh]">
        <Outlet context={{ myLoans, refreshLoans: async () => {
             const loans = await db.getLoans(user.role === Role.ADMIN ? undefined : user.id);
             setMyLoans(loans);
        }}} />
      </main>
    </div>
  );
};