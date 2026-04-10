import React from 'react';
import { AlertTriangle, X, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Loan } from '../types';
import { TRANSLATIONS, CONSTANTS } from '../constants';

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
          title: translations.late_return_title || ' ',
          urgentText: translations.late_return_urgent || ' ',
          message: (bookTitle: string, penaltyFee: number) => 
            translations.late_return_message || `(${bookTitle}). ${penaltyFee > 0 ? `(${penaltyFee}) ` : ''} `,
          penaltyLabel: translations.late_fee,
          daysOverdue: translations.days_overdue || ' ',
          returnAction: translations.return_book,
          dismissAction: translations.close
        };
      case 'ku':
        return {
          title: translations.late_return_title || ' ',
          urgentText: translations.late_return_urgent || '',
          message: (bookTitle: string, penaltyFee: number) => 
            translations.late_return_message || `(${bookTitle}). ${penaltyFee > 0 ? `(${penaltyFee}) ` : ''} `,
          penaltyLabel: translations.late_fee,
          daysOverdue: translations.days_overdue || '',
          returnAction: translations.return_book,
          dismissAction: translations.close
        };
      default:
        return {
          title: 'URGENT: Late Return Notice',
          urgentText: 'URGENT',
          message: (bookTitle: string, penaltyFee: number) => 
            `You have missed the return deadline for book "${bookTitle}". ${penaltyFee > 0 ? `Current penalty fee: IQD ${penaltyFee}. Additional daily charges will apply until returned. ` : ''}Please return immediately to avoid further penalties.`,
          penaltyLabel: translations.late_fee,
          daysOverdue: 'Days Overdue',
          returnAction: translations.return_book,
          dismissAction: 'I Understand'
        };
    }
  };

  const modalContent = getModalContent();
  const totalPenalty = lateLoans.reduce((sum, loan) => sum + (loan.penalty_fee || 0), 0);

  const calculateDaysOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(now.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Alert Message */}
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {lateLoans.length === 1 
              ? modalContent.message(
                  lateLoans[0].book?.title_ar || lateLoans[0].book?.title || 'Unknown Book',
                  lateLoans[0].penalty_fee || 0
                )
              : language === 'ar' 
                ? `(${lateLoans.length}) `
                : language === 'ku'
                ? `(${lateLoans.length}) `
                : `You have ${lateLoans.length} overdue books. Please return them immediately to avoid additional penalties.`
            }
          </p>
        </div>

        {/* Late Loans List */}
        <div className="mb-6 space-y-3 max-h-64 overflow-y-auto">
          {lateLoans.map((loan) => {
            const daysOverdue = calculateDaysOverdue(loan.due_date);
            return (
              <div key={loan.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded shadow-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs text-center">
                      {language === 'ar' ? ' ' : language === 'ku' ? ' ' : 'LATE'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                      {loan.book?.title_ar || loan.book?.title || 'Unknown Book'}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {daysOverdue} {modalContent.daysOverdue}
                      </span>
                      {loan.penalty_fee && loan.penalty_fee > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {modalContent.penaltyLabel}: {TRANSLATIONS[language].currency}{loan.penalty_fee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Penalty Summary */}
        {totalPenalty > 0 && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                {TRANSLATIONS[language].total_penalty_fees}
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {TRANSLATIONS[language].currency}{totalPenalty}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
          >
            {modalContent.dismissAction}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
