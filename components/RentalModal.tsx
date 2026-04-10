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
        
        {/* ... (Keep existing book details display) ... */}

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