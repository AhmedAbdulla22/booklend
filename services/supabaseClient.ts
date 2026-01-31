import { createClient } from '@supabase/supabase-js';
import { Book, Loan, LoanStatus, Profile, Role, ActivityLog } from '../types';
import { CONSTANTS } from '../constants';

// --- CONFIGURATION ---
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Check if we should use Mock Mode (if keys are missing or placeholder)
const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder');

if (isMock) {
  console.warn('⚠️ BookLend Running in DEMO MODE (Mock Data). Set VITE_SUPABASE_URL in .env to use real backend.');
}

// --- MOCK DATA ---
const MOCK_PROFILES: Profile[] = [
  { id: 'u1', full_name: 'Admin User', role: Role.ADMIN, avatar_url: '', email: 'admin@booklend.com' },
  { id: 'u2', full_name: 'Member User', role: Role.MEMBER, avatar_url: '', email: 'user@booklend.com' },
];

let mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    title_ar: 'غاتسبي العظيم',
    title_ku: 'گاتسبی مەزن',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    total_copies: 5,
    available_copies: 3,
    image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    daily_rate: 2.0,
    description: 'A novel set in the Jazz Age on Long Island.',
    description_ar: 'رواية تدور أحداثها في عصر الجاز في لونغ آيلاند.',
    description_ku: 'ڕۆمانێکە باس لە سەردەمی جاز دەکات لە لۆنگ ئایلەند.'
  },
  {
    id: '2',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Technology',
    total_copies: 4,
    available_copies: 2,
    image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800',
    daily_rate: 4.0,
    description: 'A handbook of agile software craftsmanship.'
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    total_copies: 8,
    available_copies: 8,
    image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800',
    daily_rate: 2.5,
    description: 'A Brief History of Humankind.'
  }
];

let mockLoans: Loan[] = [
  {
    id: 'l1',
    user_id: 'u2',
    book_id: '1',
    book: mockBooks[0],
    user: MOCK_PROFILES[1],
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_fee: 14.0,
    penalty_fee: 0,
    status: LoanStatus.ACTIVE
  }
];

let mockLogs: ActivityLog[] = [
    {
    id: 'log1',
    action: 'log_loan_approved',
    details: 'The Great Gatsby',
    user_name: 'Admin User',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'success'
  }
];

// --- MOCK SUPABASE CLIENT FOR AUTH CONTEXT ---
// This mocks the specific methods used by AuthContext to prevent crashes
const mockSupabaseClient = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error("Use the db wrapper") }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
    },
    from: (table: string) => ({
        select: () => ({
            eq: (col: string, val: string) => ({
                single: async () => {
                    if (table === 'profiles' && col === 'id') {
                        const user = MOCK_PROFILES.find(p => p.id === val);
                        return { data: user, error: user ? null : 'Not found' };
                    }
                    return { data: null, error: null };
                }
            })
        }),
        update: (updates: any) => ({
            eq: (col: string, val: string) => ({
                select: () => ({
                    single: async () => {
                         if (table === 'profiles' && col === 'id') {
                             const idx = MOCK_PROFILES.findIndex(p => p.id === val);
                             if (idx !== -1) {
                                 MOCK_PROFILES[idx] = { ...MOCK_PROFILES[idx], ...updates };
                                 return { data: MOCK_PROFILES[idx], error: null };
                             }
                         }
                         return { data: null, error: 'Not found' };
                    }
                })
            })
        })
    })
};

// Export real client if keys exist, otherwise mock
export const supabase = isMock ? (mockSupabaseClient as any) : createClient(supabaseUrl, supabaseAnonKey);

// --- SERVICE IMPLEMENTATIONS ---

