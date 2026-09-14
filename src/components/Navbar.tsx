'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { 
  Sparkles, PlusCircle, Shield, UserCheck, 
  Menu, X, Check, ChevronDown, LogOut,
  LogIn, Calendar
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { 
    currentUser, 
    isAuthenticated, 
    allUsers, 
    switchDemoUser, 
    logout, 
    openAuthModal 
  } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Explore Occasions' },
    { href: '/my-occasions', label: 'My Occasions' },
    { href: '/spaces/new', label: '+ Create Occasion' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Philosophy */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  Occasion Spaces
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide">
                  Temporary • Occasion-First
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100 font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <Link
                href="/platform-safety"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/platform-safety')
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-500" />
                <span>Safety Hub</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Bar: Real Authentication & Demo Persona Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {isAuthenticated && currentUser ? (
              /* Authenticated User Profile Dropdown */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 text-left transition-all"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[120px]">
                        {currentUser.displayName}
                      </span>
                      {currentUser.isVerified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]" title="Verified Contact">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 capitalize">
                      {currentUser.role === 'platform_moderator' ? 'Safety Moderator' : currentUser.contactType}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {currentUser.displayName}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                        {currentUser.contactValue}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-medium text-stone-600 dark:text-stone-300">
                        <UserCheck className="w-3 h-3 text-emerald-500" />
                        {currentUser.role === 'platform_moderator' ? 'Platform Moderator' : 'Verified Attendee'}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/my-occasions"
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-stone-400" />
                        My Joined Occasions
                      </Link>
                      <Link
                        href="/spaces/new"
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-stone-400" />
                        Create New Occasion
                      </Link>
                    </div>

                    {/* Demo Persona Submenu */}
                    {allUsers.length > 0 && (
                      <div className="px-4 pt-2 pb-1.5 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Demo Personas Switcher
                        </span>
                        <div className="mt-1.5 space-y-0.5">
                          {allUsers.map((u) => {
                            const isCurrent = u.id === currentUser.id;
                            return (
                              <button
                                key={u.id}
                                onClick={() => switchDemoUser(u.id)}
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                                  isCurrent
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                                }`}
                              >
                                <span className="truncate">{u.displayName}</span>
                                {isCurrent && <Check className="w-3.5 h-3.5 text-amber-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="px-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={logout}
                        className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated Guest Actions */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('otp')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-600" />
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  Join Occasion
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 pt-3 pb-5 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                  pathname === link.href
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/platform-safety"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              Platform Safety & Moderation
            </Link>

            {!isAuthenticated && (
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('otp');
                  }}
                  className="w-1/2 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl"
                >
                  Join Occasion
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Real Authentication Modal (Global) */}
      <AuthModal />
    </>
  );
}
