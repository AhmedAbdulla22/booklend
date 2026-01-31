import { Book, Loan, LoanStatus, Profile, Role, ActivityLog } from '../types';
import { CONSTANTS } from '../constants';

// Mock Data Initialization
const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    total_copies: 5,
    available_copies: 3,
    image_url: 'https://picsum.photos/id/101/300/450',
    daily_rate: 2.0,
    description: 'The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway\'s interactions with mysterious millionaire Jay Gatsby and Gatsby\'s obsession to reunite with his former lover, Daisy Buchanan.'
  },
  {
    id: '2',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    genre: 'Science',
    total_copies: 3,
    available_copies: 1,
    image_url: 'https://picsum.photos/id/102/300/450',
    daily_rate: 3.5,
    description: 'A Brief History of Time: From the Big Bang to Black Holes is a book on theoretical cosmology by English physicist Stephen Hawking. It was first published in 1988. Hawking wrote the book for readers who had no prior knowledge of physics and people who are just interested in learning something new.'
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    total_copies: 10,
    available_copies: 10,
    image_url: 'https://picsum.photos/id/103/300/450',
    daily_rate: 2.5,
    description: 'Sapiens: A Brief History of Humankind is a book by Yuval Noah Harari, first published in Hebrew in Israel in 2011 based on a series of lectures Harari taught at The Hebrew University of Jerusalem, and in English in 2014.'
  },
  {
    id: '4',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Technology',
    total_copies: 4,
    available_copies: 0,
    image_url: 'https://picsum.photos/id/104/300/450',
    daily_rate: 4.0,
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn\'t have to be that way.'
  },
  {
    id: '5',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    genre: 'Philosophy',
    total_copies: 6,
    available_copies: 5,
    image_url: 'https://picsum.photos/id/106/300/450',
    daily_rate: 1.5,
    description: 'Meditations is a series of personal writings by Marcus Aurelius, Roman Emperor from 161 to 180 AD, recording his private notes to himself and ideas on Stoic philosophy.'
  }
];

const MOCK_PROFILES: Profile[] = [
  { id: 'u1', full_name: 'Alice Admin', role: Role.ADMIN, avatar_url: 'https://i.pravatar.cc/150?u=a', email: 'admin@booklend.com' },
  { id: 'u2', full_name: 'Bob Member', role: Role.MEMBER, avatar_url: 'https://i.pravatar.cc/150?u=b', email: 'user@booklend.com' },
];

const MOCK_LOANS: Loan[] = [
  {
    id: 'l1',
    user_id: 'u2',
    book_id: '1',
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_fee: 14.0, 
    penalty_fee: 0,
    status: LoanStatus.ACTIVE
  }
];

const MOCK_LOGS: ActivityLog[] = [
  {
    id: 'log1',
    action: 'log_loan_approved',
    details: 'The Great Gatsby',
    user_name: 'Bob Member',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'success'
  }
];

// In-memory store
let books = [...MOCK_BOOKS];
let loans = [...MOCK_LOANS];
let profiles = [...MOCK_PROFILES];
let logs = [...MOCK_LOGS];

const addLog = (action: string, details: string, type: ActivityLog['type'], userName?: string) => {
  logs.unshift({
    id: Math.random().toString(36).substr(2, 9),
    action,
    details,
    type,
    user_name: userName || 'Admin',
    timestamp: new Date().toISOString()
  });
};

