import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Library, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookCatalog } from './BookCatalog';
import { LoansList } from '../components/LoansList';
import { RentalModal } from '../components/RentalModal';
import { BookDetailsModal } from '../components/BookDetailsModal';
import { ExpirationAlertModal } from '../components/ExpirationAlertModal';
import { db } from '../services/supabaseClient';
import { Book, Loan, LoanStatus } from '../types';

interface DashboardContextType {
  myLoans: Loan[];
  refreshLoans: () => Promise<void>;
}

export const MemberDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { myLoans, refreshLoans } = useOutletContext<DashboardContextType>();
  
  const [view, setView] = useState<'catalog' | 'loans'>('catalog');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 1. New state to track if a book is currently being returned
  const [returningId, setReturningId] = useState<string | null>(null);
  // State for expiration alert modal
  const [expirationAlert, setExpirationAlert] = useState<{ isOpen: boolean; bookTitle: string }>({ isOpen: false, bookTitle: '' });
  // Monitor loans for expiration alerts
  useEffect(() => {
    const checkExpiringSoon = () => {
      myLoans.forEach(loan => {
        // Only check active loans
        if (loan.status !== 'active') return;
        
        const dueDate = new Date(loan.due_date);
        const now = new Date();
        const difference = dueDate.getTime() - now.getTime();
        
        // If the difference is positive and less than or equal to 86400000 milliseconds (1 day)
        if (difference > 0 && difference <= 86400000) {
          const bookTitle = loan.book?.title_ar || loan.book?.title || 'Unknown Book';
          
          // Show the custom expiration alert modal
          setExpirationAlert({ isOpen: true, bookTitle });
        }
      });
    };
    
    if (myLoans.length > 0) {
      checkExpiringSoon();
    }
  }, [myLoans, language]);

  const handleRentRequest = async (days: number) => {
    if (!selectedBook || !user) return;
    
    setIsSubmitting(true);
    try {
      await db.requestLoan(user.id, selectedBook.id, days);
      setSelectedBook(null);
      alert(t('success_rent'));
      await refreshLoans();
    } catch (e: any) {
      console.error('Request Loan Failed:', e);
      alert(`Error requesting loan: ${e.message || 'Unknown error'}. Please check console for details.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnBook = async (loanId: string) => {
    // 2. Prevent multiple return requests at once
    if (returningId) return;

    try {
      setReturningId(loanId);
      await db.updateLoanStatus(loanId, LoanStatus.RETURNED);
      alert(t('success_return'));
      await refreshLoans();
    } catch (e: any) {
      alert(`Error returning book: ${e.message}`);
    } finally {
      setReturningId(null);
    }
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
          // 3. Ensure action is blocked if already returning
          onAction={(id, action) => action === 'return' && !returningId && handleReturnBook(id)} 
        />
      )}

      {selectedBook && (
        <RentalModal 
          book={selectedBook} 
          onClose={() => !isSubmitting && setSelectedBook(null)} 
          onConfirm={handleRentRequest} 
          // 4. Pass isSubmitting to the modal to disable its internal buttons
          isSubmitting={isSubmitting} 
        />
      )}

      <BookDetailsModal 
        book={viewingBook} 
        onClose={() => setViewingBook(null)} 
        onRent={(book) => setSelectedBook(book)} 
        loans={myLoans}
      />

      <ExpirationAlertModal
        isOpen={expirationAlert.isOpen}
        onClose={() => setExpirationAlert({ isOpen: false, bookTitle: '' })}
        bookTitle={expirationAlert.bookTitle}
        language={language}
      />
    </div>
  );
};