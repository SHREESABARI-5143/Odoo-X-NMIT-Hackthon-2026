import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from './Header';

export const AppShell: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force first-login password change
  if (user?.firstLogin && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flow-fade-enter">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-[#E7E4E1] py-4 text-center text-xs text-[#6B6B6B]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EMPLORA HRMS — Human Resource Management System</span>
          <span>Version 2.0.0 Enterprise</span>
        </div>
      </footer>
    </div>
  );
};