export const db = {
  getBooks: async (): Promise<Book[]> => {
    if (isMock) {
        return new Promise(resolve => setTimeout(() => resolve([...mockBooks]), 300));
    }
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Book[];
  },

  getLoans: async (userId?: string): Promise<Loan[]> => {
    if (isMock) {
        return new Promise(resolve => {
             let filtered = [...mockLoans];
             // Auto-update overdue status for mock display
             filtered = filtered.map(l => {
                if (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date)) {
                    return { ...l, status: LoanStatus.OVERDUE };
                }
                return l;
             });
             if (userId) filtered = filtered.filter(l => l.user_id === userId);
             setTimeout(() => resolve(filtered), 300);
        });
    }

    let query = supabase.from('loans').select('*, book:books(*), user:profiles(*)', { count: 'exact' }).order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    
    // Client-side overdue check for display
    const loans = (data as any[]).map(loan => {
       if (loan.status === LoanStatus.ACTIVE && new Date() > new Date(loan.due_date)) {
           return { ...loan, status: LoanStatus.OVERDUE };
       }
       return loan;
    });
    return loans as Loan[];
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
     if (isMock) return [...mockLogs];
     // Return empty if real DB doesn't have logs table yet
     return [];
  },

  requestLoan: async (userId: string, bookId: string, days: number): Promise<Loan> => {
    if (isMock) {
        const book = mockBooks.find(b => b.id === bookId);
        const user = MOCK_PROFILES.find(u => u.id === userId);
        if (!book || book.available_copies <= 0) throw new Error('Book unavailable');
        
        const newLoan: Loan = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: userId,
            book_id: bookId,
            book: book,
            user: user,
            start_date: new Date().toISOString(),
            due_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            total_fee: days * book.daily_rate,
            penalty_fee: 0,
            status: LoanStatus.PENDING
        };
        mockLoans.unshift(newLoan);
        mockLogs.unshift({
            id: Math.random().toString(),
            action: 'log_rent_request',
            details: book.title,
            user_name: user?.full_name,
            timestamp: new Date().toISOString(),
            type: 'info'
        });
        return newLoan;
    }

    const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single();
    if (!book || book.available_copies <= 0) throw new Error('Book out of stock');

    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(startDate.getDate() + days);
    
    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: userId,
        book_id: bookId,
        start_date: startDate.toISOString(),
        due_date: dueDate.toISOString(),
        total_fee: days * book.daily_rate,
        status: LoanStatus.PENDING
      })
      .select()
      .single();

    if (error) throw error;
    return data as Loan;
  },

  updateLoanStatus: async (loanId: string, status: LoanStatus): Promise<Loan> => {
    if (isMock) {
        const idx = mockLoans.findIndex(l => l.id === loanId);
        if (idx === -1) throw new Error('Loan not found');
        
        const loan = mockLoans[idx];
        const bookIdx = mockBooks.findIndex(b => b.id === loan.book_id);
        
        // Stock Logic Mock
        if (status === LoanStatus.ACTIVE && loan.status === LoanStatus.PENDING) {
             if (bookIdx !== -1) mockBooks[bookIdx].available_copies--;
             mockLogs.unshift({ id: Math.random().toString(), action: 'log_loan_approved', details: loan.book?.title || '', user_name: 'Admin', timestamp: new Date().toISOString(), type: 'success' });
        } else if (status === LoanStatus.RETURNED) {
             if (bookIdx !== -1) mockBooks[bookIdx].available_copies++;
             mockLogs.unshift({ id: Math.random().toString(), action: 'log_book_returned', details: loan.book?.title || '', user_name: 'Admin', timestamp: new Date().toISOString(), type: 'info' });
        }

        mockLoans[idx] = { ...loan, status };
        return mockLoans[idx];
    }

    const updates: any = { status };
    
    if (status === LoanStatus.RETURNED) {
      updates.return_date = new Date().toISOString();
      // Calculate penalty logic...
      const { data: loan } = await supabase.from('loans').select('*').eq('id', loanId).single();
      if (loan) {
        const due = new Date(loan.due_date);
        const now = new Date();
        if (now > due) {
             const diffTime = Math.abs(now.getTime() - due.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             updates.penalty_fee = CONSTANTS.LATE_PENALTY_FLAT + (diffDays * CONSTANTS.LATE_PENALTY_DAILY);
        }
      }
    }

    const { data, error } = await supabase.from('loans').update(updates).eq('id', loanId).select().single();
    if (error) throw error;

    // Manual stock update for non-RPC setup
    if (status === LoanStatus.ACTIVE) {
        const { data: book } = await supabase.from('books').select('available_copies').eq('id', data.book_id).single();
        if (book) await supabase.from('books').update({ available_copies: Math.max(0, book.available_copies - 1) }).eq('id', data.book_id);
    } else if (status === LoanStatus.RETURNED) {
        const { data: book } = await supabase.from('books').select('available_copies').eq('id', data.book_id).single();
        if (book) await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', data.book_id);
    }

    return data as Loan;
  },

  addBook: async (book: Omit<Book, 'id'>): Promise<Book> => {
    if (isMock) {
        // Ensure localization fields are preserved in mock
        const newBook: Book = { 
            ...book, 
            id: Math.random().toString(36).substr(2, 9),
            // Explicitly ensuring optional fields are handled if passed, though spread operator covers it.
            // This is just to satisfy the prompt's request for explicit mapping.
            title_ar: book.title_ar,
            title_ku: book.title_ku,
            author_ar: book.author_ar,
            author_ku: book.author_ku,
            genre_ar: book.genre_ar,
            genre_ku: book.genre_ku,
            description_ar: book.description_ar,
            description_ku: book.description_ku
        } as Book;
        
        mockBooks.unshift(newBook);
        mockLogs.unshift({ id: Math.random().toString(), action: 'log_book_added', details: newBook.title, user_name: 'Admin', timestamp: new Date().toISOString(), type: 'success' });
        return newBook;
    }
    
    // Real Supabase insert (Automatically maps matching keys)
    const { data, error } = await supabase.from('books').insert(book).select().single();
    if (error) throw error;
    return data as Book;
  },

  updateBook: async (updatedBook: Book): Promise<Book> => {
     if (isMock) {
         const idx = mockBooks.findIndex(b => b.id === updatedBook.id);
         if (idx !== -1) {
             // Update mock with all fields
             mockBooks[idx] = { ...mockBooks[idx], ...updatedBook };
         }
         return updatedBook;
     }

    // Explicit mapping for clarity and robustness against stray fields
    const { data, error } = await supabase
      .from('books')
      .update({
        title: updatedBook.title,
        title_ar: updatedBook.title_ar,
        title_ku: updatedBook.title_ku,
        author: updatedBook.author,
        author_ar: updatedBook.author_ar,
        author_ku: updatedBook.author_ku,
        genre: updatedBook.genre,
        genre_ar: updatedBook.genre_ar,
        genre_ku: updatedBook.genre_ku,
        description: updatedBook.description,
        description_ar: updatedBook.description_ar,
        description_ku: updatedBook.description_ku,
        total_copies: updatedBook.total_copies,
        available_copies: updatedBook.available_copies,
        image_url: updatedBook.image_url,
        daily_rate: updatedBook.daily_rate,
      })
      .eq('id', updatedBook.id)
      .select()
      .single();

    if (error) throw error;
    return data as Book;
  },

  updateProfile: async (updatedProfile: Profile): Promise<Profile> => {
      if (isMock) {
          const idx = MOCK_PROFILES.findIndex(p => p.id === updatedProfile.id);
          if (idx !== -1) {
              MOCK_PROFILES[idx] = { ...MOCK_PROFILES[idx], ...updatedProfile };
              return MOCK_PROFILES[idx];
          }
      }
      const { data, error } = await supabase.from('profiles').update({
        full_name: updatedProfile.full_name,
        avatar_url: updatedProfile.avatar_url
      }).eq('id', updatedProfile.id).select().single();
      if (error) throw error;
      return data as Profile;
  }
};

