import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white border border-gray-300 rounded overflow-hidden animate-pulse">
    <div className="aspect-[2/3] bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-gray-200 rounded w-10" />
        <div className="h-10 bg-gray-200 rounded flex-1" />
      </div>
    </div>
  </div>
);

export const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-200">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-2 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded w-20" />
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-end">
        <div className="h-8 bg-gray-200 rounded w-32" />
      </div>
    </td>
  </tr>
);
