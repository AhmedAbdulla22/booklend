import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-10" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded flex-1" />
      </div>
    </div>
  </div>
);

export const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-end">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-32" />
      </div>
    </td>
  </tr>
);
