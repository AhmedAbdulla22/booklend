import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Book } from '../types';
import { CONSTANTS, TRANSLATIONS } from '../constants';

export const BookDetailsModal = ({ book, onClose, onRent }: { book: Book | null, onClose: () => void, onRent: (book: Book) => void }) => {
  const { t, localize } = useLanguage();
  
  // Helper to localize genre strings
  const getLocalizedGenreLabel = (g: string) => {
    const key = `genre_${g.toLowerCase()}` as keyof typeof TRANSLATIONS['en'];
    const translated = t(key);
    // If the translation key doesn't exist (returns the key itself), use the original string
    return translated === key ? g : translated;
  };
  
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-slate-900 flex flex-col md:flex-row relative shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-5/12 bg-slate-100 dark:bg-slate-800 relative shrink-0 flex items-center justify-center p-6 md:p-0">
          {/* Mobile: Constrained width, Desktop: Full cover */}
          <div className="relative shadow-2xl rounded-lg overflow-hidden w-40 md:w-full md:h-full aspect-[2/3] md:rounded-none">
              <img 
                src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
                alt={localize(book, 'title')} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50 md:opacity-30"></div>
          </div>
          <div className="absolute top-4 left-4 z-10 hidden md:block">
             <Badge color="bg-white/90 text-emerald-700 backdrop-blur shadow-sm">{getLocalizedGenreLabel(book.genre)}</Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col overflow-y-auto max-h-[60vh] md:max-h-full">
          <div className="p-6 md:p-8 flex-1">
            <div className="mb-6">
               <div className="md:hidden mb-2">
                 <Badge color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{getLocalizedGenreLabel(book.genre)}</Badge>
               </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">{localize(book, 'title')}</h2>
              <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">{localize(book, 'author')}</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
               <div className="flex-1 min-w-[100px] p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('available')}</span>
                  <span className={`text-xl font-bold ${book.available_copies > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {book.available_copies}
                  </span>
               </div>
               <div className="flex-1 min-w-[100px] p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('daily_rate')}</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {t('currency')}{book.daily_rate}
                  </span>
               </div>
               <div className="flex-1 min-w-[100px] p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('copies')}</span>
                  <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{book.total_copies}</span>
               </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-slate-300 dark:bg-slate-600"></span>
                {t('description')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                {localize(book, 'description') || "No description available for this book."}
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex gap-4 mt-auto">
            <Button variant="secondary" onClick={onClose} fullWidth className="h-12">
              {t('close')}
            </Button>
            <Button 
              fullWidth 
              className="h-12 text-lg shadow-emerald-500/20"
              disabled={book.available_copies === 0} 
              onClick={() => {
                onClose();
                onRent(book);
              }}
            >
              {t('rent_now')}
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};