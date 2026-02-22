import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, BookOpen, Clock, AlertTriangle, DollarSign, ArrowUpRight, List, Search, Edit2, Activity, Filter, FileText, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { LoansList } from '../components/LoansList';
import { BookFormModal } from '../components/BookFormModal';
import { db } from '../services/supabaseClient';
import { Book, Loan, LoanStatus, GENRES, ActivityLog } from '../types';
import { CONSTANTS } from '../constants';

export const AdminPanel = () => {
  const { t, language } = useLanguage();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'loans' | 'books' | 'logs'>('dashboard');
  
  // Book Management State
  const [filter, setFilter] = useState('');
  const [genre, setGenre] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Loan Management State
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
    if (action === 'approve') {
      await db.updateLoanStatus(id, LoanStatus.ACTIVE);
    } else if (action === 'reject') {
      await db.updateLoanStatus(id, LoanStatus.REJECTED);
    }
    fetchData();
  };

  const handleSaveBook = async (bookData: Partial<Book>) => {
    if (editingBook) {
      // Update existing
      await db.updateBook({ ...editingBook, ...bookData } as Book);
      alert(t('success_update'));
    } else {
      // Create new
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
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><ArrowUpRight size={12} /> {subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10`}>
        <Icon size={24} />
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${color} opacity-10`} />
    </GlassCard>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Navigation Tabs */}
      <GlassCard className="p-1.5 flex flex-wrap gap-1 w-fit mx-auto md:mx-0 bg-white/30 backdrop-blur-md sticky top-24 z-40 border border-white/40">
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-white/50'}`}
          onClick={() => setTab('dashboard')}
        >
          <div className="flex items-center gap-2"><LayoutDashboard size={16} /> {t('dashboard')}</div>
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'loans' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-white/50'}`}
          onClick={() => setTab('loans')}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} /> {t('requests')}
            {pendingLoansCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingLoansCount}</span>}
          </div>
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'books' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-white/50'}`}
          onClick={() => setTab('books')}
        >
          <div className="flex items-center gap-2"><BookOpen size={16} /> {t('manage_books')}</div>
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'logs' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-white/50'}`}
          onClick={() => setTab('logs')}
        >
          <div className="flex items-center gap-2"><Activity size={16} /> {t('activity_logs')}</div>
        </button>
      </GlassCard>

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <div className="space-y-6 animate-slide-up">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title={t('total_revenue')} 
              value={`${t('currency')}${totalRevenue.toFixed(2)}`} 
              icon={DollarSign} 
              color="bg-emerald-500" 
              subValue="+12% this month"
            />
            <StatCard 
              title={t('active_loans')} 
              value={activeLoansCount} 
              icon={BookOpen} 
              color="bg-teal-500" 
            />
            <StatCard 
              title={t('pending')} 
              value={pendingLoansCount} 
              icon={Clock} 
              color="bg-amber-500" 
            />
            <StatCard 
              title={t('overdue')} 
              value={overdueLoansCount} 
              icon={AlertTriangle} 
              color="bg-red-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attention Needed Section */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" /> {t('attention_needed')}
              </h3>
              
              {pendingLoansCount === 0 && overdueLoansCount === 0 ? (
                 <GlassCard className="p-8 text-center text-slate-400">
                   <div className="flex justify-center mb-2"><CheckCircle size={32} className="text-emerald-500 opacity-50" /></div>
                   <p>All caught up! No pending items.</p>
                 </GlassCard>
              ) : (
                <div className="space-y-3">
                  {loans.filter(l => l.status === LoanStatus.PENDING).slice(0, 3).map(loan => (
                    <GlassCard key={loan.id} className="p-4 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                           <Clock size={18} />
                         </div>
                         <div>
                           <p className="font-bold text-slate-700">{loan.book?.title}</p>
                           <p className="text-xs text-slate-500">Requested by {loan.user?.full_name}</p>
                         </div>
                      </div>
                      <Button variant="secondary" className="!text-xs !py-1" onClick={() => setTab('loans')}>Review</Button>
                    </GlassCard>
                  ))}
                  {loans.filter(l => l.status === LoanStatus.OVERDUE || (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date))).slice(0, 3).map(loan => (
                    <GlassCard key={loan.id} className="p-4 flex items-center justify-between border-red-100 bg-red-50/30">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                           <AlertTriangle size={18} />
                         </div>
                         <div>
                           <p className="font-bold text-slate-700">{loan.book?.title}</p>
                           <p className="text-xs text-red-500 font-semibold">{t('overdue')}</p>
                         </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{new Date(loan.due_date).toLocaleDateString()}</span>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <List size={20} className="text-emerald-500" /> {t('low_stock')}
              </h3>
              <GlassCard className="p-0 overflow-hidden">
                {lowStockBooks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">Stock levels are healthy.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {lowStockBooks.map(book => (
                      <div key={book.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <img 
                            src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
                            alt="" 
                            className="w-10 h-14 object-cover rounded shadow-sm" 
                          />
                          <div className="overflow-hidden">
                            <p className="font-bold text-sm text-slate-700 truncate w-32">{book.title}</p>
                            <p className="text-xs text-slate-400">{book.author}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${book.available_copies === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {book.available_copies} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* LOAN MANAGEMENT TAB (Formerly Requests) */}
      {tab === 'loans' && (
        <div className="animate-slide-up space-y-6">
           {/* Filters */}
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Filter size={18} /> {t('filter_status')}
            </h3>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
               <Button 
                variant={loanStatusFilter === 'all' ? 'primary' : 'secondary'} 
                onClick={() => setLoanStatusFilter('all')} 
                className="text-xs py-1"
               >
                 {t('all_loans')}
               </Button>
               <Button 
                variant={loanStatusFilter === LoanStatus.PENDING ? 'primary' : 'secondary'} 
                onClick={() => setLoanStatusFilter(LoanStatus.PENDING)} 
                className="text-xs py-1"
               >
                 {t('pending')}
               </Button>
               <Button 
                variant={loanStatusFilter === LoanStatus.ACTIVE ? 'primary' : 'secondary'} 
                onClick={() => setLoanStatusFilter(LoanStatus.ACTIVE)} 
                className="text-xs py-1"
               >
                 {t('active_loans')}
               </Button>
               <Button 
                variant={loanStatusFilter === LoanStatus.OVERDUE ? 'primary' : 'secondary'} 
                onClick={() => setLoanStatusFilter(LoanStatus.OVERDUE)} 
                className="text-xs py-1 text-red-500"
               >
                 {t('overdue')}
               </Button>
                <Button 
                variant={loanStatusFilter === LoanStatus.RETURNED ? 'primary' : 'secondary'} 
                onClick={() => setLoanStatusFilter(LoanStatus.RETURNED)} 
                className="text-xs py-1"
               >
                 {t('returned')}
               </Button>
            </div>
          </GlassCard>

          <LoansList loans={filteredLoans} isAdmin={true} onAction={handleLoanAction} />
        </div>
      )}

      {/* ACTIVITY LOGS TAB */}
      {tab === 'logs' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-0 overflow-hidden">
             {logs.length === 0 ? (
               <div className="p-12 text-center text-slate-400">
                 <FileText size={48} className="mx-auto mb-4 opacity-50" />
                 <p>{t('no_logs')}</p>
               </div>
             ) : (
               <div className="divide-y divide-slate-100">
                 {logs.map(log => (
                   <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-full ${
                         log.type === 'success' ? 'bg-green-100 text-green-600' :
                         log.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                         log.type === 'danger' ? 'bg-red-100 text-red-600' :
                         'bg-blue-100 text-blue-600'
                       }`}>
                         {log.type === 'success' ? <CheckCircle size={16} className="" /> : <Activity size={16} />}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-800">
                           {t(log.action as any)}: <span className="font-normal">{log.details}</span>
                         </p>
                         <p className="text-xs text-slate-500">
                           by <span className="font-semibold">{log.user_name}</span>
                         </p>
                       </div>
                     </div>
                     <span className="text-xs text-slate-400 font-mono">
                       {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                   </div>
                 ))}
               </div>
             )}
          </GlassCard>
        </div>
      )}

      {/* MANAGE BOOKS TAB */}
      {tab === 'books' && (
        <div className="animate-slide-up space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className={`w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} placeholder:text-slate-400`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                 className="px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none text-slate-700"
                 value={genre}
                 onChange={(e) => setGenre(e.target.value)}
              >
                <option value="All">{t('all_genres')}</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <Button onClick={openAddModal} className="whitespace-nowrap">
                <Plus size={18} /> {t('add_book')}
              </Button>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-4">
             {filteredBooks.length === 0 && (
               <div className="text-center py-12 text-slate-400">
                 <p>{t('out_of_stock')}</p> {/* Reusing translation for "no results" effectively */}
               </div>
             )}
             {filteredBooks.map(book => (
               <GlassCard key={book.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-emerald-200 transition-colors">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                   <img 
                     src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
                     alt="" 
                     className="w-16 h-24 object-cover rounded shadow-sm" 
                   />
                   <div>
                     <h4 className="font-bold text-slate-800">{book.title}</h4>
                     <p className="text-sm text-slate-500">{book.author}</p>
                     <div className="flex gap-2 mt-1">
                       <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{book.genre}</span>
                       <span className="text-xs font-bold text-emerald-600">{t('currency')}{book.daily_rate}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-center md:text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t('stock')}</p>
                      <p className={`font-bold ${book.available_copies < 2 ? 'text-red-500' : 'text-slate-700'}`}>
                        {book.available_copies} / {book.total_copies}
                      </p>
                   </div>
                   <Button variant="secondary" onClick={() => openEditModal(book)}>
                     <Edit2 size={16} /> <span className="hidden sm:inline">{t('edit_book')}</span>
                   </Button>
                 </div>
               </GlassCard>
             ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <BookFormModal 
          book={editingBook} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveBook} 
        />
      )}
    </div>
  );
};