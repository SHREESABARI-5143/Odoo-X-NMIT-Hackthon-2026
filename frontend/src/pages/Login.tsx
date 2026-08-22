import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Lock, Mail, UserCheck, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await authApi.login({ loginId, password });
      login(data.token, data.user);

      if (data.user.firstLogin) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid Login ID or password.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#E7E4E1] p-8 flow-scale-enter">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Emplora Logo"
            className="h-16 mx-auto mb-3 object-contain"
          />
          <h1 className="text-2xl font-black tracking-tight text-[#714B67]">EMPLORA</h1>
          <p className="text-xs text-[#6B6B6B] mt-1 font-semibold tracking-wider uppercase">
            Human Resource Management System
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-[#D85C5C]/10 border border-[#D85C5C]/30 text-[#D85C5C] text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1.5">
              Login ID or Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. OIJO20260001 or admin@dayflow.com"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full py-2.5">
            SIGN IN
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E7E4E1] text-center">
          <button
            onClick={() => setShowSignUpModal(true)}
            className="text-xs text-[#714B67] font-semibold hover:underline"
          >
            Don't have an account? Sign Up
          </button>
        </div>
      </div>

      {/* Public Registration Info Modal */}
      <Modal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        title="Employee Registration"
      >
        <div className="py-4 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#714B67]/15 text-[#714B67] flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#252525]">
            Employee accounts can only be created by an Admin or HR Officer.
          </p>
          <p className="text-xs text-[#6B6B6B]">
            Please contact your company HR department to obtain your generated Login ID and temporary password.
          </p>
          <Button className="mt-4" onClick={() => setShowSignUpModal(false)}>
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
};
