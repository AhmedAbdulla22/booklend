import React from 'react';
import { BookOpen, Calendar, AlertCircle, Check, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Loan, LoanStatus } from '../types';
import { CONSTANTS } from '../constants';

export const LoansList = ({ loans, isAdmin, onAction }: { loans: Loan[], isAdmin: boolean, onAction: (id: string, action: string) => void }) => {
  const { t, localize } = useLanguage();

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.ACTIVE: return 'bg-green-100 text-green-700 border-green-200';
      case LoanStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case LoanStatus.OVERDUE: return 'bg-red-100 text-red-700 border-red-200';
      case LoanStatus.RETURNED: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="grid gap-4">
      {loans.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('no_notifications')}</p>
        </div>
      )}
      {loans.map(loan => (
        <GlassCard key={loan.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <img 
              src={loan.book?.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
              className="w-12 h-16 object-cover rounded shadow-sm" 
              alt="" 
            />
            <div>
              <h4 className="font-bold text-slate-800">{localize(loan.book, 'title')}</h4>
              <div className="text-sm text-slate-500 flex flex-wrap gap-2 mt-1">
                {isAdmin && <span className="font-semibold text-indigo-600">{t('loan_user_prefix')} {loan.user?.full_name} •</span>}
                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(loan.due_date).toLocaleDateString()}</span>
                {loan.penalty_fee > 0 && (
                  <span className="text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> +{t('currency')}{loan.penalty_fee.toFixed(2)} {t('penalty')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
             <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(loan.status)}`}>
               {loan.status === LoanStatus.ACTIVE && new Date() > new Date(loan.due_date) ? t('overdue') : t(`loan_${loan.status}`)}
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
               (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.OVERDUE) && (
                 <Button onClick={() => onAction(loan.id, 'return')}>
                   {t('return_book')}
                 </Button>
               )
             )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
};