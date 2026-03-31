import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full text-start">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ms-1">{label}</label>}
    <input 
      className={`
        px-4 py-2 rounded-xl 
        bg-white/80 dark:bg-slate-950/50 
        border border-slate-200 dark:border-slate-700 
        text-slate-900 dark:text-white
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
        placeholder:text-slate-400 dark:placeholder:text-slate-600
        transition-all 
        ${className}
      `}
      {...props}
    />
  </div>
);