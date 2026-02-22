
import React, { useState, useEffect } from 'react';
import { Users, Shield, User, Search, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/supabaseClient';
import { Profile, Role, Loan, LoanStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonRow } from '../components/ui/SkeletonCard';
import { CONSTANTS } from '../constants';

// Fix for TypeScript inference issues with motion components
const MotionDiv = motion.div;

export const UserManagement = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, loanData] = await Promise.all([
        db.getProfiles(),
        db.getLoans()
      ]);
      setProfiles(profileData);
      setLoans(loanData);
    } catch (error) {
      setNotification({ message: "Error connecting to database.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getUserActivity = (userId: string) => {
    const hasActiveLoan = loans.some(l => 
      l.user_id === userId && 
      (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE)
    );
    return hasActiveLoan ? 'active' : 'idle';
  };

  const handleRoleToggle = async (user: Profile) => {
    const newRole = user.role === Role.ADMIN ? Role.MEMBER : Role.ADMIN;
    if (user.role === Role.ADMIN) {
        if (!window.confirm("Demote this administrator?")) return;
    }

    try {
      setUpdatingId(user.id);
      await db.updateUserRole(user.id, newRole);
      setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, role: newRole } : p));
      setNotification({ message: `Role updated successfully`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: "Update failed", type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate('/admin')} className="!p-2 rounded-full">
                <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-emerald-500" />
                {t('recent_activity')}
            </h1>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full bg-white/50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          /* Fix: Using MotionDiv instead of motion.div directly to resolve TypeScript property missing errors */
          <MotionDiv 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium text-sm">{notification.message}</p>
          </MotionDiv>
        )}
      </AnimatePresence>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status & Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredProfiles.map((p) => {
                const activity = getUserActivity(p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.avatar_url || `${CONSTANTS.DEFAULT_IMAGES.AVATAR_API}${encodeURIComponent(p.full_name)}`} 
                          className="w-10 h-10 rounded-full border border-slate-200" 
                          alt="" 
                        />
                        <div>
                          <p className="font-bold text-slate-800">{p.full_name}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex gap-2">
                          {p.role === Role.ADMIN ? (
                            <Badge color="bg-emerald-100 text-emerald-700 text-[10px]">
                               <Shield size={10} className="inline mr-1" /> {t('role_admin')}
                            </Badge>
                          ) : (
                            <Badge color="bg-slate-100 text-slate-600 text-[10px]">
                               <User size={10} className="inline mr-1" /> {t('role_member')}
                            </Badge>
                          )}
                          <Badge color={activity === 'active' ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-slate-100 text-slate-400 text-[10px]'}>
                            {activity === 'active' ? 'Active' : 'Idle'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                            variant={p.role === Role.ADMIN ? 'secondary' : 'primary'} 
                            className={`text-xs py-1.5 h-auto ${updatingId === p.id ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={() => handleRoleToggle(p)}
                            disabled={updatingId === p.id}
                        >
                          {updatingId === p.id ? (
                            <><Loader2 size={14} className="animate-spin" /> Processing...</>
                          ) : (
                            <>{p.role === Role.ADMIN ? t('demote_member') : t('promote_admin')}</>
                          )}
                        </Button>
                      </MotionDiv>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
