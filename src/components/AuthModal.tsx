'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  UserCheck, KeyRound, Mail, Phone, 
  ArrowRight, X, Sparkles, RefreshCw 
} from 'lucide-react';

export function AuthModal() {
  const { 
    authModalOpen, 
    authModalInitialTab, 
    closeAuthModal, 
    sendOtp, 
    verifyOtp, 
    loginWithPassword, 
    registerWithPassword,
    allUsers,
    switchDemoUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'otp' | 'password'>(
    authModalInitialTab === 'register' ? 'password' : (authModalInitialTab || 'otp')
  );
  const [passwordMode, setPasswordMode] = useState<'login' | 'register'>(
    authModalInitialTab === 'register' ? 'register' : 'login'
  );

  // OTP Form State
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');
  const [otpDisplayName, setOtpDisplayName] = useState('');
  const [otpContactType, setOtpContactType] = useState<'phone' | 'email'>('phone');
  const [otpContactValue, setOtpContactValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpPreviewCode, setOtpPreviewCode] = useState<string | null>(null);

  // Password Form State
  const [pwdDisplayName, setPwdDisplayName] = useState('');
  const [pwdContactValue, setPwdContactValue] = useState('');
  const [password, setPassword] = useState('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (authModalOpen) {
      setActiveTab(authModalInitialTab === 'register' ? 'password' : (authModalInitialTab || 'otp'));
      setPasswordMode(authModalInitialTab === 'register' ? 'register' : 'login');
      setOtpStep('input');
      setErrorMessage('');
      setSuccessMessage('');
      setOtpCode('');
      setOtpPreviewCode(null);
    }
  }, [authModalOpen, authModalInitialTab]);

  if (!authModalOpen) return null;

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpContactValue.trim()) {
      setErrorMessage('Please enter your phone number or email address');
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendOtp(otpContactType, otpContactValue.trim());
      setOtpStep('verify');
      if (result.previewCode) {
        setOtpPreviewCode(result.previewCode);
        setOtpCode(result.previewCode); // auto-fill for instant smooth test
      }
      setSuccessMessage(`A 6-digit code was sent to ${otpContactValue.trim()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification code');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode || otpCode.length < 4) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(
        otpDisplayName.trim() || 'Attendee',
        otpContactType,
        otpContactValue.trim(),
        otpCode.trim()
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Password Login / Register
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!pwdContactValue.trim()) {
      setErrorMessage('Please enter your email or phone');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setSubmitting(true);
    try {
      if (passwordMode === 'login') {
        await loginWithPassword(pwdContactValue.trim(), password);
      } else {
        if (!pwdDisplayName.trim()) {
          setErrorMessage('Please enter your display name');
          setSubmitting(false);
          return;
        }
        const detectedType: 'phone' | 'email' = 
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pwdContactValue.trim()) ? 'email' : 'phone';
        await registerWithPassword(
          pwdDisplayName.trim(),
          detectedType,
          pwdContactValue.trim(),
          password
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 bg-gradient-to-br from-amber-500/10 to-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Join Occasion Spaces
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Lightweight identity for shared occasions
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-stone-100 dark:bg-stone-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('otp');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'otp'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-500" />
            One-Time Code (OTP)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'password'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-rose-500" />
            Password Login
          </button>
        </div>

        {/* Error / Success Alerts */}
        <div className="px-6">
          {errorMessage && (
            <div className="p-3 mb-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 mb-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
              {successMessage}
            </div>
          )}
        </div>

        {/* Tab 1: One-Time Passcode (Fast Guest Verification) */}
        {activeTab === 'otp' && (
          <div className="px-6 pb-6">
            {otpStep === 'input' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Your Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={otpDisplayName}
                    onChange={(e) => setOtpDisplayName(e.target.value)}
                    placeholder="e.g., Ananya Deshmukh"
                    className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">
                    Used to attribute your memories in shared occasions.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Verification Channel
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setOtpContactType('phone')}
                      className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        otpContactType === 'phone'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 font-semibold'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      Mobile Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpContactType('email')}
                      className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        otpContactType === 'email'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 font-semibold'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      Email Address
                    </button>
                  </div>
                  <input
                    type={otpContactType === 'phone' ? 'tel' : 'email'}
                    required
                    value={otpContactValue}
                    onChange={(e) => setOtpContactValue(e.target.value)}
                    placeholder={otpContactType === 'phone' ? '+91 98765 43210' : 'ananya@example.com'}
                    className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send 6-Digit Code
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpPreviewCode && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs border border-amber-200 dark:border-amber-900/60">
                    <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Generated Verification Code: <strong className="text-sm font-mono tracking-wider ml-1">{otpPreviewCode}</strong>
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                      Code dispatched to <strong>{otpContactValue}</strong>.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full tracking-widest text-center text-xl font-bold py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('input');
                      setErrorMessage('');
                    }}
                    className="w-1/3 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Password Authentication */}
        {activeTab === 'password' && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-4 mb-4 text-xs font-medium text-stone-500">
              <button
                type="button"
                onClick={() => setPasswordMode('login')}
                className={`pb-1 border-b-2 transition-colors ${
                  passwordMode === 'login'
                    ? 'border-amber-500 text-stone-900 dark:text-stone-100 font-semibold'
                    : 'border-transparent hover:text-stone-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode('register')}
                className={`pb-1 border-b-2 transition-colors ${
                  passwordMode === 'register'
                    ? 'border-amber-500 text-stone-900 dark:text-stone-100 font-semibold'
                    : 'border-transparent hover:text-stone-800'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              {passwordMode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={pwdDisplayName}
                    onChange={(e) => setPwdDisplayName(e.target.value)}
                    placeholder="e.g., Priya Sharma"
                    className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Email or Mobile Phone
                </label>
                <input
                  type="text"
                  required
                  value={pwdContactValue}
                  onChange={(e) => setPwdContactValue(e.target.value)}
                  placeholder="name@example.com or +91 98201 23456"
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={passwordMode === 'register' ? 'At least 6 characters' : 'Enter password'}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                {passwordMode === 'login' && (
                  <p className="text-[11px] text-stone-400 mt-1">
                    Demo accounts use default password: <strong>password123</strong>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    {passwordMode === 'login' ? 'Sign In with Password' : 'Create Account & Sign In'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Demo Persona Quick-Switcher Footer */}
        {allUsers.length > 0 && (
          <div className="px-6 py-3.5 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">
              Or 1-click test as:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {allUsers.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={async () => {
                    await switchDemoUser(u.id);
                    closeAuthModal();
                  }}
                  className="px-2 py-1 bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-200 rounded-lg text-[10px] font-medium border border-stone-200/80 dark:border-stone-700 transition-colors"
                >
                  {u.displayName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

