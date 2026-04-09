import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Bell, Globe, AlertCircle, LogOut, Moon, Sun, Check, ChevronDown, Loader2 } from 'lucide-react'; // Added Loader2
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Loan, Profile, LoanStatus, Language, Role } from '../types';
import { CONSTANTS } from '../constants';

export const Navbar = ({ 
  user, 
  notifications, 
  onLogout,
  onProfileClick
}: { 
  user: Profile, 
  notifications: Loan[], 
  onLogout: () => void,
  onProfileClick: () => void
}) => {
  const navigate = useNavigate();
  const { t, language, setLanguage, dir, localize } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  
  // 1. Add local loading state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 2. Wrap the logout call to manage local state
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const overdueCount = notifications.filter(n => 
    (n.status === LoanStatus.ACTIVE && new Date() > new Date(n.due_date)) || 
    n.status === LoanStatus.OVERDUE
  ).length;

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'ku', label: 'کوردی' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <nav className="sticky top-4 z-50 mx-4">
      <GlassCard className="px-6 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all active:scale-95 group"
          onClick={() => navigate(user.role === Role.ADMIN ? '/admin' : '/dashboard')}
          title={t('dashboard')}
        >
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Library size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent hidden sm:block">
            {t('app_name')}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <Button variant="ghost" onClick={toggleTheme} className="!p-2">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>

          {/* Language Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <Button 
              variant="ghost" 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
              className="!p-2 flex items-center gap-1"
            >
              <Globe size={20} />
              <span className="hidden sm:block text-sm font-bold uppercase mx-1">{language}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isLangMenuOpen && (
              <div 
                className={`absolute top-full mt-2 w-40 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col gap-1 ${dir === 'rtl' ? 'left-0' : 'right-0'} animate-fade-in`}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between w-full
                        ${language === lang.code 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                    `}
                  >
                    <span className={lang.code === 'ar' || lang.code === 'ku' ? 'font-arabic' : 'font-sans'}>
                      {lang.label}
                    </span>
                    {language === lang.code && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" className="!p-2 relative" onClick={() => setShowNotifs(!showNotifs)}>
              <Bell size={20} />
              {overdueCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
              )}
            </Button>
            
            {showNotifs && (
              <div className={`absolute top-full mt-2 w-72 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col gap-2 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                <div className="flex justify-between items-center px-2 py-1">
                   <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('notifications')}</h4>
                   {overdueCount > 0 && (
                     <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-bold">
                       {overdueCount} {t('overdue')}
                     </span>
                   )}
                </div>
                {overdueCount === 0 ? (
                  <p className="text-sm text-slate-400 px-2 py-2 text-center">{t('no_notifications')}</p>
                ) : (
                  notifications.map(n => {
                    const isOverdue = new Date() > new Date(n.due_date);
                    if (!isOverdue) return null;
                    return (
                      <div key={n.id} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50 flex gap-2 items-start">
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{localize(n.book, 'title')}</p>
                          <p className="text-red-500 font-bold">{t('overdue')}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* User Profile - Clickable */}
          <div 
            onClick={onProfileClick}
            className="flex items-center gap-2 ps-2 border-s border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src={user.avatar_url || `${CONSTANTS.DEFAULT_IMAGES.AVATAR_API}${encodeURIComponent(user.full_name || 'User')}`}
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-white dark:border-slate-600 shadow-sm" 
            />
            <div className="hidden sm:block leading-tight">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('welcome')}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">{user.full_name}</p>
            </div>
          </div>
          
          {/* 3. Disable button and show spinner during logout */}
          <Button 
            variant="secondary" 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className="!p-2 ms-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-transparent"
          >
            {isLoggingOut ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
          </Button>
        </div>
      </GlassCard>
    </nav>
  );
};