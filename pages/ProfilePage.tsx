import React, { useState } from 'react';
import { User, Edit2, Check, X, Shield, History, BookOpen, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoansList } from '../components/LoansList';
import { Loan, LoanStatus } from '../types';
import { CONSTANTS } from '../constants';

interface ProfilePageProps {
  loans: Loan[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ loans }) => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    avatar_url: user?.avatar_url || ''
  });
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  if (!user) return null;

  // Filter loans for the current user (if passed loans are mixed)
  const myLoans = loans.filter(l => l.user_id === user.id);
  const activeCount = myLoans.filter(l => l.status === LoanStatus.ACTIVE).length;
  const returnedCount = myLoans.filter(l => l.status === LoanStatus.RETURNED).length;

  const handleSave = async () => {
    if (passwords.new || passwords.confirm) {
      if (passwords.new !== passwords.confirm) {
        alert(t('passwords_mismatch'));
        return;
      }
      // In a real app, we would send the password here. 
      // For this mock, we pretend it's updated.
    }
    
    await updateProfile(formData);
    setPasswords({ new: '', confirm: '' });
    setIsEditing(false);
    alert(t('profile_updated'));
  };

  const handleCancel = () => {
    setFormData({
      full_name: user.full_name,
      avatar_url: user.avatar_url || ''
    });
    setPasswords({ new: '', confirm: '' });
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      {/* User Info Card */}
      <GlassCard className="p-6 lg:col-span-1 h-fit">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 group">
            <img 
              src={formData.avatar_url || `${CONSTANTS.DEFAULT_IMAGES.AVATAR_API}${encodeURIComponent(formData.full_name || 'User')}`} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-white/50 shadow-lg"
            />
            {!isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium cursor-pointer" onClick={() => setIsEditing(true)}>
                <Edit2 size={24} />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="w-full space-y-4">
              <Input 
                label={t('full_name')} 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
              <Input 
                label={t('avatar_url')} 
                value={formData.avatar_url} 
                onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
              />
              
              <div className="border-t border-slate-200 pt-4 mt-2">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1 justify-center"><Lock size={10} /> {t('leave_blank')}</p>
                <div className="space-y-3">
                  <Input 
                    label={t('new_password')} 
                    type="password"
                    value={passwords.new} 
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    placeholder="••••••••"
                  />
                  <Input 
                    label={t('confirm_password')} 
                    type="password"
                    value={passwords.confirm} 
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-center mt-6">
                <Button variant="secondary" onClick={handleCancel} className="!p-2">
                  <X size={20} />
                </Button>
                <Button onClick={handleSave} className="!p-2 bg-emerald-500 hover:bg-emerald-600">
                  <Check size={20} />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800">{user.full_name}</h2>
              <p className="text-slate-500">{user.email}</p>
              
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                <Shield size={14} />
                <span className="uppercase">{user.role}</span>
              </div>

              <Button variant="secondary" className="mt-6 w-full" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> {t('edit_profile')}
              </Button>
            </>
          )}

          <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{activeCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('active_loans')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{returnedCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('returned_loans')}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* History Card */}
      <div className="lg:col-span-2 space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <History size={24} className="text-emerald-500" />
            {t('loan_history')}
          </h3>
          
          <div className="max-h-[800px] overflow-y-auto pr-2">
            {myLoans.length > 0 ? (
               <LoansList loans={myLoans} isAdmin={false} onAction={() => {}} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>{t('no_logs')}</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};