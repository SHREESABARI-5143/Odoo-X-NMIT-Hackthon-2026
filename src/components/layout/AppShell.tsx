import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { api } from '../../services/api';
import { CompanySettings } from '../../types';
import { 
  Users, Calendar, Clock, CreditCard, Settings as SettingsIcon, 
  LogOut, ShieldAlert, User as UserIcon, Menu, X, ChevronDown
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Load company logo & settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.settings.get();
        setCompanySettings(settings);
      } catch (err) {
        console.error('Failed to load company logo in shell', err);
      }
    };
    loadSettings();

    // Listen to settings update event
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CompanySettings>;
      if (customEvent.detail) {
        setCompanySettings(customEvent.detail);
      }
    };

    window.addEventListener('company-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('company-settings-updated', handleSettingsUpdate);
    };
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setAvatarDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close avatar dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#avatar-dropdown-container')) {
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Clock, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Time Off', path: '/time-off', icon: Calendar, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Payroll', path: '/admin/payroll', icon: CreditCard, roles: ['ADMIN'] },
    { name: 'Settings', path: '/settings', icon: SettingsIcon, roles: ['ADMIN'] }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* Top App Bar Header */}
      <header className="sticky top-0 z-40 bg-primary text-white border-b border-primary/20 shadow-md select-none no-print">
        <div className="mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
          
          {/* Company Title and Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded hover:bg-primary-hover focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <Link to="/dashboard" className="flex items-center gap-2 font-bold tracking-wide text-lg text-white">
              {companySettings?.logo ? (
                <img 
                  src={companySettings.logo} 
                  alt="Company Logo" 
                  className="h-8 w-auto max-w-[120px] rounded object-contain bg-white/10 p-0.5" 
                />
              ) : (
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-sm font-black border border-white/20">
                  D
                </div>
              )}
              <span className="hidden sm:inline">{companySettings?.name || 'Dayflow HRMS'}</span>
            </Link>
          </div>

          {/* Desktop Sub Navigation (Odoo horizontal layout) */}
          <nav className="hidden md:flex items-center h-full text-sm font-medium">
            {filteredNavItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `px-4 h-12 flex items-center gap-1.5 border-b-2 hover:bg-primary-hover transition-colors ${
                    isActive 
                      ? 'border-white text-white font-bold bg-primary-hover/50' 
                      : 'border-transparent text-white/80 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Header Controls (Avatar, Switcher) */}
          <div className="flex items-center gap-3">
            
            {/* QA Testing Floating Switcher */}
            {user && (
              <div className="hidden lg:flex items-center gap-1 bg-black/10 border border-white/10 px-2 py-1 rounded text-xs">
                <span className="text-white/60">Simulate:</span>
                <button 
                  onClick={() => switchRole(role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN')} 
                  className="font-bold underline text-white hover:text-secondary transition-colors"
                >
                  {role}
                </button>
              </div>
            )}

            {/* Profile Avatar Dropdown */}
            {user && (
              <div className="relative" id="avatar-dropdown-container">
                <button
                  onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded hover:bg-primary-hover focus:outline-none transition-colors"
                >
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.name} 
                      className="w-7 h-7 rounded-full object-cover border border-white/20" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-secondary border border-white/20 flex items-center justify-center font-bold text-xs uppercase text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/60" />
                </button>

                {avatarDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-text-primary rounded-md shadow-lg border border-border py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      to={user.employeeId ? `/employees/${user.employeeId}` : '/profile'}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-card transition-colors w-full text-left"
                    >
                      <UserIcon className="w-4 h-4 text-text-secondary" />
                      <span>My Profile</span>
                    </Link>
                    
                    {role === 'ADMIN' && (
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-card transition-colors w-full text-left"
                      >
                        <SettingsIcon className="w-4 h-4 text-text-secondary" />
                        <span>Settings</span>
                      </Link>
                    )}

                    {/* Quick switch button for mobile inside dropdown */}
                    <button
                      onClick={() => switchRole(role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN')}
                      className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm hover:bg-card transition-colors w-full text-left text-primary"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Switch to {role === 'ADMIN' ? 'Employee' : 'Admin'}</span>
                    </button>
                    
                    <hr className="border-border my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-status-error font-medium transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex select-none no-print">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-xs bg-white h-full shadow-xl flex flex-col z-50 border-r border-border p-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <span className="font-bold text-primary flex items-center gap-1.5 text-lg">
                Dayflow Navigation
              </span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-card"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-1.5 flex-1">
              {filteredNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-bold' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-card'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* Quick role-switch helper for mobile at bottom */}
            {user && (
              <div className="mt-auto border-t border-border pt-4 text-xs flex flex-col gap-2 bg-card p-3 rounded">
                <span className="text-text-secondary font-semibold">Simulate Role View:</span>
                <div className="flex items-center justify-between font-bold text-primary">
                  <span>Current: {role}</span>
                  <button 
                    onClick={() => switchRole(role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN')}
                    className="underline hover:text-primary-hover"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6">
        {children}
      </main>

    </div>
  );
};
export default AppShell;
