import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Library, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookCatalog } from './BookCatalog';
import { LoansList } from '../components/LoansList';
import { RentalModal } from '../components/RentalModal';
import { BookDetailsModal } from '../components/BookDetailsModal';
import { db } from '../services/supabaseClient';
import { Book, Loan, LoanStatus } from '../types';

interface DashboardContextType {
  myLoans: Loan[];
  refreshLoans: () => Promise<void>;
}

export const MemberDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { myLoans, refreshLoans } = useOutletContext<DashboardContextType>();
  
  const [view, setView] = useState<'catalog' | 'loans'>('catalog');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);

  const handleRentRequest = async (days: number) => {
    if (!selectedBook || !user) return;
    try {
      await db.requestLoan(user.id, selectedBook.id, days);
      setSelectedBook(null);
      alert(t('success_rent'));
      refreshLoans();
    } catch (e) {
      alert('Error requesting loan');
    }
  };

  const handleReturnBook = async (loanId: string) => {
    await db.updateLoanStatus(loanId, LoanStatus.RETURNED);
    alert(t('success_return'));
    refreshLoans();
  };

  if (!user) return null;

  return (
    <div className="animate-slide-up">
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={view === 'catalog' ? 'primary' : 'secondary'} 
          onClick={() => setView('catalog')}
        >
          <Library size={18} /> {t('catalog')}
        </Button>
        <Button 
          variant={view === 'loans' ? 'primary' : 'secondary'} 
          onClick={() => setView('loans')}
        >
          <Clock size={18} /> {t('my_loans')}
          {myLoans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE).length > 0 && (
            <Badge color="bg-emerald-500 text-white border-none ml-1">
              {myLoans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE).length}
            </Badge>
          )}
        </Button>
      </div>

      {view === 'catalog' && (
        <BookCatalog 
          user={user} 
          onRent={setSelectedBook} 
          onView={setViewingBook} 
        />
      )}

      {view === 'loans' && (
        <LoansList 
          loans={myLoans} 
          isAdmin={false} 
          onAction={(id, action) => action === 'return' && handleReturnBook(id)} 
        />
      )}

      <RentalModal 
        book={selectedBook} 
        onClose={() => setSelectedBook(null)} 
        onConfirm={handleRentRequest} 
      />

      <BookDetailsModal 
        book={viewingBook} 
        onClose={() => setViewingBook(null)} 
        onRent={(book) => setSelectedBook(book)} 
      />
    </div>
  );
};