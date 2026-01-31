import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Book } from '../types';
import { TRANSLATIONS } from '../constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  dir: 'ltr' | 'rtl';
  localize: (item: any, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[language][key] || key;
  };

  const dir = (language === 'ar' || language === 'ku') ? 'rtl' : 'ltr';

  // Helper to get title_ar, title_ku, or default title based on current language
  const localize = (item: any, field: string): string => {
    if (!item) return '';
    
    const localizedKey = `${field}_${language}`;
    // Return localized string if exists and not empty, otherwise fallback to base field (English)
    return item[localizedKey] ? item[localizedKey] : item[field];
  };

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Add font classes based on language if needed
    if (language === 'ar' || language === 'ku') {
      document.body.classList.add('font-arabic');
      document.body.classList.remove('font-sans');
    } else {
      document.body.classList.add('font-sans');
      document.body.classList.remove('font-arabic');
    }
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, localize }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};