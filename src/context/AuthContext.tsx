'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => void;
  refreshUsers: () => Promise<void>;
  verifyAndLogin: (displayName: string, contactType: 'phone' | 'email', contactValue: string) => Promise<User>;
}

// Fallback user if loading
const DEFAULT_USER: User = {
  id: 'user-priya',
  displayName: 'Priya Sharma (Convener)',
  contactType: 'phone',
  contactValue: '+91 98201 23456',
  isVerified: true,
  role: 'user',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [allUsers, setAllUsers] = useState<User[]>([DEFAULT_USER]);

  const refreshUsers = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        setAllUsers(data.users);
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('occasion_active_user_id') : null;
        if (storedId) {
          const match = data.users.find((u: User) => u.id === storedId);
          if (match) {
            setCurrentUser(match);
            return;
          }
        }
        // Default to Priya Sharma (Organizer) for rich first-touch experience
        const defaultMatch = data.users.find((u: User) => u.id === 'user-priya') || data.users[0];
        setCurrentUser(defaultMatch);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const switchUserById = (userId: string) => {
    const match = allUsers.find((u) => u.id === userId);
    if (match) {
      setCurrentUser(match);
      if (typeof window !== 'undefined') {
        localStorage.setItem('occasion_active_user_id', match.id);
      }
    }
  };

  const verifyAndLogin = async (displayName: string, contactType: 'phone' | 'email', contactValue: string): Promise<User> => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, contactType, contactValue }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    const user: User = data.user;
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('occasion_active_user_id', user.id);
    }
    await refreshUsers();
    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUser,
        switchUserById,
        refreshUsers,
        verifyAndLogin,
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
