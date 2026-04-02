import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Book } from '../types';
import { CONSTANTS, TRANSLATIONS } from '../constants';

export const RentalModal = ({ book, onClose, onConfirm }: { book: Book | null, onClose: () => void, onConfirm: (days: number) => void }) => {
  const { t, localize } = useLanguage();
  const [days, setDays] = useState(7);
  
  // Helper to localize genre strings
  const getLocalizedGenreLabel = (g: string) => {
    const key = `genre_${g.toLowerCase()}` as keyof typeof TRANSLATIONS['en'];
    const translated = t(key);
    // If the translation key doesn't exist (returns the key itself), use the original string
    return translated === key ? g : translated;
  };
  
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-6 bg-white/95">
        <h2 className="text-xl font-bold mb-4">{t('confirm_rent')}</h2>
        
        <div className="flex gap-4 mb-6">
          <img 
            src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
            className="w-24 h-36 object-cover rounded-lg shadow-md" 
            alt="" 
          />
          <div className="space-y-2">
            <h3 className="font-bold">{localize(book, 'title')}</h3>
            <p className="text-sm text-slate-500">{localize(book, 'author')}</p>
            <Badge>{getLocalizedGenreLabel(book.genre)}</Badge>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('rent_days')}: {days}</label>
            <input 
              type="range" 
              min="1" 
              max="30" 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 {t('days')}</span>
              <span>30 {t('days')}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('daily_rate')}</span>
              <span>{t('currency')}{book.daily_rate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
              <span>{t('total_cost')}</span>
              <span className="text-indigo-600">{t('currency')}{(book.daily_rate * days).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>{t('cancel')}</Button>
          <Button fullWidth onClick={() => onConfirm(days)}>{t('confirm_rent')}</Button>
        </div>
      </GlassCard>
    </div>
  );
};