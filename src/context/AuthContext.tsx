'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  allUsers: User[];
  authModalOpen: boolean;
  authModalInitialTab: 'otp' | 'password' | 'register';
  openAuthModal: (initialTab?: 'otp' | 'password' | 'register') => void;
  closeAuthModal: () => void;
  sendOtp: (contactType: 'phone' | 'email', contactValue: string) => Promise<{ previewCode?: string; message: string }>;
  verifyOtp: (displayName: string, contactType: 'phone' | 'email', contactValue: string, code: string) => Promise<User>;
  loginWithPassword: (contactValue: string, password: string) => Promise<User>;
  registerWithPassword: (displayName: string, contactType: 'phone' | 'email', contactValue: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => Promise<User>;
  switchUserById: (userId: string) => void;
  verifyAndLogin: (displayName: string, contactType: 'phone' | 'email', contactValue: string) => Promise<User>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'otp' | 'password' | 'register'>('otp');

  const openAuthModal = useCallback((initialTab: 'otp' | 'password' | 'register' = 'otp') => {
    setAuthModalInitialTab(initialTab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  // Fetch all users (for demo switcher and mentions)
  const refreshUsersList = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users list:', err);
    }
  };

  // Verify or create user and set session
  const verifyAndLogin = useCallback(async (
    displayName: string,
    contactType: 'phone' | 'email',
    contactValue: string
  ): Promise<User> => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, contactType, contactValue }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }
    setCurrentUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('occasion_active_user_id', data.user.id);
    }
    await refreshUsersList();
    return data.user;
  }, []);

  // Check current session from HTTP-only cookie
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.user) {
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('occasion_active_user_id', data.user.id);
        }
      } else {
        // Fallback: check if previous local demo user exists and auto-authenticate
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('occasion_active_user_id') : null;
        if (storedId) {
          try {
            const demoRes = await fetch('/api/auth');
            const demoData = await demoRes.json();
            const matched = demoData.users?.find((u: User) => u.id === storedId);
            if (matched) {
              // Establish session for the stored demo user
              await verifyAndLogin(matched.displayName, matched.contactType, matched.contactValue);
              return;
            }
          } catch {
            // Ignore session fallback error
          }
        }
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [verifyAndLogin]);

  useEffect(() => {
    refreshSession();
    refreshUsersList();
  }, []);

  // Send 6-digit OTP to Email or Phone
  const sendOtp = async (contactType: 'phone' | 'email', contactValue: string) => {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', contactType, contactValue }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }
    return { previewCode: data.previewCode, message: data.message };
  };

  // Verify OTP and establish session
  const verifyOtp = async (
    displayName: string,
    contactType: 'phone' | 'email',
    contactValue: string,
    code: string
  ): Promise<User> => {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', displayName, contactType, contactValue, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }
    setCurrentUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('occasion_active_user_id', data.user.id);
    }
    await refreshUsersList();
    closeAuthModal();
    return data.user;
  };

  // Login with Email/Phone and Password
  const loginWithPassword = async (contactValue: string, password: string): Promise<User> => {
    const res = await fetch('/api/auth/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', contactValue, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setCurrentUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('occasion_active_user_id', data.user.id);
    }
    closeAuthModal();
    return data.user;
  };

  // Register with Name, Email/Phone, and Password
  const registerWithPassword = async (
    displayName: string,
    contactType: 'phone' | 'email',
    contactValue: string,
    password: string
  ): Promise<User> => {
    const res = await fetch('/api/auth/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', displayName, contactType, contactValue, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setCurrentUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('occasion_active_user_id', data.user.id);
    }
    await refreshUsersList();
    closeAuthModal();
    return data.user;
  };

  // Log out current session
  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('occasion_active_user_id');
    }
  };

  // Fast switch to a demo persona with real session issuance
  const switchDemoUser = async (userId: string): Promise<User> => {
    const match = allUsers.find((u) => u.id === userId);
    if (!match) {
      throw new Error('User not found');
    }
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: match.displayName,
        contactType: match.contactType,
        contactValue: match.contactValue,
      }),
    });
    const data = await res.json();
    setCurrentUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('occasion_active_user_id', data.user.id);
    }
    return data.user;
  };

  // Backward-compatible wrappers
  const switchUserById = (userId: string) => {
    switchDemoUser(userId).catch(console.error);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        allUsers,
        authModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        sendOtp,
        verifyOtp,
        loginWithPassword,
        registerWithPassword,
        logout,
        switchDemoUser,
        switchUserById,
        verifyAndLogin,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
