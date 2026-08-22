import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './layouts/AppShell';

import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { Attendance } from './pages/Attendance';
import { TimeOff } from './pages/TimeOff';
import { AdminPayroll } from './pages/AdminPayroll';
import { CompanySettingsPage } from './pages/CompanySettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected App Shell */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/:id" element={<EmployeeProfile />} />
                <Route path="/profile" element={<EmployeeProfile />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/time-off" element={<TimeOff />} />
                <Route path="/admin/payroll" element={<AdminPayroll />} />
                <Route path="/settings" element={<CompanySettingsPage />} />
                <Route path="/change-password" element={<ChangePassword />} />
              </Route>

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
