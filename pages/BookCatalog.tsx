import React, { useState, useEffect } from 'react';
import { Search, Info, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { db } from '../services/supabaseClient';
import { Book, GENRES, Profile } from '../types';
import { CONSTANTS } from '../constants';

export const BookCatalog = ({ user, onRent, onView }: { user: Profile, onRent: (book: Book) => void, onView: (book: Book) => void }) => {
  const { t, language, localize } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState('');
  const [genre, setGenre] = useState('All');

  useEffect(() => {
    db.getBooks().then(setBooks);
  }, []);

  const allGenres = Array.from(new Set([...GENRES, ...books.map(b => b.genre)])).sort();

  const filteredBooks = books.filter(b => {
    // We check localized text for search purposes
    const title = localize(b, 'title').toLowerCase();
    const author = localize(b, 'author').toLowerCase();
    
    // Exact match for genre, or 'All'
    const matchesGenre = genre === 'All' || b.genre === genre;
    const matchesSearch = title.includes(filter.toLowerCase()) || author.includes(filter.toLowerCase());
    
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Filters */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-30">
        <div className="relative w-full md:w-96">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${language === 'ar' || language === 'ku' ? 'right-3' : 'left-3'}`} size={18} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')}
            className={`w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${language === 'ar' || language === 'ku' ? 'pr-10 pl-4' : 'pl-10 pr-4'} dark:text-white placeholder:text-slate-400`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <Button variant={genre === 'All' ? 'primary' : 'secondary'} onClick={() => setGenre('All')} className="text-sm py-1.5 px-3 whitespace-nowrap">
            {t('all_genres')}
          </Button>
          {allGenres.map(g => (
            <Button 
              key={g} 
              variant={genre === g ? 'primary' : 'secondary'} 
              onClick={() => setGenre(g)}
              className="text-sm py-1.5 px-3 whitespace-nowrap"
            >
              {g}
            </Button>
          ))}
        </div>
      </GlassCard>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {filteredBooks.map(book => (
          <GlassCard key={book.id} className="group overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col h-full p-0">
            {/* Image Container */}
            <div className="aspect-[2/3] w-full overflow-hidden relative cursor-pointer bg-slate-100 dark:bg-slate-800" onClick={() => onView(book)}>
               <img 
                 src={book.image_url || CONSTANTS.DEFAULT_IMAGES.BOOK} 
                 alt={book.title} 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                 <span className="inline-block mt-2 text-xs text-white/90 bg-white/20 backdrop-blur px-2 py-1 rounded-lg self-start">
                   {t('view_details')}
                 </span>
               </div>
               <div className="absolute top-2 right-2">
                 <Badge color="bg-white/90 text-indigo-700 backdrop-blur shadow-sm text-[10px] md:text-xs px-2">{localize(book, 'genre')}</Badge>
               </div>
            </div>

            {/* Content */}
            <div className="p-3 md:p-4 flex flex-col flex-1">
              <div className="mb-3 cursor-pointer" onClick={() => onView(book)}>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base line-clamp-2 leading-tight mb-1 hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors h-10 md:h-12">
                    {localize(book, 'title')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{localize(book, 'author')}</p>
              </div>
              
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className={`flex items-center gap-1.5 font-medium ${book.available_copies > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${book.available_copies > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    {book.available_copies > 0 ? t('available') : t('out_of_stock')}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-emerald-400">{t('currency')}{book.daily_rate}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="!p-0 w-10 h-10 flex items-center justify-center shrink-0 rounded-lg" onClick={() => onView(book)}>
                    <Info size={18} />
                  </Button>
                  <Button 
                    fullWidth 
                    className="text-xs md:text-sm h-10"
                    disabled={book.available_copies === 0} 
                    onClick={() => onRent(book)}
                  >
                    {t('rent_now')}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
