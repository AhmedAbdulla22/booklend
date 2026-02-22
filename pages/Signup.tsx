import React, { useState } from 'react';
import { Library } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GlassCard } from '../components/ui/GlassCard';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signup(email, name, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <GlassCard className="w-full max-w-md p-8 animate-fade-in border-white/80">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white mb-4 shadow-lg shadow-emerald-500/30">
            <Library size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{t('signup')}</h1>
          <p className="text-slate-500">{t('app_name')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label={t('full_name')} 
            type="text" 
            placeholder="John Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input 
            label={t('email')} 
            type="email" 
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input 
            label={t('password')} 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</p>}

          <Button fullWidth type="submit" className="mt-4" disabled={isLoading}>
            {isLoading ? 'Loading...' : t('signup')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('already_have_account')} {' '}
          <Link 
            to="/login" 
            className="text-emerald-600 font-bold hover:underline"
          >
            {t('login')}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};