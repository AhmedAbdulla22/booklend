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
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('title, daily_rate, available_copies')
        .eq('id', bookId)
        .single();
      
      if (bookError) throw bookError;
      if (!book || book.available_copies <= 0) {
        throw new Error('Book not available');
      }

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
        if (error.code === '23505') {
          throw new Error('You already have an active request for this book');
        }
        throw error;
      }

      await addLog('log_rent_request', book.title, 'info', user?.full_name);
      return data as Loan;
    } catch (error) {
      console.error('Error requesting loan:', error);
      throw error;
    }
  },

updateLoanStatus: async (loanId: string, status: LoanStatus, adminName?: string): Promise<Loan> => {
    const { data: currentLoan } = await supabase
      .from('loans')
      .select('*, book:books(*), user:profiles(*)')
      .eq('id', loanId)
      .single();

    let updatePayload: any = { status };

    // Logging for Admin Approval
    if (status === LoanStatus.ACTIVE && currentLoan) {
      await addLog('log_loan_approved', `Approved "${currentLoan.book.title}" for ${currentLoan.user.full_name}`, 'success', adminName);
    }
    else if (status === LoanStatus.REJECTED && currentLoan) {
      // Optional: Log rejection
      await addLog('log_loan_rejected', `Rejected "${currentLoan.book.title}" for ${currentLoan.user.full_name}`, 'warning', adminName);
    }

    // Two-step return logic with logging
    if (status === LoanStatus.RETURNED && currentLoan?.return_date) {
        updatePayload.is_confirmed = true;
        
        // Increase book stock
        await supabase
          .from('books')
          .update({ available_copies: (currentLoan.book.available_copies || 0) + 1 })
          .eq('id', currentLoan.book_id);

        await addLog('log_return_confirmed', `Confirmed return of "${currentLoan.book.title}" from ${currentLoan.user.full_name}`, 'info', adminName);
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

deleteBook: async (bookId: string, adminName: string): Promise<void> => {
  // 1. Check for active or overdue loans
  const { data: activeLoans, error: loanError } = await supabase
    .from('loans')
    .select('id')
    .eq('book_id', bookId)
    .in('status', [LoanStatus.ACTIVE, LoanStatus.OVERDUE]);

  if (loanError) throw loanError;

  // 2. Prevent deletion if the book is currently with a user
  if (activeLoans && activeLoans.length > 0) {
    throw new Error('cannot_delete_active_book'); 
  }

  // 3. Get title for the log before deleting
  const { data: book } = await supabase
    .from('books')
    .select('title')
    .eq('id', bookId)
    .single();

  // 4. Perform the deletion
  const { error: deleteError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (deleteError) throw deleteError;

  // 5. Add to activity log
  await addLog(
    'log_book_deleted', 
    `Deleted book: "${book?.title || 'Unknown'}"`, 
    'danger', 
    adminName
  );
},

  confirmReturn: async (loanId: string, adminName?: string) => {
    const { data: currentLoan } = await supabase
      .from('loans')
      .select('*, book:books(*), user:profiles(*)')
      .eq('id', loanId)
      .single();

    const { data, error } = await supabase
      .from('loans')
      .update({ is_confirmed: true }) 
      .eq('id', loanId)
      .select()
      .single();
      
    if (error) throw error;

    if (currentLoan) {
      await addLog( 
        'log_return_confirmed', 
        `Confirmed return of "${currentLoan.book.title}" from ${currentLoan.user.full_name}`, 
        'info', 
        adminName
      );
    }
    return data;
  },

  // User Management with logging
  updateUserRole: async (targetUserId: string, newRole: Role, adminName: string) => {
    const { data: targetUser } = await supabase.from('profiles').select('full_name').eq('id', targetUserId).single();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single();
      
    if (error) throw error;
    
    const action = newRole === Role.ADMIN ? 'log_user_promoted' : 'log_user_demoted';
    await addLog(
      'log_user_promoted', 
      `Promoted ${targetUser.full_name} to Admin`, 
      'warning', 
      adminName
    );
    return data;
  },

  deleteUser: async (targetUserId: string, adminName: string) => {
    const { data: targetUser } = await supabase.from('profiles').select('full_name').eq('id', targetUserId).single();
    
    const { error } = await supabase.from('profiles').delete().eq('id', targetUserId);
    if (error) throw error;
    
    await addLog('log_user_deleted', `Deleted user ${targetUser?.full_name}`, 'danger', adminName);
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
      const { data: currentBook, error: fetchError } = await supabase
        .from('books')
        .select('total_copies, available_copies')
        .eq('id', updatedBook.id)
        .single();

      if (fetchError) throw fetchError;

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
        if (error.code === '23505') return; 
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
        password: password || 'defaultpassword123', 
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

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