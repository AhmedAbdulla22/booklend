import React, { useState, useEffect } from 'react';
import { X, Save, Globe, Image as ImageIcon, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Input } from './ui/Input';
import { Book, GENRES } from '../types';
import { CONSTANTS } from '../constants';

interface BookFormModalProps {
  book?: Book | null;
  onClose: () => void;
  onSave: (book: Partial<Book>) => void;
  availableGenres?: string[];
}

export const BookFormModal: React.FC<BookFormModalProps> = ({ book, onClose, onSave, availableGenres = [] }) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'en' | 'ar' | 'ku'>('en');
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  
  const genreOptions = Array.from(new Set([...GENRES, ...availableGenres])).sort();

  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    title_ar: '',
    title_ku: '',
    author: '',
    author_ar: '',
    author_ku: '',
    genre: GENRES[0],
    genre_ar: '',
    genre_ku: '',
    total_copies: 1,
    available_copies: 1,
    daily_rate: 2,
    image_url: '',
    description: '',
    description_ar: '',
    description_ku: ''
  });

  useEffect(() => {
    if (book) {
      setFormData(book);
      // If the book has a genre not in our known list, show as custom input
      // However, usually passed availableGenres includes all current book genres.
      if (book.genre && !genreOptions.includes(book.genre)) {
        setIsCustomGenre(true);
      } else {
        setIsCustomGenre(false);
      }
    } else {
      setFormData({
        title: '',
        title_ar: '',
        title_ku: '',
        author: '',
        author_ar: '',
        author_ku: '',
        genre: GENRES[0],
        genre_ar: '',
        genre_ku: '',
        total_copies: 1,
        available_copies: 1,
        daily_rate: 2,
        image_url: CONSTANTS.DEFAULT_IMAGES.BOOK,
        description: '',
        description_ar: '',
        description_ku: ''
      });
      setIsCustomGenre(false);
    }
  }, [book]); // intentionally excluding availableGenres to prevent reset on parent update, though typically stable

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCopyChange = (val: number) => {
    if (!book) {
        setFormData({ ...formData, total_copies: val, available_copies: val });
    } else {
        const diff = val - (formData.total_copies || 0);
        setFormData({ 
            ...formData, 
            total_copies: val, 
            available_copies: (formData.available_copies || 0) + diff 
        });
    }
  };

  const TabButton = ({ id, label }: { id: 'en' | 'ar' | 'ku', label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === id 
          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <GlassCard className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 p-0 overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {book ? <Edit2Icon /> : <PlusIcon />}
            {book ? t('edit_book') : t('add_book')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Common Fields Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label={t('image_url')} 
                value={formData.image_url} 
                onChange={e => setFormData({...formData, image_url: e.target.value})} 
                placeholder="https://..."
                className="col-span-1 md:col-span-3"
              />
              <Input 
                label={t('daily_rate')} 
                type="number" 
                step="0.5" 
                value={formData.daily_rate} 
                onChange={e => setFormData({...formData, daily_rate: Number(e.target.value)})} 
                required
              />
               <Input 
                label={t('copies')} 
                type="number" 
                min="0"
                value={formData.total_copies} 
                onChange={e => handleCopyChange(Number(e.target.value))} 
                required
              />
               <div className="flex flex-col gap-1 text-start">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ms-1">{t('filter_genre')}</label>
                {isCustomGenre ? (
                  <div className="flex gap-2">
                    <input 
                      className="px-4 py-2 bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white flex-1 min-w-0"
                      value={formData.genre}
                      onChange={e => setFormData({...formData, genre: e.target.value})}
                      placeholder="Type genre name..."
                      required
                      autoFocus
                    />
                    <Button variant="secondary" type="button" onClick={() => { setIsCustomGenre(false); setFormData({...formData, genre: GENRES[0]}) }} className="shrink-0 px-3">
                       <X size={18} />
                    </Button>
                  </div>
                ) : (
                  <select 
                    className="px-4 py-2 bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white w-full"
                    value={formData.genre}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM_GENRE_OPTION') {
                          setIsCustomGenre(true);
                          setFormData({...formData, genre: ''});
                      } else {
                          setFormData({...formData, genre: e.target.value});
                      }
                    }}
                  >
                    {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="CUSTOM_GENRE_OPTION" className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">
                       + Custom Genre
                    </option>
                  </select>
                )}
              </div>
            </div>

            {/* Language Tabs */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="flex bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <TabButton id="en" label="English (Default)" />
                <TabButton id="ar" label="العربية" />
                <TabButton id="ku" label="کوردی" />
              </div>

              <div className="p-4 bg-white/40 dark:bg-slate-900/40">
                
                {/* ENGLISH TAB */}
                {activeTab === 'en' && (
                  <div className="space-y-4 animate-fade-in">
                    <Input 
                      label="Title (English)" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      required
                      placeholder="e.g. The Great Gatsby"
                    />
                    <Input 
                      label="Author (English)" 
                      value={formData.author} 
                      onChange={e => setFormData({...formData, author: e.target.value})} 
                      required
                      placeholder="e.g. F. Scott Fitzgerald"
                    />
                    <div className="flex flex-col gap-1 text-start">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ms-1">Description (English)</label>
                      <textarea 
                        className="px-4 py-2 bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[100px] text-slate-800 dark:text-white"
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Book summary in English..."
                      />
                    </div>
                  </div>
                )}

                {/* ARABIC TAB */}
                {activeTab === 'ar' && (
                  <div className="space-y-4 animate-fade-in" dir="rtl">
                    <Input 
                      label="العنوان (بالعربية)" 
                      value={formData.title_ar || ''} 
                      onChange={e => setFormData({...formData, title_ar: e.target.value})} 
                      placeholder="مثال: غاتسبي العظيم"
                      className="text-right"
                    />
                    <Input 
                      label="المؤلف (بالعربية)" 
                      value={formData.author_ar || ''} 
                      onChange={e => setFormData({...formData, author_ar: e.target.value})} 
                      placeholder="مثال: فرانسيس سكوت فيتزجيرالد"
                      className="text-right"
                    />
                     <Input 
                      label="النوع (بالعربية - اختياري)" 
                      value={formData.genre_ar || ''} 
                      onChange={e => setFormData({...formData, genre_ar: e.target.value})} 
                      placeholder="مثال: خيال"
                      className="text-right"
                    />
                    <div className="flex flex-col gap-1 text-start">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ms-1">الوصف (بالعربية)</label>
                      <textarea 
                        className="px-4 py-2 bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[100px] text-slate-800 dark:text-white text-right"
                        value={formData.description_ar || ''}
                        onChange={e => setFormData({...formData, description_ar: e.target.value})}
                        placeholder="ملخص الكتاب بالعربية..."
                      />
                    </div>
                  </div>
                )}

                {/* KURDISH TAB */}
                {activeTab === 'ku' && (
                  <div className="space-y-4 animate-fade-in" dir="rtl">
                    <Input 
                      label="ناونیشان (کوردی)" 
                      value={formData.title_ku || ''} 
                      onChange={e => setFormData({...formData, title_ku: e.target.value})} 
                      placeholder="نموونە: گاتسبی مەزن"
                      className="text-right"
                    />
                    <Input 
                      label="نووسەر (کوردی)" 
                      value={formData.author_ku || ''} 
                      onChange={e => setFormData({...formData, author_ku: e.target.value})} 
                      placeholder="نموونە: سکۆت فیتزجێراڵد"
                      className="text-right"
                    />
                     <Input 
                      label="چەشن (کوردی - ئیختیاری)" 
                      value={formData.genre_ku || ''} 
                      onChange={e => setFormData({...formData, genre_ku: e.target.value})} 
                      placeholder="نموونە: خەیاڵی"
                      className="text-right"
                    />
                    <div className="flex flex-col gap-1 text-start">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ms-1">وەسف (کوردی)</label>
                      <textarea 
                        className="px-4 py-2 bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[100px] text-slate-800 dark:text-white text-right"
                        value={formData.description_ku || ''}
                        onChange={e => setFormData({...formData, description_ku: e.target.value})}
                        placeholder="پوختەی کتێب بە کوردی..."
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit">
               <Save size={18} /> {book ? t('save') : t('create')}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

// Simple icon components for internal use
const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
