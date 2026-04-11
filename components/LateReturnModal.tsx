import React from 'react';
import { AlertTriangle, X, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Loan } from '../types';
import { TRANSLATIONS } from '../constants';

interface LateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  lateLoans: Loan[];
  language: 'en' | 'ar' | 'ku';
}

export const LateReturnModal: React.FC<LateReturnModalProps> = ({
  isOpen,
  onClose,
  lateLoans,
  language
}) => {
  const { t, dir } = useLanguage();

  if (!isOpen) return null;

  const getModalContent = () => {
    const translations = TRANSLATIONS[language];
    
    switch (language) {
      case 'ar':
        return {
          title: translations.late_return_title || 'تنبيه تأخير',
          urgentText: translations.late_return_urgent || 'عاجل',
          message: (bookTitle: string, penaltyFee: number) => 
            `لقد تجاوزت مهلة إرجاع كتاب (${bookTitle}). يرجى الإرجاع فوراً لتجنب زيادة الغرامات.`,
          penaltyLabel: translations.late_fee || 'غرامة التأخير',
          daysOverdue: translations.days_overdue || 'أيام تأخير',
          dismissAction: translations.close || 'إغلاق',
          dailyRateLabel: 'الغرامة اليومية'
        };
      case 'ku':
        return {
          title: translations.late_return_title || 'ئاگاداری دواکەوتن',
          urgentText: translations.late_return_urgent || 'بەپەلە',
          message: (bookTitle: string, penaltyFee: number) => 
            `ماوەی گەڕاندنەوەی کتێبی (${bookTitle}) بەسەرچووە. تکایە بە زووترین کات بیگەڕێنەوە.`,
          penaltyLabel: translations.late_fee || 'سزای دواکەوتن',
          daysOverdue: translations.days_overdue || 'ڕۆژ دواکەوتووە',
          dismissAction: translations.close || 'داخستن',
          dailyRateLabel: 'سزای ڕۆژانە'
        };
      default:
        return {
          title: 'URGENT: Late Return Notice',
          urgentText: 'URGENT',
          message: (bookTitle: string, penaltyFee: number) => 
            `You have missed the return deadline for book "${bookTitle}". Please return immediately to avoid further penalties.`,
          penaltyLabel: 'Late Fee',
          daysOverdue: 'Days Overdue',
          dismissAction: 'I Understand',
          dailyRateLabel: 'Daily Rate'
        };
    }
  };

  const modalContent = getModalContent();
  
  // Calculate total penalty based on DB values
  const totalPenalty = lateLoans.reduce((sum, loan) => sum + (Number(loan.penalty_fee) || 0), 0);

  const calculateDaysOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(now.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <GlassCard 
        className="w-full max-w-2xl p-6 bg-white/95 border-red-200 dark:border-red-800" 
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{ direction: dir }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {modalContent.title}
              </h2>
              <Badge color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs mt-1">
                {modalContent.urgentText}
              </Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Alert Message */}
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            {lateLoans.length === 1 
              ? modalContent.message(
                  lateLoans[0].book?.title_ar || lateLoans[0].book?.title || 'Book',
                  Number(lateLoans[0].penalty_fee) || 0
                )
              : language === 'ar' 
                ? `لديك (${lateLoans.length}) كتب متأخرة. يرجى إعادتها فوراً.`
                : language === 'ku'
                ? `تۆ (${lateLoans.length}) کتێبی دواکەوتووت هەیە. تکایە بیگەڕێنەوە.`
                : `You have ${lateLoans.length} overdue books. Please return them immediately.`
            }
          </p>
        </div>

        {/* Late Loans List */}
        <div className="mb-6 space-y-3 max-h-64 overflow-y-auto pr-2">
          {lateLoans.map((loan) => {
            const daysOverdue = calculateDaysOverdue(loan.due_date);
            // Matches 'daily_rate' from your SQL schema
            const bookDailyRate = Number(loan.book?.daily_rate) || 0; 

            return (
              <div key={loan.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                      {loan.book?.title_ar || loan.book?.title || 'Unknown Book'}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} className="text-red-500" />
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {daysOverdue} {modalContent.daysOverdue}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="font-medium text-emerald-600">
                          {modalContent.dailyRateLabel}: {TRANSLATIONS[language].currency}{bookDailyRate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Book Penalty Total */}
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      {modalContent.penaltyLabel}
                    </p>
                    <p className="text-lg font-black text-red-600 dark:text-red-500">
                      {TRANSLATIONS[language].currency}{Number(loan.penalty_fee) || (daysOverdue * bookDailyRate)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        {totalPenalty > 0 && (
          <div className="mb-6 p-4 bg-slate-900 dark:bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                {TRANSLATIONS[language].total_penalty_fees}
              </span>
              <span className="text-2xl font-black text-white dark:text-slate-900">
                {TRANSLATIONS[language].currency}{totalPenalty}
              </span>
            </div>
          </div>
        )}

        <Button 
          variant="primary" 
          fullWidth 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-bold"
        >
          {modalContent.dismissAction}
        </Button>
      </GlassCard>
    </div>
  );
};