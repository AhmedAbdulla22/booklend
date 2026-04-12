import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/db'; // تأكد من الاستيراد من db.ts لاستخدام الدوال الجديدة
import { Loan, Role } from '../types';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  // حالة جديدة لتخزين إشعارات النظام من جدول notifications
  const [systemNotifs, setSystemNotifs] = useState<any[]>([]);

  // دالة مركزية لجلب كافة البيانات (القروض والإشعارات)
  const fetchData = async () => {
    if (!user) return;
    try {
      const [loans, notifs] = await Promise.all([
        db.getLoans(user.role === Role.ADMIN ? undefined : user.id),
        db.getNotifications(user.id) // الدالة التي تجلب البيانات من جدول الإشعارات
      ]);
      
      setMyLoans(loans || []);
      setSystemNotifs(notifs || []);
    } catch (error) {
      console.warn("Could not fetch data:", error);
    }
  };

  // جلب البيانات عند تغيير المستخدم أو تحميل المكون
  useEffect(() => {
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    try {
      // 1. الانتقال فوراً لصفحة تسجيل الدخول لتنظيف الشاشة
      navigate('/login', { replace: true });
      // 2. تنفيذ عملية تسجيل الخروج في الخلفية
      await logout();
    } catch (error) {
      console.warn("Logout background error ignored:", error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen pb-20 transition-all duration-300 ${language === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <Navbar 
        user={user} 
        notifications={myLoans} 
        // تمرير إشعارات النظام (مثل توفر الكتب) إلى Navbar
        systemNotifications={systemNotifs}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />
      <main className="max-w-7xl mx-auto px-4 mt-8 min-h-[50vh]">
        <Outlet context={{ 
            myLoans, 
            // تمرير دالة التحديث للمكونات الفرعية لتحديث القروض والإشعارات معاً
            refreshLoans: fetchData
        }} />
      </main>
    </div>
  );
};