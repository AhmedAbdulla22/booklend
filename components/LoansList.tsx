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
    const due = new Date(loan.due_date);
    
    const referenceDate = loan.return_date ? new Date(loan.return_date) : new Date();
    
    if (referenceDate <= due) return 0;
    
    const diffTime = Math.abs(referenceDate.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const dailyRate = Number(loan.book?.daily_rate) || 0;
    return diffDays * dailyRate;
  };

  const getDelayDays = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    if (now <= due) return 0;
    const diffTime = Math.abs(now.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="grid gap-4">
      {loans.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('no_notifications')}</p>
        </div>
      )}
      {loans.map((loan) => {
        const livePenalty = getLivePenalty(loan);
        const delayDays = getDelayDays(loan.due_date);

        const isWaitingAdmin = loan.status === LoanStatus.RETURNED && !loan.is_confirmed;
        const isActuallyOverdue = !isWaitingAdmin && loan.status !== LoanStatus.RETURNED && new Date() > new Date(loan.due_date);

        return (
          <GlassCard key={loan.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white">{localize(loan.book, 'title')}</h4>
                <div className="text-sm text-slate-500 flex flex-wrap gap-2 mt-1 items-center">
                  
                  {isAdmin && (
                    <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                      {loan.user?.full_name || 'Unknown User'}
                    </span>
                  )}

                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(loan.due_date).toLocaleDateString()}
                  </span>
                  
                  {isActuallyOverdue && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-red-500 font-bold flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                        <AlertCircle size={12} />
                        {delayDays} {t('days')} {t('overdue')}
                      </span>
                      <span className="text-red-600 font-extrabold underline decoration-red-300">
                        {TRANSLATIONS[language].currency}{livePenalty.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {isWaitingAdmin && livePenalty > 0 && (
                    <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded border border-amber-100">
                      {t('penalty')}: {TRANSLATIONS[language].currency}{livePenalty.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isWaitingAdmin 
                  ? 'bg-blue-100 text-blue-700 border-blue-200' 
                  : getStatusColor(isActuallyOverdue ? LoanStatus.OVERDUE : loan.status)
              }`}>
                {isWaitingAdmin 
                  ? t('return_requested') 
                  : (isActuallyOverdue ? t('overdue') : t(`loan_${loan.status}`))}
              </span>

              {isAdmin ? (
                <div className="flex gap-2">
                  {loan.status === LoanStatus.PENDING && (
                    <>
                      <Button variant="ghost" className="!p-2 text-red-500 hover:bg-red-50" onClick={() => onAction(loan.id, 'reject')}>
                        <X size={18} />
                      </Button>
                      <Button className="!p-2 bg-green-500 hover:bg-green-600" onClick={() => onAction(loan.id, 'approve')}>
                        <Check size={18} />
                      </Button>
                    </>
                  )}
                  
                  {isWaitingAdmin && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 !py-1 !px-3 text-xs" 
                      onClick={() => onAction(loan.id, 'confirm_return')}
                    >
                      {t('confirm_return')}
                    </Button>
                  )}
                </div>
              ) : (
                (loan.status === LoanStatus.ACTIVE || isActuallyOverdue) && !isWaitingAdmin && (
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