import React, { useState, useEffect } from 'react';
// 1. ADDED Trash2 to the lucide-react imports
import { Users, Shield, User, Search, CheckCircle, AlertCircle, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
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

const MotionDiv = motion.div;

export const UserManagement = () => {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // 2. ADDED deletingId state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Refetch data when component regains visibility (fixes navigation and app switching issues)
  useEffect(() => {
    let lastActiveTime = Date.now();
    let inactivityTimer: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    // Handle window focus (when switching back from other apps)
    const handleWindowFocus = () => {
      const now = Date.now();
      // Only refresh if it's been more than 2 seconds since last active (prevents rapid refires)
      if (now - lastActiveTime > 2000) {
        loadData();
      }
      lastActiveTime = now;
    };

    // Handle page reactivation (mouse movement after inactivity)
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastActiveTime > 5000) { // 5 seconds of inactivity
        loadData();
      }
      lastActiveTime = now;
    };

    // Set up inactivity detection
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Mark as inactive
        lastActiveTime = Date.now() - 10000; // 10 seconds ago
      }, 5000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('mousemove', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);
    
    resetInactivityTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      clearTimeout(inactivityTimer);
    };
  }, []);

  useEffect(() => {
    console.log('Notification state changed:', notification);
  }, [notification]);

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

  // 3. ADDED handleDeleteUser function
const handleDeleteUser = async (user: Profile) => {
    console.log('handleDeleteUser called for user:', user);
    
    // 1. منع مسح الآدمن
    if (user.role === Role.ADMIN) {
      console.log('Cannot delete admin user');
      setNotification({ message: "Cannot delete an Admin user.", type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // 2. إضافة التحقق من وجود إعارات نشطة أو متأخرة للمستخدم
    const hasActiveLoan = loans.some(l => 
      l.user_id === user.id && 
      (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE)
    );
    
    console.log('Has active loan:', hasActiveLoan, 'for user:', user.id);

    if (hasActiveLoan) {
      console.log('User has active loans, showing error message');
      const notificationMessage = t('cannot_delete_has_books');
      console.log('Setting notification with message:', notificationMessage);
      setNotification({ 
        message: notificationMessage, 
        type: 'error' 
      });
      setTimeout(() => {
        console.log('Clearing notification after timeout');
        setNotification(null);
      }, 4000);
      return; 
    }

    console.log('Showing confirmation dialog');
    if (!window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      console.log('User cancelled deletion');
      return;
    }

    console.log('User confirmed deletion, proceeding...');
    try {
      setDeletingId(user.id);
      console.log('Calling db.deleteUser for user:', user.id);
      await db.deleteUser(user.id);
      console.log('User deleted successfully from database');
      setProfiles(prev => prev.filter(p => p.id !== user.id));
      console.log('Setting success notification');
      setNotification({ message: "User deleted successfully", type: 'success' });
      setTimeout(() => {
        console.log('Clearing success notification after timeout');
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setNotification({ message: "Failed to delete user. Check database constraints.", type: 'error' });
    } finally {
      setDeletingId(null);
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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="text-emerald-500" />
                {t('user_management')}
            </h1>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t('search_users')} 
            className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <>
            {console.log('Rendering notification:', notification)}
            <MotionDiv 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl flex items-center gap-3 fixed top-4 right-4 z-50 shadow-lg ${
                notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}
              style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}
            >
                {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <p className="font-medium text-sm">{notification.message}</p>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('table_user')}</th>
                <th className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('table_status_role')}</th>
                <th className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredProfiles.map((p) => {
                const activity = getUserActivity(p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className={`px-6 py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.avatar_url || `${CONSTANTS.DEFAULT_IMAGES.AVATAR_API}${encodeURIComponent(p.full_name)}`} 
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" 
                          alt="" 
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{p.full_name}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex gap-2">
                          {p.role === Role.ADMIN ? (
                            <Badge color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                               <Shield size={10} className="inline mr-1" /> {t('role_admin')}
                            </Badge>
                          ) : (
                            <Badge color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px]">
                               <User size={10} className="inline mr-1" /> {t('role_member')}
                            </Badge>
                          )}
                          <Badge color={activity === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 text-[10px]' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 text-[10px]'}>
                            {activity === 'active' ? t('user_active') : t('user_idle')}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                      {/* 4. UPDATED Action Buttons Layout */}
                      <div className={`flex items-center ${dir === 'rtl' ? 'justify-start' : 'justify-end'} gap-2`}>
                        <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                              variant={p.role === Role.ADMIN ? 'secondary' : 'primary'} 
                              className={`text-xs py-1.5 h-auto ${updatingId === p.id ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={() => handleRoleToggle(p)}
                              disabled={updatingId === p.id || deletingId === p.id}
                          >
                            {updatingId === p.id ? (
                              <><Loader2 size={14} className="animate-spin" /> Processing...</>
                            ) : (
                              <>{p.role === Role.ADMIN ? t('demote_member') : t('promote_admin')}</>
                            )}
                          </Button>
                        </MotionDiv>

                        {/* 5. ADDED Delete Button (Only visible if not admin) */}
                        {p.role !== Role.ADMIN && (
                          <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              variant="secondary"
                              className={`!p-1.5 h-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 ${deletingId === p.id ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={() => {
                                console.log('Delete button clicked for user:', p);
                                handleDeleteUser(p);
                              }}
                              disabled={deletingId === p.id || updatingId === p.id}
                              title="Delete User"
                            >
                              {deletingId === p.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </MotionDiv>
                        )}
                      </div>
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