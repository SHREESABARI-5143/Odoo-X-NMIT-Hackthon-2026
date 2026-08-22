import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const currentUser = api.auth.getCurrentUser();
    setUser(currentUser);
    setRole(currentUser ? currentUser.role : null);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();

    // Listen to custom authorization events from API helper
    const handleExpired = () => {
      setUser(null);
      setRole(null);
      alert('Your session has expired. Please log in again.');
      window.location.href = '/login';
    };

    const handleLogout = () => {
      setUser(null);
      setRole(null);
    };

    window.addEventListener('auth-expired', handleExpired);
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-expired', handleExpired);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(email, password);
      setUser(response.user);
      setRole(response.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setRole(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('df_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setRole(newRole);
      // Optional: Refresh screen
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
