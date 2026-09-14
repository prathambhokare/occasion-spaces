import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6 animate-pulse">
      <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
      <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-xl w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-72 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-72 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-72 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    </div>
  );
}

