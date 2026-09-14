'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, PlusCircle, Shield, UserCheck, 
  Menu, X, Check, Phone, Mail, ChevronDown, 
  HeartHandshake, BookOpen
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, allUsers, switchUserById, verifyAndLogin } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  
  // Custom verification modal state
  const [newDisplayName, setNewDisplayName] = useState('');
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [contactValue, setContactValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'input' | 'otp'>('input');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName || !contactValue) {
      setVerifyError('Name and contact info are required');
      return;
    }
    setVerifyError('');
    setOtpStep('otp');
    setOtpCode('7492'); // simulated instant verification code
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    try {
      await verifyAndLogin(newDisplayName, contactType, contactValue);
      setVerifyModalOpen(false);
      setOtpStep('input');
      setNewDisplayName('');
      setContactValue('');
      setOtpCode('');
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Explore Occasions' },
    { href: '/my-occasions', label: 'My Occasions' },
    { href: '/spaces/new', label: '+ Create Occasion' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Occasion Philosophy */}
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

          {/* User Persona & Lightweight Identity Bar */}
          <div className="flex items-center gap-3">
            
            {/* Role & User Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 text-left transition-all"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[130px]">
                      {currentUser.displayName}
                    </span>
                    {currentUser.isVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]" title="Verified Phone/Email">
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

              {/* User switcher dropdown */}
              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                      Switch Role / Demo Persona
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Experience Occasion Spaces from different perspectives:
                    </p>
                  </div>

                  <div className="py-1">
                    {allUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => switchUserById(u.id)}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors ${
                            isCurrent ? 'bg-amber-50/50 dark:bg-amber-950/30 font-semibold text-amber-900 dark:text-amber-200' : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center font-bold text-[11px]">
                              {u.displayName.charAt(0)}
                            </span>
                            <div>
                              <div className="text-xs">{u.displayName}</div>
                              <div className="text-[10px] text-stone-400">{u.contactValue} • {u.role === 'platform_moderator' ? 'Safety Team' : 'User'}</div>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 pt-2 pb-1 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                        setVerifyModalOpen(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Verify Custom Phone / Email
                    </button>
                  </div>
                </div>
              )}
            </div>

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
          </div>
        )}
      </header>

      {/* Lightweight Phone / Email Verification Modal (FR9) */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    Lightweight Verification
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Traceability for safety without permanent public profiles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {otpStep === 'input' ? (
              <form onSubmit={handleSendOtp} className="p-6 space-y-4">
                {verifyError && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl">
                    {verifyError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g., Ananya Deshmukh"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">
                    This is only shown on memories you contribute to this occasion.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Verification Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setContactType('phone')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                        contactType === 'phone'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Mobile Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactType('email')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                        contactType === 'email'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </div>
                  <input
                    type={contactType === 'phone' ? 'tel' : 'email'}
                    required
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={contactType === 'phone' ? '+91 98765 43210' : 'name@example.com'}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModalOpen(false)}
                    className="px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl"
                  >
                    Send One-Time Code
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold">Simulated Verification Code: <strong>7492</strong></p>
                  <p className="text-[11px] mt-0.5">Code sent to {contactValue}. Enter it below to complete lightweight verification.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Enter 4-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full tracking-widest text-center text-lg font-bold p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep('input')}
                    className="px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl"
                  >
                    {verifying ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}