export const auth = {
  signIn: async (email: string): Promise<Profile> => {
    if (isMock) {
        const user = MOCK_PROFILES.find(p => p.email === email);
        if (user) return user;
        throw new Error('User not found (Mock)');
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    throw new Error("Check your email for the login link!");
  },

  signInWithPassword: async (email: string, password: string): Promise<Profile> => {
    if (isMock) {
        // Simple mock auth
        const user = MOCK_PROFILES.find(p => p.email === email);
        if (user && password === '123456') return user;
        throw new Error('Invalid credentials (Mock: use 123456)');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        return profile as Profile;
    }
    throw new Error("Login failed");
  },

  signUp: async (email: string, fullName: string, password?: string): Promise<Profile> => {
    if (isMock) {
        const newUser: Profile = {
             id: Math.random().toString(36).substr(2, 9),
             email,
             full_name: fullName,
             role: Role.MEMBER,
             avatar_url: ''
        };
        MOCK_PROFILES.push(newUser);
        return newUser;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || "12345678",
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.user) {
         return { id: data.user.id, email: data.user.email!, full_name: fullName, role: Role.MEMBER };
    }
    throw new Error("Signup failed");
  },
  
  signOut: async (): Promise<void> => {
    if (isMock) return;
    await supabase.auth.signOut();
  },

  resetPassword: async (email: string): Promise<void> => {
    if (isMock) return; // Mock success
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    });
    if (error) throw error;
  }
};