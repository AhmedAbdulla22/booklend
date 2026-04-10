import React, { useState } from 'react';
import { Loader2 } from 'lucide-react'; // Import Loader2 for the spinner
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Book } from '../types';
import { CONSTANTS, TRANSLATIONS } from '../constants';

// Add isSubmitting to the props interface
export const RentalModal = ({ 
  book, 
  onClose, 
  onConfirm, 
  isSubmitting 
}: { 
  book: Book | null, 
  onClose: () => void, 
  onConfirm: (days: number) => void,
  isSubmitting?: boolean 
}) => {
  const { t, localize } = useLanguage();
  const [days, setDays] = useState(7);
  
  const getLocalizedGenreLabel = (g: string) => {
    const key = `genre_${g.toLowerCase()}` as keyof typeof TRANSLATIONS['en'];
    const translated = t(key);
    return translated === key ? g : translated;
  };
  
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-6 bg-white/95">
        <h2 className="text-xl font-bold mb-4">{t('confirm_rent')}</h2>
        
        {/* Book Details */}
        <div className="mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">{localize(book, 'title')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{localize(book, 'author')}</p>
          <Badge color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs mt-2">
            {getLocalizedGenreLabel(book.genre)}
          </Badge>
        </div>

        {/* Days Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('rent_days')}
          </label>
          <div className="flex items-center gap-3">
            <input 
              type="range" 
              min="1" 
              max="30" 
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="flex-1"
              disabled={isSubmitting}
            />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[3rem] text-right">
              {days} {t('days')}
            </span>
          </div>
        </div>

        {/* Cost Calculation */}
        <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 dark:text-slate-300">{t('daily_rate')}</span>
            <span className="font-medium">{t('currency')}{book.daily_rate}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 dark:text-slate-300">{t('rent_days')}</span>
            <span className="font-medium">{days}</span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>{t('total_cost')}</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {t('currency')}{book.daily_rate * days}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button 
            fullWidth 
            onClick={() => onConfirm(days)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            ) : (
              t('confirm_rent')
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};