import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  <div 
    className={`
      bg-white 
      border border-gray-300 
      rounded-md shadow-sm
      text-gray-800
      ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);