import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './services/AuthContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import AppShell from './components/layout/AppShell';

// Pages
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import AttendancePage from './pages/Attendance';
import TimeOff from './pages/TimeOff';
import PayrollPage from './pages/Payroll';
import SettingsPage from './pages/Settings';

// TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Guard component for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: ('ADMIN' | 'EMPLOYEE')[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Forced password update on first login check
  if (user.firstLogin && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Role guarding checks
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Show access denied notification
    setTimeout(() => {
      toast('Access Denied: You do not have permission to view this page.', 'error');
    }, 100);
    return <Navigate to="/dashboard" replace />;
  }

  return <AppShell>{children}</AppShell>;
};

// Guard component for guests / public routes
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.firstLogin) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// 404 Page Component
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-6">
      <h1 className="text-6xl font-black text-primary">404</h1>
      <h2 className="text-xl font-bold text-text-primary mt-2">Page Not Found</h2>
      <p className="text-text-secondary text-sm mt-1 max-w-sm">The URL you requested does not exist or may have been removed.</p>
      <LinkToDashboard />
    </div>
  );
};

const LinkToDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <a
      href={isAuthenticated ? '/dashboard' : '/login'}
      className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold uppercase rounded shadow transition-colors"
    >
      Return Home
    </a>
  );
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />

      {/* Protected routes wrapped with AppShell */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/time-off" element={<ProtectedRoute><TimeOff /></ProtectedRoute>} />
      
      {/* Admin restricted routes */}
      <Route path="/admin/payroll" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <PayrollPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* Wildcard redirects and 404 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
