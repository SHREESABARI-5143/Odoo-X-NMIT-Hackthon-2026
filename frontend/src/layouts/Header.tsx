import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, CalendarDays, WalletCards, Settings, LogOut, Lock, User as UserIcon, Menu, X, LayoutDashboard } from 'lucide-react';
import { companyApi } from '../api/companyApi';

export const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    companyApi
      .getSettings()
      .then((data) => setCompanySettings(data))
      .catch(() => {});
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Employees', path: '/employees', icon: Users, adminOnly: false },
    { name: 'Attendance', path: '/attendance', icon: Clock, adminOnly: false },
    { name: 'Time Off', path: '/time-off', icon: CalendarDays, adminOnly: false },
    { name: 'Payroll', path: '/admin/payroll', icon: WalletCards, adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E7E4E1] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company Identity */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={companySettings?.companyLogo || "/logo.png"}
                alt="Emplora Logo"
                className="h-9 max-w-[140px] object-contain"
              />
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-[#714B67] group-hover:text-[#52364D] transition-colors">
                  EMPLORA
                </span>
                <span className="text-[9px] text-[#6B6B6B] font-semibold tracking-wider uppercase hidden sm:inline-block">
                  Human Resource Management System
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((link) => {
                if (link.adminOnly && !isAdmin) return null;
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'bg-[#714B67] text-white shadow-2xs'
                        : 'text-[#6B6B6B] hover:text-[#252525] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Mobile Hamburger & User Dropdown */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-[#6B6B6B] hover:bg-[#F7F7F5] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="relative flex items-center">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#F7F7F5] transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[#714B67]/15 text-[#714B67] font-semibold text-xs flex items-center justify-center border border-[#714B67]/20 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#252525]">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[10px] text-[#6B6B6B] capitalize font-medium">
                    {user?.role === 'ADMIN_HR' ? 'Admin / HR' : 'Employee'}
                  </span>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-[#E7E4E1] py-2 z-50 flow-scale-enter">
                    <div className="px-4 py-2 border-b border-[#E7E4E1] bg-[#F7F7F5]/50">
                      <p className="text-xs font-semibold text-[#252525]">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[11px] text-[#6B6B6B] truncate">{user?.email}</p>
                      <div className="mt-1">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            user?.role === 'ADMIN_HR'
                              ? 'bg-[#714B67]/15 text-[#714B67]'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user?.role === 'ADMIN_HR' ? 'ADMIN / HR' : 'EMPLOYEE'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-[#252525] hover:bg-[#F7F7F5] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#6B6B6B]" />
                        <span>My Profile</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-[#252525] hover:bg-[#F7F7F5] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#6B6B6B]" />
                          <span>Company Settings</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/change-password');
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-[#252525] hover:bg-[#F7F7F5] transition-colors"
                      >
                        <Lock className="w-4 h-4 text-[#6B6B6B]" />
                        <span>Change Password</span>
                      </button>
                    </div>

                    <div className="border-t border-[#E7E4E1] pt-1">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-[#D85C5C] hover:bg-[#D85C5C]/10 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E7E4E1] py-3 space-y-1 flow-fade-enter">
            {navLinks.map((link) => {
              if (link.adminOnly && !isAdmin) return null;
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#714B67] text-white'
                      : 'text-[#6B6B6B] hover:bg-[#F7F7F5] hover:text-[#252525]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
