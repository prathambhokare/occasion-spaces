import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Plus } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-md w-full text-center space-y-5 bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md">
        
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            404 • Page Not Found
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            This Occasion Space Does Not Exist
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            The occasion space you are looking for may have concluded, transitioned into an archive, or the link may be misspelled.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-950 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Explore Occasions
          </Link>

          <Link
            href="/spaces/new"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Open New Space
          </Link>
        </div>

      </div>
    </div>
  );
}

