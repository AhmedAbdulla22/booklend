import { createClient } from '@supabase/supabase-js';
import { Book, Loan, LoanStatus, Profile, Role, ActivityLog } from '../types';
import { CONSTANTS } from '../constants';

// --- CONFIGURATION ---
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder');

if (isMock) {
  console.warn('⚠️ BookLend Running in DEMO MODE (Mock Data). Changes persist in LocalStorage.');
}

// --- PERSISTENCE HELPERS ---
const loadMock = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(`bl_mock_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveMock = (key: string, data: any) => {
  try {
    localStorage.setItem(`bl_mock_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save mock data", e);
  }
};

// --- INITIAL MOCK DATA ---
const INITIAL_PROFILES: Profile[] = [
  { id: 'u1', full_name: 'Admin User', role: Role.ADMIN, avatar_url: '', email: 'admin@booklend.com' },
  { id: 'u2', full_name: 'Member User', role: Role.MEMBER, avatar_url: '', email: 'user@booklend.com' },
];

const INITIAL_BOOKS: Book[] = [
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
    description: 'A novel set in the Jazz Age on Long Island.'
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
  }
];

// --- ACTIVE DATA STATE ---
let mockProfiles: Profile[] = loadMock('profiles', INITIAL_PROFILES);
let mockBooks: Book[] = loadMock('books', INITIAL_BOOKS);
let mockLoans: Loan[] = loadMock('loans', []);
let mockLogs: ActivityLog[] = loadMock('logs', []);

// --- MOCK SUPABASE CLIENT ---
const mockSupabaseClient = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error("Use the db wrapper") }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        // Added missing mock method
        signInWithOtp: async () => ({ error: null }),
    },
    from: (table: string) => ({
        select: () => ({
            eq: (col: string, val: string) => ({
                single: async () => {
                    if (table === 'profiles' && col === 'id') {
                        const user = mockProfiles.find(p => p.id === val);
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
                             const idx = mockProfiles.findIndex(p => p.id === val);
                             if (idx !== -1) {
                                 mockProfiles[idx] = { ...mockProfiles[idx], ...updates };
                                 saveMock('profiles', mockProfiles);
                                 return { data: mockProfiles[idx], error: null };
                             }
                         }
                         return { data: null, error: 'Not found' };
                    }
                })
            })
        })
    })
};

export const supabase = isMock ? (mockSupabaseClient as any) : createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  getBooks: async (): Promise<Book[]> => {
    if (isMock) return [...mockBooks];
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Book[];
  },

  getLoans: async (userId?: string): Promise<Loan[]> => {
    if (isMock) {
        let filtered = [...mockLoans].map(l => ({
            ...l,
            book: mockBooks.find(b => b.id === l.book_id),
            user: mockProfiles.find(p => p.id === l.user_id)
        }));
        if (userId) filtered = filtered.filter(l => l.user_id === userId);
        return filtered;
    }
    let query = supabase.from('loans').select('*, book:books(*), user:profiles(*)').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Loan[];
  },

  getProfiles: async (): Promise<Profile[]> => {
    if (isMock) return [...mockProfiles];
    const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) throw error;
    return data as Profile[];
  },

  updateUserRole: async (userId: string, role: Role): Promise<void> => {
    if (isMock) {
      const idx = mockProfiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        mockProfiles[idx].role = role;
        saveMock('profiles', mockProfiles);
      }
      return;
    }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
     if (isMock) return [...mockLogs];
     return [];
  },

  requestLoan: async (userId: string, bookId: string, days: number): Promise<Loan> => {
    if (isMock) {
        const book = mockBooks.find(b => b.id === bookId);
        if (!book) throw new Error('Not found');
        const newLoan: Loan = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: userId,
            book_id: bookId,
            start_date: new Date().toISOString(),
            due_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            total_fee: days * book.daily_rate,
            penalty_fee: 0,
            status: LoanStatus.PENDING
        };
        mockLoans.unshift(newLoan);
        saveMock('loans', mockLoans);
        return newLoan;
    }
    const { data, error } = await supabase.from('loans').insert({ user_id: userId, book_id: bookId, status: LoanStatus.PENDING, total_fee: 0 }).select().single();
    if (error) throw error;
    return data as Loan;
  },

  updateLoanStatus: async (loanId: string, status: LoanStatus): Promise<Loan> => {
    if (isMock) {
        const idx = mockLoans.findIndex(l => l.id === loanId);
        if (idx !== -1) mockLoans[idx].status = status;
        saveMock('loans', mockLoans);
        return mockLoans[idx];
    }
    const { data, error } = await supabase.from('loans').update({ status }).eq('id', loanId).select().single();
    if (error) throw error;
    return data as Loan;
  },

  addBook: async (book: Omit<Book, 'id'>): Promise<Book> => {
    if (isMock) {
        const newBook = { ...book, id: Math.random().toString(36).substr(2, 9) } as Book;
        mockBooks.unshift(newBook);
        saveMock('books', mockBooks);
        return newBook;
    }
    const { data, error } = await supabase.from('books').insert(book).select().single();
    if (error) throw error;
    return data as Book;
  },

  updateBook: async (updatedBook: Book): Promise<Book> => {
     if (isMock) {
         const idx = mockBooks.findIndex(b => b.id === updatedBook.id);
         if (idx !== -1) mockBooks[idx] = updatedBook;
         saveMock('books', mockBooks);
         return updatedBook;
     }
    const { data, error } = await supabase.from('books').update(updatedBook).eq('id', updatedBook.id).select().single();
    if (error) throw error;
    return data as Book;
  }
};

export const auth = {
  signInWithPassword: async (email: string, password: string): Promise<Profile> => {
    if (isMock) {
        const user = mockProfiles.find(p => p.email === email);
        if (user && (password === '123456' || password === 'admin')) return user;
        throw new Error('Invalid credentials');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    return profile as Profile;
  },
  // Fix: Added missing signIn method for magic link/OTP fallback logic in AuthContext.tsx
  signIn: async (email: string): Promise<void> => {
    if (isMock) {
        const user = mockProfiles.find(p => p.email === email);
        if (!user) throw new Error('Invalid credentials');
        return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },
  signUp: async (email: string, fullName: string, password?: string): Promise<Profile> => {
    if (isMock) {
        const newUser: Profile = { id: Math.random().toString(36).substr(2, 9), email, full_name: fullName, role: Role.MEMBER };
        mockProfiles.push(newUser);
        saveMock('profiles', mockProfiles);
        return newUser;
    }
    const { data, error } = await supabase.auth.signUp({ email, password: password || "12345678", options: { data: { full_name: fullName } } });
    if (error) throw error;
    return { id: data.user!.id, email, full_name: fullName, role: Role.MEMBER };
  },
  signOut: async () => { if (!isMock) await supabase.auth.signOut(); },
  resetPassword: async (email: string) => { if (!isMock) await supabase.auth.resetPasswordForEmail(email); }
};