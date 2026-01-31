import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  // Light Mode: bg-white/70 (more opaque) for better text contrast
  // Dark Mode: bg-slate-900/60 (dark glass)
  <div 
    className={`
      bg-white/70 dark:bg-slate-900/70 
      backdrop-blur-xl 
      border border-white/60 dark:border-slate-700/60 
      rounded-2xl shadow-xl 
      text-slate-800 dark:text-slate-100
      transition-colors duration-300
      ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);