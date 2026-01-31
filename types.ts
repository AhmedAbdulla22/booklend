export enum Role {
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum LoanStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  REJECTED = 'rejected'
}

export interface Book {
  id: string;
  title: string; // Default/English
  title_ar?: string;
  title_ku?: string;
  
  author: string; // Default/English
  author_ar?: string;
  author_ku?: string;
  
  genre: string; // Default/English
  genre_ar?: string;
  genre_ku?: string;

  total_copies: number;
  available_copies: number;
  image_url: string;
  daily_rate: number;
  
  description?: string; // Default/English
  description_ar?: string;
  description_ku?: string;
}

export interface Loan {
  id: string;
  user_id: string;
  book_id: string;
  start_date: string; // ISO Date string
  due_date: string;   // ISO Date string
  return_date?: string | null;
  total_fee: number;
  penalty_fee: number;
  status: LoanStatus;
  // Joins for UI convenience
  book?: Book;
  user?: Profile;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  avatar_url?: string;
  email: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  read: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  user_name?: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export type Language = 'en' | 'ar' | 'ku';

export const GENRES = ['Fiction', 'Science', 'History', 'Technology', 'Philosophy', 'Art'];