import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, BookOpen, Clock, AlertTriangle, DollarSign, ArrowUpRight, List, Search, Edit2, Activity, Filter, FileText, CheckCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { LoansList } from '../components/LoansList';
import { BookFormModal } from '../components/BookFormModal';
import { db } from '../services/supabaseClient';
import { Book, Loan, LoanStatus, GENRES, ActivityLog } from '../types';
import { CONSTANTS, TRANSLATIONS } from '../constants';

export const AdminPanel = () => {
  const { t, language } = useLanguage();
  
  const getLocalizedGenreLabel = (g: string) => {
    const key = `genre_${g.toLowerCase()}` as keyof typeof TRANSLATIONS['en'];
    const translated = t(key);
    return translated === key ? g : translated;
  };

  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'loans' | 'books' | 'logs'>('dashboard');
  
  // 1. ADDED: Loading states for background actions
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

  const [filter, setFilter] = useState('');
  const [genre, setGenre] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [loanStatusFilter, setLoanStatusFilter] = useState<LoanStatus | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [fetchedLoans, fetchedBooks, fetchedLogs] = await Promise.all([
      db.getLoans(),
      db.getBooks(),
      db.getActivityLogs()
    ]);
    setLoans(fetchedLoans);
    setBooks(fetchedBooks);
    setLogs(fetchedLogs);
  };

  const handleLoanAction = async (id: string, action: string) => {
    try {
      setProcessingLoanId(id); // Track which loan is being processed
      if (action === 'approve') {
        await db.updateLoanStatus(id, LoanStatus.ACTIVE);
      } else if (action === 'reject') {
        await db.updateLoanStatus(id, LoanStatus.REJECTED);
      }
      await fetchData();
    } finally {
      setProcessingLoanId(null);
    }
  };

  const handleSaveBook = async (bookData: Partial<Book>) => {
    // Handle readOnly mode switching
    if (isReadOnlyMode && Object.keys(bookData).length === 0) {
      setIsReadOnlyMode(false);
      return;
    }
    
    try {
      setIsSavingBook(true); // Disable modal buttons
      if (editingBook) {
        await db.updateBook({ ...editingBook, ...bookData } as Book);
        alert(t('success_update'));
      } else {
        await db.addBook({
          ...bookData,
          available_copies: bookData.total_copies || 0,
          image_url: bookData.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK
        } as Book);
        alert(t('success_create'));
      }
      setIsModalOpen(false);
      setIsReadOnlyMode(false);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingBook(false);
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setIsReadOnlyMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setIsReadOnlyMode(true);
    setIsModalOpen(true);
  };

  // Stats Calculations
  const activeLoansCount = loans.filter(l => l.status === LoanStatus.ACTIVE).length;
  const pendingLoansCount = loans.filter(l => l.status === LoanStatus.PENDING).length;
  const overdueLoansCount = loans.filter(l => l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date))).length;
  const totalRevenue = loans.reduce((acc, curr) => 
    acc + (curr.status === LoanStatus.RETURNED ? (curr.total_fee + (curr.penalty_fee || 0)) : 0), 0
  );
  const lowStockBooks = books.filter(b => b.available_copies < 2);

  const filteredBooks = books.filter(b => 
    (genre === 'All' || b.genre === genre) &&
    (b.title.toLowerCase().includes(filter.toLowerCase()) || b.author.toLowerCase().includes(filter.toLowerCase()))
  );

  const filteredLoans = loans.filter(l => {
    if (loanStatusFilter === 'all') return true;
    if (loanStatusFilter === LoanStatus.OVERDUE) {
       return l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date));
    }
    return l.status === loanStatusFilter;
  });

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <GlassCard className="p-6 flex items-start justify-between relative overflow-hidden group">
      <div className="z-10 relative">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><ArrowUpRight size={12} /> {subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10`}>
        <Icon size={24} />
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${color} opacity-10 dark:opacity-20`} />
    </GlassCard>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <GlassCard className="p-1.5 flex flex-wrap gap-1 w-fit mx-auto md:mx-0 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md sticky top-24 z-40 border border-white/40 dark:border-slate-700">
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
          onClick={() => setTab('dashboard')}
        >
          <div className="flex items-center gap-2"><LayoutDashboard size={16} /> {t('dashboard')}</div>
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'loans' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
          onClick={() => setTab('loans')}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} /> {t('requests')}
            {pendingLoansCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingLoansCount}</span>}
          </div>
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'books' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
          onClick={() => setTab('books')}
        >
          <div className="flex items-center gap-2"><BookOpen size={16} /> {t('manage_books')}</div>
        </button>
      </GlassCard>

      {tab === 'dashboard' && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={t('total_revenue')} value={`${t('currency')}${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-emerald-500" subValue="+12% this month" />
            <StatCard title={t('active_loans')} value={activeLoansCount} icon={BookOpen} color="bg-teal-500" />
            <StatCard title={t('pending')} value={pendingLoansCount} icon={Clock} color="bg-amber-500" />
            <StatCard title={t('overdue')} value={overdueLoansCount} icon={AlertTriangle} color="bg-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> {t('attention_needed')}
              </h3>
              
              {pendingLoansCount === 0 && overdueLoansCount === 0 ? (
                 <GlassCard className="p-8 text-center text-slate-400 dark:text-slate-500">
                   <div className="flex justify-center mb-2"><CheckCircle size={32} className="text-emerald-500 opacity-50" /></div>
                   <p>All caught up! No pending items.</p>
                 </GlassCard>
              ) : (
                <div className="space-y-3">
                  {loans.filter(l => l.status === LoanStatus.PENDING).slice(0, 3).map(loan => (
                    <GlassCard key={loan.id} className="p-4 flex items-center justify-between group hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                           <Clock size={18} />
                         </div>
                         <div>
                           <p className="font-bold text-slate-700 dark:text-slate-200">{loan.book?.title}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Requested by {loan.user?.full_name}</p>
                         </div>
                      </div>
                      <Button variant="secondary" className="!text-xs !py-1" onClick={() => setTab('loans')}>Review</Button>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
            {/* ... (Keep Low Stock Alert Section) ... */}
          </div>
        </div>
      )}

      {tab === 'loans' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Filter size={18} /> {t('filter_status')}
            </h3>
            {/* Status Filter Buttons ... */}
          </GlassCard>

          <LoansList 
            loans={filteredLoans} 
            isAdmin={true} 
            // 2. UPDATED: Disable further actions if one is processing
            onAction={(id, action) => !processingLoanId && handleLoanAction(id, action)} 
          />
        </div>
      )}

      {tab === 'books' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* ... (Search and Genre filter inputs) ... */}
            <Button onClick={openAddModal} className="whitespace-nowrap">
              <Plus size={18} /> {t('add_book')}
            </Button>
          </GlassCard>

          <div className="grid grid-cols-1 gap-4">
             {filteredBooks.map(book => (
               <GlassCard key={book.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors">
                 {/* ... (Book Details display) ... */}
                 <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                   <Button variant="secondary" onClick={() => openEditModal(book)}>
                     <Edit2 size={16} /> <span className="hidden sm:inline">{t('edit_book')}</span>
                   </Button>
                 </div>
               </GlassCard>
             ))}
          </div>
        </div>
      )}

      {/* 3. UPDATED: Pass isSaving to Modal and handle accidental close */}
      {isModalOpen && (
        <BookFormModal 
          book={editingBook} 
          onClose={() => !isSavingBook && setIsModalOpen(false)} 
          onSave={handleSaveBook} 
          isSaving={isSavingBook}
          readOnly={isReadOnlyMode}
        />
      )}
    </div>
  );
};