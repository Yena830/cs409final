/**
 * UserContext - Global user authentication state management
 * Provides shared user state across all components
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  bio?: string;
  profilePhoto?: string;
  createdAt?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null, token?: string) => void;
  clearUser: () => void;
  isOwner: () => boolean;
  isHelper: () => boolean;
  getUser: () => User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (userStr && token) {
          setUserState(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUserState(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUserState(null);
  };

  const setUser = (userData: User | null, token?: string) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUserState(userData);
    }
    
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const clearUser = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUserState(null);
  };

  const isOwner = () => {
    return user?.roles?.includes('owner') || false;
  };

  const isHelper = () => {
    return user?.roles?.includes('helper') || false;
  };

  const getUser = () => {
    return user;
  };

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  const value: UserContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    setUser,
    clearUser,
    isOwner,
    isHelper,
    getUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}