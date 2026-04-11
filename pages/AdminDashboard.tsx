import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Clock, AlertTriangle, DollarSign, Activity, Filter, FileText, CheckCircle, Search, Plus, Edit2, ArrowUpRight, List, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { LoansList } from '../components/LoansList';
import { BookFormModal } from '../components/BookFormModal';
import { db } from '../services/supabaseClient';
import { Book, Loan, LoanStatus, GENRES, ActivityLog, Role } from '../types';
import { CONSTANTS, TRANSLATIONS } from '../constants';

export const AdminDashboard = () => {
  const { t, language, localize } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const getLocalizedGenreLabel = (g: string) => {
    const key = `genre_${g.toLowerCase()}` as keyof typeof TRANSLATIONS['en'];
    const translated = t(key);
    return translated === key ? g : translated;
  };
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'loans' | 'books' | 'logs'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // ADDED: Local Loading States to prevent double-clicks
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

  // Book Management
  const [filter, setFilter] = useState('');
  const [genre, setGenre] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Loan Management
  const [loanStatusFilter, setLoanStatusFilter] = useState<LoanStatus | 'all'>('all');

  // 1. ROLE CHECK: Redirect if not admin
  useEffect(() => {
    if (user && user.role !== Role.ADMIN) {
      navigate('/dashboard'); 
    }
  }, [user, navigate]);


  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [fetchedLoans, fetchedBooks, fetchedLogs] = await Promise.all([
          db.getLoans(),
          db.getBooks(),
          db.getActivityLogs()
        ]);
        if (isMounted) {
          // SAFETY NET: Only update if the data actually exists. Never wipe it!
          if (fetchedLoans) setLoans(fetchedLoans);
          if (fetchedBooks) setBooks(fetchedBooks);
          if (fetchedLogs) setLogs(fetchedLogs);
        }
      } catch (error) {
        console.error("Network glitch ignored:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();

    return () => { isMounted = false; };
  }, []);


  const fetchData = async () => {
    try {
      const [fetchedLoans, fetchedBooks, fetchedLogs] = await Promise.all([
        db.getLoans(),
        db.getBooks(),
        db.getActivityLogs()
      ]);
      if (fetchedLoans) setLoans(fetchedLoans);
      if (fetchedBooks) setBooks(fetchedBooks);
      if (fetchedLogs) setLogs(fetchedLogs);
    } catch (error) {
       console.error("Fetch data error ignored:", error);
    }
  };

  const handleLoanAction = async (id: string, action: string) => {
    try {
      setProcessingLoanId(id); // Lock this specific loan
      if (action === 'approve') {
        await db.updateLoanStatus(id, LoanStatus.ACTIVE);
      } else if (action === 'reject') {
        await db.updateLoanStatus(id, LoanStatus.REJECTED);
      } else if (action === 'return') {
         await db.updateLoanStatus(id, LoanStatus.RETURNED);
      }
      await fetchData(); // Silently update data
    } finally {
      setProcessingLoanId(null); // Unlock
    }
  };

  const handleSaveBook = async (bookData: Partial<Book>) => {
    try {
      setIsSavingBook(true); // Lock the modal
      if (editingBook) {
        await db.updateBook({ ...editingBook, ...bookData } as Book);
      } else {
        await db.addBook({
          ...bookData,
          available_copies: bookData.total_copies || 0,
          image_url: bookData.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK
        } as Book);
      }
      setIsModalOpen(false);
      await fetchData(); // Silently update data
    } finally {
      setIsSavingBook(false); // Unlock
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const returnedLoans = loans.filter(l => l.status === LoanStatus.RETURNED);

    const calcRevenueForDate = (loanList: Loan[], month: number, year: number) => {
        return loanList.reduce((acc, curr) => {
            if (!curr.return_date) return acc;
            const rDate = new Date(curr.return_date);
            if (rDate.getMonth() === month && rDate.getFullYear() === year) {
                return acc + (curr.total_fee || 0) + (curr.penalty_fee || 0);
            }
            return acc;
        }, 0);
    };

    const currentRevenue = calcRevenueForDate(returnedLoans, currentMonth, currentYear);
    const prevRevenue = calcRevenueForDate(returnedLoans, lastMonth, lastMonthYear);

    let growth: string | null = null;
    if (prevRevenue > 0) {
        const diff = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
        growth = `${diff > 0 ? '+' : ''}${diff.toFixed(0)}% ${t('growth_label')}`;
    } else if (currentRevenue > 0) {
        growth = t('new_label');
    } else {
        growth = '0%';
    }

    return {
        activeLoans: loans.filter(l => l.status === LoanStatus.ACTIVE).length,
        pendingLoans: loans.filter(l => l.status === LoanStatus.PENDING).length,
        overdueLoans: loans.filter(l => l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date))).length,
        monthlyRevenue: currentRevenue,
        revenueGrowth: growth,
        totalBooks: books.length,
        lowStock: books.filter(b => b.available_copies < 2)
    };
  }, [loans, books, t]);

  const filteredBooks = books.filter(b => 
    (genre === 'All' || b.genre === genre) &&
    (localize(b, 'title').toLowerCase().includes(filter.toLowerCase()) || localize(b, 'author').toLowerCase().includes(filter.toLowerCase()))
  );

  const filteredLoans = loans.filter(l => {
    if (loanStatusFilter === 'all') return true;
    if (loanStatusFilter === LoanStatus.OVERDUE) {
       return l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date));
    }
    return l.status === loanStatusFilter;
  });

  const allGenres = Array.from(new Set([...GENRES, ...books.map(b => b.genre).filter(Boolean)])).sort();

  const StatCard = ({ title, value, icon: Icon, color, subValue, loading }: any) => {
    if (loading) {
        return (
            <GlassCard className="p-6 flex items-start justify-between relative overflow-hidden">
                <div className="z-10 relative flex-1">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-4" />
                </div>
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 flex items-start justify-between relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
            {subValue && (
                <p className={`text-xs mt-2 flex items-center gap-1 font-bold ${subValue.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <ArrowUpRight size={12} /> {subValue}
                </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10`}>
            <Icon size={24} />
          </div>
          <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${color} opacity-10 dark:opacity-20`} />
        </GlassCard>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Navigation Tabs */}
      <GlassCard className="p-1.5 flex flex-wrap gap-1 w-fit mx-auto md:mx-0 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md sticky top-24 z-40 border border-white/40 dark:border-slate-700">
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('dashboard')}>
          <div className="flex items-center gap-2"><LayoutDashboard size={16} /> {t('dashboard')}</div>
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'loans' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('loans')}>
          <div className="flex items-center gap-2">
            <Clock size={16} /> {t('requests')}
            {stats.pendingLoans > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{stats.pendingLoans}</span>}
          </div>
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'books' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('books')}>
          <div className="flex items-center gap-2"><BookOpen size={16} /> {t('manage_books')}</div>
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50`} onClick={() => navigate('/admin/users')}>
          <div className="flex items-center gap-2"><Users size={16} /> {t('users_tab')}</div>
        </button>
      </GlassCard>

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title={t('monthly_revenue')} 
                value={`${t('currency')}${stats.monthlyRevenue.toLocaleString()}`} 
                icon={DollarSign} 
                color="bg-emerald-500" 
                subValue={stats.revenueGrowth} 
                loading={isLoading}
            />
            <StatCard 
                title={t('total_books')} 
                value={stats.totalBooks} 
                icon={BookOpen} 
                color="bg-indigo-500" 
                loading={isLoading}
            />
            <StatCard 
                title={t('pending')} 
                value={stats.pendingLoans} 
                icon={Clock} 
                color="bg-amber-500" 
                loading={isLoading}
            />
            <StatCard 
                title={t('overdue')} 
                value={stats.overdueLoans} 
                icon={AlertTriangle} 
                color="bg-red-500" 
                loading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> {t('attention_needed')}
              </h3>
              {isLoading ? (
                  <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                          <div key={i} className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                      ))}
                  </div>
              ) : stats.pendingLoans === 0 && stats.overdueLoans === 0 ? (
                 <GlassCard className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle size={32} className="mx-auto text-emerald-500 opacity-50 mb-2" />
                    <p>{t('all_caught_up')}</p>
                 </GlassCard>
              ) : (
                <div className="space-y-3">
                  {loans.filter(l => l.status === LoanStatus.PENDING).slice(0, 3).map(loan => (
                    <GlassCard key={loan.id} className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><Clock size={18} /></div>
                         <div>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{localize(loan.book, 'title')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Req: {loan.user?.full_name}</p>
                         </div>
                      </div>
                      <Button variant="secondary" className="!text-xs !py-1" onClick={() => setTab('loans')}>Review</Button>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
               <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <List size={20} className="text-emerald-500" /> {t('low_stock')}
               </h3>
               <GlassCard className="p-0 overflow-hidden">
                 {isLoading ? (
                     <div className="p-4 space-y-3">
                         {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />)}
                     </div>
                 ) : stats.lowStock.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">{t('healthy_stock')}</div>
                 ) : (
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                     {stats.lowStock.map(b => (
                       <div key={b.id} className="p-3 flex justify-between items-center">
                          <span className="text-sm font-medium truncate w-40">{localize(b, 'title')}</span>
                          <span className="text-xs text-red-500 font-bold whitespace-nowrap">{b.available_copies} left</span>
                       </div>
                     ))}
                   </div>
                 )}
               </GlassCard>
            </div>
          </div>
        </div>
      )}

      {tab === 'loans' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2"><Filter size={18} /> {t('filter_status')}</h3>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
               {[LoanStatus.PENDING, LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.RETURNED].map(s => (
                 <Button key={s} variant={loanStatusFilter === s ? 'primary' : 'secondary'} onClick={() => setLoanStatusFilter(s)} className="text-xs py-1 capitalize">{t(s as any)}</Button>
               ))}
               <Button variant={loanStatusFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setLoanStatusFilter('all')} className="text-xs py-1">{t('all_loans')}</Button>
            </div>
          </GlassCard>
          {isLoading ? (
             <div className="space-y-3">
                 {[1, 2, 3, 4].map(i => <div key={i} className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
             </div>
          ) : (
            <LoansList 
              loans={filteredLoans} 
              isAdmin={true} 
              // Prevent clicking multiple loans rapidly
              onAction={(id, action) => !processingLoanId && handleLoanAction(id, action)} 
            />
          )}
        </div>
      )}

      {tab === 'books' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
               <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${language === 'ar' || language === 'ku' ? 'right-3' : 'left-3'}`} size={18} />
               <input 
                 type="text" 
                 placeholder={t('search_placeholder')} 
                 className={`w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 focus:outline-none ${language === 'ar' || language === 'ku' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                 value={filter} 
                 onChange={e => setFilter(e.target.value)} 
               />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                 className="px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200"
                 value={genre}
                 onChange={(e) => setGenre(e.target.value)}
              >
                <option value="All">{t('all_genres')}</option>
                {allGenres.map(g => <option key={g} value={g}>{getLocalizedGenreLabel(g)}</option>)}
              </select>
              <Button onClick={openAddModal} className="whitespace-nowrap">
                <Plus size={18} /> {t('add_book')}
              </Button>
            </div>
          </GlassCard>
          <div className="grid grid-cols-1 gap-4">
             {isLoading ? (
                 [1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)
             ) : (
                filteredBooks.map(book => (
                  <GlassCard key={book.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <img src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} alt="" className="w-16 h-24 object-cover rounded shadow-sm" />
                      <div><h4 className="font-bold text-slate-800 dark:text-white">{localize(book, 'title')}</h4><p className="text-sm text-slate-500">{localize(book, 'author')}</p></div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="secondary" onClick={() => openEditModal(book)}><Edit2 size={16} /> Edit</Button>
                    </div>
                  </GlassCard>
                ))
             )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <BookFormModal 
          book={editingBook} 
          // Prevent accidental close during save
          onClose={() => !isSavingBook && setIsModalOpen(false)} 
          onSave={handleSaveBook} 
          availableGenres={allGenres}
          isSaving={isSavingBook} // Pass loading state to disable fields
        />
      )}
    </div>
  );
};