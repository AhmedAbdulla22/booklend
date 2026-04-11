import React from 'react';
import { BookOpen, Calendar, AlertCircle, Check, X, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Loan, LoanStatus } from '../types';
import { CONSTANTS, TRANSLATIONS } from '../constants'; // Ensure TRANSLATIONS is imported

export const LoansList = ({ loans, isAdmin, onAction }: { loans: Loan[], isAdmin: boolean, onAction: (id: string, action: string) => void }) => {
  const { t, localize, language } = useLanguage();

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.ACTIVE: return 'bg-green-100 text-green-700 border-green-200';
      case LoanStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case LoanStatus.OVERDUE: return 'bg-red-100 text-red-700 border-red-200';
      case LoanStatus.RETURNED: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getLivePenalty = (loan: Loan) => {
    // Check if the loan is actually past due, regardless of the 'overdue' status string
    const now = new Date();
    const due = new Date(loan.due_date);
    
    if (now <= due || loan.status === LoanStatus.RETURNED) return 0;
    
    const diffTime = Math.abs(now.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Updated to use 'daily_rate' from your SQL schema
    const dailyRate = Number(loan.book?.daily_rate) || 0;
    return diffDays * dailyRate;
  };

  return (
    <div className="grid gap-4">
      {loans.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('no_notifications')}</p>
        </div>
      )}
      {loans.map(loan => {
        const livePenalty = getLivePenalty(loan);
        const isActuallyOverdue = new Date() > new Date(loan.due_date) && loan.status !== LoanStatus.RETURNED;

        return (
          <GlassCard key={loan.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <img 
                src={loan.book?.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
                className="w-12 h-16 object-cover rounded shadow-sm" 
                alt="" 
              />
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white">{localize(loan.book, 'title')}</h4>
                <div className="text-sm text-slate-500 flex flex-wrap gap-2 mt-1 items-center">
                  {isAdmin && <span className="font-semibold text-indigo-600">{t('loan_user_prefix')} {loan.user?.full_name} •</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(loan.due_date).toLocaleDateString()}</span>
                  
                  {/* Real-time Penalty Display */}
                  {isActuallyOverdue && livePenalty > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-red-500 font-bold flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                        <AlertCircle size={12} />
                        {TRANSLATIONS[language].currency}{livePenalty.toLocaleString()} {t('penalty')}
                      </span>
                      <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
                        <TrendingUp size={10} />
                        ({TRANSLATIONS[language].currency}{loan.book?.daily_rate || 0} / {t('day')})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
               <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(isActuallyOverdue ? LoanStatus.OVERDUE : loan.status)}`}>
                 {isActuallyOverdue ? t('overdue') : t(`loan_${loan.status}`)}
               </span>

               {isAdmin ? (
                 loan.status === LoanStatus.PENDING && (
                   <div className="flex gap-2">
                     <Button variant="ghost" className="!p-2 text-red-500 hover:bg-red-50" onClick={() => onAction(loan.id, 'reject')}>
                       <X size={18} />
                     </Button>
                     <Button className="!p-2 bg-green-500 hover:bg-green-600" onClick={() => onAction(loan.id, 'approve')}>
                       <Check size={18} />
                     </Button>
                   </div>
                 )
               ) : (
                 (loan.status === LoanStatus.ACTIVE || isActuallyOverdue) && (
                   <Button onClick={() => onAction(loan.id, 'return')}>
                     {t('return_book')}
                   </Button>
                 )
               )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};