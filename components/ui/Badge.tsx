import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-slate-100 text-slate-700' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} border border-white/20`}>
    {children}
  </span>
);