export const db = {
  getBooks: async (): Promise<Book[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...books]), 500));
  },

  getLoans: async (userId?: string): Promise<Loan[]> => {
    return new Promise((resolve) => {
      let filtered = loans.map(l => ({
        ...l,
        book: books.find(b => b.id === l.book_id),
        user: profiles.find(p => p.id === l.user_id)
      }));
      
      filtered = filtered.map(l => {
        if (l.status === LoanStatus.ACTIVE && new Date() > new Date(l.due_date)) {
           return { ...l, status: LoanStatus.OVERDUE };
        }
        return l;
      });

      if (userId) {
        filtered = filtered.filter(l => l.user_id === userId);
      }
      setTimeout(() => resolve(filtered), 500);
    });
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...logs]), 500));
  },

  requestLoan: async (userId: string, bookId: string, days: number): Promise<Loan> => {
    return new Promise((resolve, reject) => {
      const book = books.find(b => b.id === bookId);
      const user = profiles.find(p => p.id === userId);

      if (!book || book.available_copies <= 0) {
        reject('Book not available');
        return;
      }

      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(startDate.getDate() + days);

      const newLoan: Loan = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: userId,
        book_id: bookId,
        start_date: startDate.toISOString(),
        due_date: dueDate.toISOString(),
        total_fee: days * book.daily_rate,
        penalty_fee: 0,
        status: LoanStatus.PENDING
      };

      loans.push(newLoan);
      addLog('log_rent_request', book.title, 'info', user?.full_name);
      setTimeout(() => resolve(newLoan), 500);
    });
  },

  updateLoanStatus: async (loanId: string, status: LoanStatus): Promise<Loan> => {
    return new Promise((resolve) => {
      const idx = loans.findIndex(l => l.id === loanId);
      if (idx !== -1) {
        const loan = loans[idx];
        const book = books.find(b => b.id === loan.book_id);
        const user = profiles.find(p => p.id === loan.user_id);
        
        if (status === LoanStatus.ACTIVE && loan.status === LoanStatus.PENDING) {
           const bIdx = books.findIndex(b => b.id === loan.book_id);
           if (bIdx !== -1) books[bIdx].available_copies--;
           addLog('log_loan_approved', book?.title || 'Unknown Book', 'success', user?.full_name);
        } else if (status === LoanStatus.REJECTED) {
           addLog('log_loan_rejected', book?.title || 'Unknown Book', 'danger', user?.full_name);
        }

        if (status === LoanStatus.RETURNED) {
           const bIdx = books.findIndex(b => b.id === loan.book_id);
           if (bIdx !== -1) books[bIdx].available_copies++;
           
           loans[idx].return_date = new Date().toISOString();
           addLog('log_book_returned', book?.title || 'Unknown Book', 'info', user?.full_name);
           
           const due = new Date(loans[idx].due_date);
           const now = new Date();
           if (now > due) {
             const diffTime = Math.abs(now.getTime() - due.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             loans[idx].penalty_fee = CONSTANTS.LATE_PENALTY_FLAT + (diffDays * CONSTANTS.LATE_PENALTY_DAILY);
           }
        }

        loans[idx].status = status;
        resolve(loans[idx]);
      }
    });
  },

  addBook: async (book: Omit<Book, 'id'>): Promise<Book> => {
    return new Promise((resolve) => {
      const newBook = { ...book, id: Math.random().toString(36).substr(2, 9) };
      books.push(newBook);
      addLog('log_book_added', newBook.title, 'success', 'Admin');
      setTimeout(() => resolve(newBook), 500);
    });
  },

  updateBook: async (updatedBook: Book): Promise<Book> => {
    return new Promise((resolve) => {
      const idx = books.findIndex(b => b.id === updatedBook.id);
      if (idx !== -1) {
        const oldTotal = books[idx].total_copies;
        const diff = updatedBook.total_copies - oldTotal;
        const newAvailable = Math.max(0, books[idx].available_copies + diff);
        
        books[idx] = {
           ...updatedBook,
           available_copies: newAvailable
        };
        addLog('log_book_updated', updatedBook.title, 'warning', 'Admin');
        setTimeout(() => resolve(books[idx]), 500);
      } else {
        resolve(updatedBook);
      }
    });
  }
};

export const auth = {
  signIn: async (email: string): Promise<Profile> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = profiles.find(p => p.email === email);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  },

  signUp: async (email: string, fullName: string): Promise<Profile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: Profile = {
          id: Math.random().toString(36).substr(2, 9),
          full_name: fullName,
          email,
          role: Role.MEMBER,
          avatar_url: `https://i.pravatar.cc/150?u=${Math.random()}`
        };
        profiles.push(newUser);
        resolve(newUser);
      }, 500);
    });
  },
  
  signOut: async (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, 200));
  }
};