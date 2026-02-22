import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-gray-100 text-gray-700' }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color} border border-gray-300`}>
    {children}
  </span>
);