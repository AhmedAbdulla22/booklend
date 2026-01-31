import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Clock, AlertTriangle, DollarSign, Activity, Filter, FileText, CheckCircle, Search, Plus, Edit2, ArrowUpRight, List } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { LoansList } from '../components/LoansList';
import { BookFormModal } from '../components/BookFormModal';
import { db } from '../services/supabaseClient';
import { Book, Loan, LoanStatus, GENRES, ActivityLog, Role } from '../types';
import { CONSTANTS } from '../constants';

export const AdminDashboard = () => {
  const { t, language, localize } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'loans' | 'books' | 'logs'>('dashboard');
  
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
      navigate('/dashboard'); // Redirect to member dashboard
    }
  }, [user, navigate]);

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
    // 2. FEE LOGIC: Handled inside db.updateLoanStatus for 'return' action
    // It calculates Late Penalty if (CurrentDate > DueDate)
    if (action === 'approve') {
      await db.updateLoanStatus(id, LoanStatus.ACTIVE);
    } else if (action === 'reject') {
      await db.updateLoanStatus(id, LoanStatus.REJECTED);
    } else if (action === 'return') {
       await db.updateLoanStatus(id, LoanStatus.RETURNED);
    }
    fetchData();
  };

  const handleSaveBook = async (bookData: Partial<Book>) => {
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
    fetchData();
  };

  const openAddModal = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  // Stats
  const activeLoansCount = loans.filter(l => l.status === LoanStatus.ACTIVE).length;
  const pendingLoansCount = loans.filter(l => l.status === LoanStatus.PENDING).length;
  const overdueLoansCount = loans.filter(l => l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date))).length;
  const totalRevenue = loans.reduce((acc, curr) => 
    acc + (curr.status === LoanStatus.RETURNED ? (curr.total_fee + (curr.penalty_fee || 0)) : 0), 0
  );
  const lowStockBooks = books.filter(b => b.available_copies < 2);

  const allGenres = Array.from(new Set([...GENRES, ...books.map(b => b.genre)])).sort();

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
      {/* Navigation Tabs */}
      <GlassCard className="p-1.5 flex flex-wrap gap-1 w-fit mx-auto md:mx-0 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md sticky top-24 z-40 border border-white/40 dark:border-slate-700">
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('dashboard')}>
          <div className="flex items-center gap-2"><LayoutDashboard size={16} /> {t('dashboard')}</div>
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'loans' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('loans')}>
          <div className="flex items-center gap-2">
            <Clock size={16} /> {t('requests')}
            {pendingLoansCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingLoansCount}</span>}
          </div>
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'books' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('books')}>
          <div className="flex items-center gap-2"><BookOpen size={16} /> {t('manage_books')}</div>
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'logs' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`} onClick={() => setTab('logs')}>
          <div className="flex items-center gap-2"><Activity size={16} /> {t('activity_logs')}</div>
        </button>
      </GlassCard>

      {/* DASHBOARD TAB */}
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
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500" /> {t('attention_needed')}</h3>
              {pendingLoansCount === 0 && overdueLoansCount === 0 ? (
                 <GlassCard className="p-8 text-center text-slate-400 dark:text-slate-500"><CheckCircle size={32} className="mx-auto text-emerald-500 opacity-50 mb-2" /><p>All caught up!</p></GlassCard>
              ) : (
                <div className="space-y-3">
                  {loans.filter(l => l.status === LoanStatus.PENDING).slice(0, 3).map(loan => (
                    <GlassCard key={loan.id} className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><Clock size={18} /></div>
                         <div><p className="font-bold text-slate-700 dark:text-slate-200">{localize(loan.book, 'title')}</p><p className="text-xs text-slate-500 dark:text-slate-400">Req: {loan.user?.full_name}</p></div>
                      </div>
                      <Button variant="secondary" className="!text-xs !py-1" onClick={() => setTab('loans')}>Review</Button>
                    </GlassCard>
                  ))}
                  {loans.filter(l => l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date))).slice(0, 3).map(loan => (
                    <GlassCard key={loan.id} className="p-4 flex items-center justify-between border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                           <AlertTriangle size={18} />
                         </div>
                         <div>
                           <p className="font-bold text-slate-700 dark:text-slate-200">{localize(loan.book, 'title')}</p>
                           <p className="text-xs text-red-500 font-semibold">{t('overdue')}</p>
                         </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(loan.due_date).toLocaleDateString()}</span>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
               <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><List size={20} className="text-emerald-500" /> {t('low_stock')}</h3>
               <GlassCard className="p-0 overflow-hidden">
                 {lowStockBooks.length === 0 ? <div className="p-4 text-center text-slate-400 text-xs">Healthy Stock</div> : (
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                     {lowStockBooks.map(b => (
                       <div key={b.id} className="p-3 flex justify-between items-center"><span className="text-sm font-medium">{localize(b, 'title')}</span><span className="text-xs text-red-500 font-bold">{b.available_copies} left</span></div>
                     ))}
                   </div>
                 )}
               </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* LOAN MANAGEMENT TAB */}
      {tab === 'loans' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2"><Filter size={18} /> {t('filter_status')}</h3>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
               {[LoanStatus.PENDING, LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.RETURNED].map(s => (
                 <Button key={s} variant={loanStatusFilter === s ? 'primary' : 'secondary'} onClick={() => setLoanStatusFilter(s)} className="text-xs py-1 capitalize">{s}</Button>
               ))}
               <Button variant={loanStatusFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setLoanStatusFilter('all')} className="text-xs py-1">{t('all_loans')}</Button>
            </div>
          </GlassCard>
          <LoansList loans={filteredLoans} isAdmin={true} onAction={handleLoanAction} />
        </div>
      )}

      {/* BOOKS TAB */}
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
                {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <Button onClick={openAddModal} className="whitespace-nowrap">
                <Plus size={18} /> {t('add_book')}
              </Button>
            </div>
          </GlassCard>
          <div className="grid grid-cols-1 gap-4">
             {filteredBooks.map(book => (
               <GlassCard key={book.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                   <img src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} alt="" className="w-16 h-24 object-cover rounded shadow-sm" />
                   <div><h4 className="font-bold text-slate-800 dark:text-slate-100">{localize(book, 'title')}</h4><p className="text-sm text-slate-500">{localize(book, 'author')}</p></div>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openEditModal(book)}><Edit2 size={16} /> Edit</Button>
                 </div>
               </GlassCard>
             ))}
          </div>
        </div>
      )}

       {/* LOGS TAB */}
      {tab === 'logs' && (
        <div className="animate-slide-up">
           <GlassCard className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
             {logs.map(log => (
               <div key={log.id} className="p-4 flex justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <div className="flex gap-3">
                    <Activity size={16} className="mt-1 text-slate-400" />
                    <div><p className="text-sm font-bold">{log.action}</p><p className="text-xs text-slate-500">{log.details}</p></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
               </div>
             ))}
           </GlassCard>
        </div>
      )}

      {isModalOpen && (
        <BookFormModal 
          book={editingBook} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveBook} 
          availableGenres={allGenres}
        />
      )}
    </div>
  );
};
