import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Bell, Globe, AlertCircle, LogOut, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
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
  const [showNotifs, setShowNotifs] = useState(false);
  
  // Language Menu State
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const overdueCount = notifications.filter(n => 
    (n.status === LoanStatus.ACTIVE && new Date() > new Date(n.due_date)) || 
    n.status === LoanStatus.OVERDUE
  ).length;

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'ku', label: 'کوردی' },
  ];

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-300">
      <div className="px-6 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
          onClick={() => navigate(user.role === Role.ADMIN ? '/admin' : '/dashboard')}
          title={t('dashboard')}
        >
          <div className="p-2 bg-blue-600 rounded text-white">
            <Library size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
            {t('app_name')}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
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
                className={`absolute top-full mt-1 w-40 p-1 bg-white border border-gray-300 rounded shadow-md z-50 flex flex-col gap-1 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between w-full
                        ${language === lang.code 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100'
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
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </Button>
            
            {showNotifs && (
              <div className={`absolute top-full mt-1 w-72 p-2 bg-white border border-gray-300 rounded shadow-md z-50 flex flex-col gap-2 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                <div className="flex justify-between items-center px-2 py-1">
                   <h4 className="text-sm font-bold text-gray-500">{t('notifications')}</h4>
                   {overdueCount > 0 && (
                     <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
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
                      <div key={n.id} className="text-xs p-2 bg-red-50 rounded border border-red-200 flex gap-2 items-start">
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-700">{localize(n.book, 'title')}</p>
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
            className="flex items-center gap-2 ps-2 border-s border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src={user.avatar_url || `${CONSTANTS.DEFAULT_IMAGES.AVATAR_API}${encodeURIComponent(user.full_name || 'User')}`}
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-gray-300 shadow-sm" 
            />
            <div className="hidden sm:block leading-tight">
              <p className="text-xs text-gray-500">{t('welcome')}</p>
              <p className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">{user.full_name}</p>
            </div>
          </div>
          
          <Button variant="secondary" onClick={onLogout} className="ms-2 text-red-600 hover:text-red-700 border-red-300">
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </nav>
  );
};