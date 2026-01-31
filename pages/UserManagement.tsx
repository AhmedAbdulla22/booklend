import React, { useState, useEffect } from 'react';
import { Users, Shield, User, Search, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/supabaseClient';
import { Profile, Role } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CONSTANTS } from '../constants';

export const UserManagement = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await db.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user: Profile) => {
    const newRole = user.role === Role.ADMIN ? Role.MEMBER : Role.ADMIN;
    
    // Prevent self-demotion if desired, but here we'll allow it with a warning
    if (user.role === Role.ADMIN) {
        const confirm = window.confirm("Are you sure you want to demote this administrator to a standard member?");
        if (!confirm) return;
    }

    try {
      setUpdatingId(user.id);
      await db.updateUserRole(user.id, newRole);
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, role: newRole } : p));
      
      setNotification({ message: `User ${user.full_name} is now a ${newRole}`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: "Failed to update user role", type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate('/admin')} className="!p-2 rounded-full">
                <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="text-emerald-500" />
                User Management
            </h1>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-slide-up ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium text-sm">{notification.message}</p>
        </div>
      )}

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Loading users...</p>
                        </div>
                    </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                        No users found matching your search.
                    </td>
                </tr>
              ) : filteredProfiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {p.role === Role.ADMIN ? (
                        <Badge color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                           <Shield size={12} className="inline mr-1" /> Administrator
                        </Badge>
                      ) : (
                        <Badge color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                           <User size={12} className="inline mr-1" /> Member
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                        variant={p.role === Role.ADMIN ? 'secondary' : 'primary'} 
                        className={`text-xs py-1.5 h-auto ${updatingId === p.id ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => handleRoleToggle(p)}
                        disabled={updatingId === p.id}
                    >
                      {updatingId === p.id ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Processing...
                        </>
                      ) : (
                        <>
                            {p.role === Role.ADMIN ? 'Demote to Member' : 'Promote to Admin'}
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-xs leading-relaxed">
              <strong>Caution:</strong> Promoting a user to Admin grants them full access to manage books, loan requests, activity logs, and user roles. Only grant this access to trusted staff members.
          </p>
      </div>
    </div>
  );
};
