import React, { useState, useEffect } from 'react';
import { Library, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GlassCard } from '../components/ui/GlassCard';
import { Role } from '../types';

export const Login: React.FC = () => {
  const { login, resetPassword, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // View state: 'login' or 'forgot_password'
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === Role.ADMIN ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setResetSent(false);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30">
      <GlassCard className="w-full max-w-md p-8 animate-fade-in border-white/80 dark:border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white mb-4 shadow-lg shadow-emerald-500/30">
            <Library size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {view === 'login' ? t('app_name') : t('reset_password')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {view === 'login' ? t('welcome') : t('enter_email_reset')}
          </p>
        </div>

        {view === 'login' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label={t('email')} 
                type="email" 
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              
              <div>
                <Input 
                  label={t('password')} 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <div className="flex justify-end mt-1">
                  <button 
                    type="button" 
                    onClick={() => {
                        setError('');
                        setView('forgot_password');
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('forgot_password')}
                  </button>
                </div>
              </div>
              
              {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}

              <Button fullWidth type="submit" className="mt-4" disabled={isLoading}>
                {isLoading ? 'Loading...' : t('login')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              {t('dont_have_account')} {' '}
              <Link 
                to="/signup" 
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {t('signup')}
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-6">
            <Input 
              label={t('email')} 
              type="email" 
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
            
            {resetSent && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                <CheckCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{t('reset_email_sent')}</p>
              </div>
            )}

            <div className="space-y-3">
               <Button fullWidth type="submit" disabled={isLoading || resetSent}>
                 {isLoading ? 'Sending...' : t('send_reset_link')}
               </Button>
               <Button 
                 fullWidth 
                 type="button" 
                 variant="ghost" 
                 onClick={() => {
                   setError('');
                   setResetSent(false);
                   setView('login');
                 }}
                 className="text-slate-500"
               >
                 <ArrowLeft size={16} /> {t('back_to_login')}
               </Button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
};
