import { Book, Loan, LoanStatus, Profile, Role, ActivityLog } from '../types';
import { supabase } from './supabaseClient';
import { CONSTANTS } from '../constants';

// Activity Logging Helper - now uses real Supabase
const addLog = async (action: string, details: string, type: ActivityLog['type'], userName?: string) => {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      action,
      details,
      type,
      user_name: userName || 'Admin',
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      console.error('Failed to add activity log:', error);
    }
  } catch (error) {
    console.error('Error in addLog:', error);
  }
};

export const db = {
  getBooks: async (): Promise<Book[]> => {
    try {
      const { data, error } = await supabase.from('books').select('*');
      if (error) throw error;
      return data as Book[];
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  getLoans: async (userId?: string): Promise<Loan[]> => {
    try {
      let query = supabase
        .from('loans')
        .select('*, book:books(*), user:profiles(*)');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Update overdue loans
      const updatedLoans = (data as Loan[]).map(loan => {
        if (loan.status === LoanStatus.ACTIVE && new Date() > new Date(loan.due_date)) {
          return { ...loan, status: LoanStatus.OVERDUE };
        }
        return loan;
      });
      
      return updatedLoans;
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data as ActivityLog[];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  },

  requestLoan: async (userId: string, bookId: string, days: number): Promise<Loan> => {
    try {
      // First check if book is available
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('title, daily_rate, available_copies')
        .eq('id', bookId)
        .single();
      
      if (bookError) throw bookError;
      if (!book || book.available_copies <= 0) {
        throw new Error('Book not available');
      }

      // Get user info for logging
      const { data: user } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(startDate.getDate() + days);

      const newLoan = {
        user_id: userId,
        book_id: bookId,
        start_date: startDate.toISOString(),
        due_date: dueDate.toISOString(),
        total_fee: days * book.daily_rate,
        penalty_fee: 0,
        status: LoanStatus.PENDING
      };

      const { data, error } = await supabase
        .from('loans')
        .insert(newLoan)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (error code 23505)
        if (error.code === '23505') {
          throw new Error('You already have an active request for this book');
        }
        throw error;
      }

      // Log the request
      await addLog('log_rent_request', book.title, 'info', user?.full_name);

      return data as Loan;
    } catch (error) {
      console.error('Error requesting loan:', error);
      throw error;
    }
  },


updateLoanStatus: async (loanId: string, status: LoanStatus): Promise<Loan> => {
    const { data: currentLoan } = await supabase
      .from('loans')
      .select('*, book:books(*)')
      .eq('id', loanId)
      .single();

    let updatePayload: any = { status };

    if (status === LoanStatus.RETURNED && currentLoan?.return_date) {
        updatePayload.is_confirmed = true;
        
        await supabase
          .from('books')
          .update({ available_copies: (currentLoan.book.available_copies || 0) + 1 })
          .eq('id', currentLoan.book_id);
    } 
    else if (status === LoanStatus.RETURNED) {
        updatePayload.return_date = new Date().toISOString();
        updatePayload.is_confirmed = false;
    }

    const { data, error } = await supabase
      .from('loans')
      .update(updatePayload)
      .eq('id', loanId)
      .select('*, book:books(*), user:profiles(*)')
      .single();

    if (error) throw error;
    return data as Loan;
},

confirmReturn: async (loanId: string) => {
  const { data, error } = await supabase
    .from('loans')
    .update({ is_confirmed: true }) 
    .eq('id', loanId);
    
  if (error) throw error;
  return data;
},

  addBook: async (book: Omit<Book, 'id'>): Promise<Book> => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert(book)
        .select()
        .single();

      if (error) throw error;

      await addLog('log_book_added', book.title, 'success', 'Admin');
      return data as Book;
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  },

  updateBook: async (updatedBook: Book): Promise<Book> => {
    try {
      // Get current book to calculate available copies difference
      const { data: currentBook, error: fetchError } = await supabase
        .from('books')
        .select('total_copies, available_copies')
        .eq('id', updatedBook.id)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new available copies
      const diff = updatedBook.total_copies - currentBook.total_copies;
      const newAvailable = Math.max(0, currentBook.available_copies + diff);

      const { data, error } = await supabase
        .from('books')
        .update({
          ...updatedBook,
          available_copies: newAvailable
        })
        .eq('id', updatedBook.id)
        .select()
        .single();

      if (error) throw error;

      await addLog('log_book_updated', updatedBook.title, 'warning', 'Admin');
      return data as Book;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },

  subscribeToAvailability: async (userId: string, bookId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('availability_notifications')
        .insert({ user_id: userId, book_id: bookId });
      
      if (error) {
        if (error.code === '23505') return; // إذا كان مشتركاً بالفعل، نتجاهل الخطأ
        throw error;
      }
    } catch (error) {
      console.error('Error subscribing to notification:', error);
      throw error;
    }
  },

  checkSubscription: async (userId: string, bookId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('availability_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  },

  getNotifications: async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
},
};

export const auth = {
  signIn: async (email: string, password: string): Promise<Profile> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;
      return profile as Profile;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  signUp: async (email: string, fullName: string, password?: string): Promise<Profile> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'defaultpassword123', // You may want to require password
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      // Create profile entry
      const newProfile = {
        id: data.user!.id,
        full_name: fullName,
        email,
        role: Role.MEMBER,
        avatar_url: `https://i.pravatar.cc/150?u=${data.user!.id}`
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (profileError) throw profileError;
      return profile as Profile;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },
  
  signOut: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
};