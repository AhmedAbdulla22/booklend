import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

interface ExpirationAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  language: 'en' | 'ar' | 'ku';
}

export const ExpirationAlertModal: React.FC<ExpirationAlertModalProps> = ({
  isOpen,
  onClose,
  bookTitle,
  language
}) => {
  const { t, dir } = useLanguage();

  if (!isOpen) return null;

  const getAlertContent = () => {
    switch (language) {
      case 'ar':
        return {
          title: 'تنبيه انتهاء الإعارة',
          message: `تنبيه: ستنتهي مدة إعارة كتاب (${bookTitle}) غداً. يرجى إعادته لتجنب غرامة التأخير اليومية.`,
          icon: <Clock className="w-6 h-6 text-amber-500" />,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        };
      case 'ku':
        return {
          title: 'ئاگاداری کۆتایی هێنانەوەی پێدان',
          message: `ئاگاداری: ماوەی پێدانی کتێبی (${bookTitle}) سەرەڕۆژە. تکایە پێش ئەوەی کێشەی ڕۆژانەی دواکەوتن ڕووبدات پێبدە.`,
          icon: <Clock className="w-6 h-6 text-amber-500" />,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        };
      default:
        return {
          title: 'Loan Expiration Alert',
          message: `The loan period for book (${bookTitle}) will expire tomorrow. Please return it to avoid daily late fees.`,
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        };
    }
  };

  const alertContent = getAlertContent();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <GlassCard className="w-full max-w-md p-6 bg-white/95" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-4">
          {alertContent.icon}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {alertContent.title}
            </h2>
          </div>
          <Badge color={alertContent.badgeColor}>
            {language === 'ar' ? 'غداً' : language === 'ku' ? 'سەرەڕۆژە' : 'Tomorrow'}
          </Badge>
        </div>

        {/* Alert Message */}
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {alertContent.message}
          </p>
        </div>

        {/* Book Info */}
        <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-16 bg-gradient-to-br from-amber-400 to-emerald-500 rounded shadow-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs text-center">
                {language === 'ar' ? 'كتاب' : language === 'ku' ? 'کتێب' : 'BOOK'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 dark:text-white text-sm">
                {bookTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? 'مستحق غداً' : language === 'ku' ? 'بەیانی دەبێتەوە' : 'Due Tomorrow'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onClose}
            className="shadow-amber-500/20"
          >
            {language === 'ar' ? 'فهمت' : language === 'ku' ? 'تێگەیشتم' : 'I Understand'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
