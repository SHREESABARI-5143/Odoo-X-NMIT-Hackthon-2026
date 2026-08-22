import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Check, X, Lock, ShieldCheck } from 'lucide-react';

export const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const criteria = [
    { label: 'Minimum 8 characters', valid: newPassword.length >= 8 },
    { label: 'Uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
    { label: 'Number (0-9)', valid: /\d/.test(newPassword) },
    { label: 'Special character (@$!%*?&)', valid: /[@$!%*?&]/.test(newPassword) },
    { label: 'Passwords match', valid: newPassword.length > 0 && newPassword === confirmPassword },
  ];

  const allValid = criteria.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!allValid) {
      setErrorMsg('Please satisfy all password criteria before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      updateUser({ firstLogin: false });
      showToast('Password changed successfully.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#E7E4E1] p-8 flow-scale-enter">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#714B67] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#252525]">Change Password</h2>
          {user?.firstLogin && (
            <p className="text-xs text-[#F6A23A] font-semibold mt-1">
              Mandatory: You must change your temporary password on first login.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-[#D85C5C]/10 text-[#D85C5C] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">
              Current Password (Temporary)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          {/* Password Validation Checklist */}
          <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E7E4E1] space-y-1.5">
            <p className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
              Password Requirements
            </p>
            {criteria.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {c.valid ? (
                  <Check className="w-4 h-4 text-[#3FA66B] flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-[#D85C5C] flex-shrink-0" />
                )}
                <span className={c.valid ? 'text-[#3FA66B] font-medium' : 'text-[#6B6B6B]'}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          <Button type="submit" isLoading={isLoading} disabled={!allValid} className="w-full py-2.5">
            Update Password & Continue
          </Button>
        </form>
      </div>
    </div>
  );
};
