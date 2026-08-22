import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Check, X, Lock, Eye, EyeOff } from 'lucide-react';

export const ChangePassword: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Strength checks
  const meetsMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const matchesConfirm = newPassword === confirmPassword && confirmPassword !== '';

  const isPasswordValid = meetsMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isFormValid = isPasswordValid && matchesConfirm && currentPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast('Please ensure all password requirements are met.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      toast('Password updated successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      toast(err.message || 'Failed to change password. Double check current password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checklistItem = (label: string, met: boolean) => (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <span className="p-0.5 rounded-full bg-status-success/10 text-status-success shrink-0">
          <Check className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span className="p-0.5 rounded-full bg-status-error/10 text-status-error shrink-0">
          <X className="w-3.5 h-3.5" />
        </span>
      )}
      <span className={met ? 'text-status-success font-medium' : 'text-text-secondary'}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      
      <div className="bg-white rounded-md border border-border shadow-xl w-full max-w-md p-8">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
            P
          </div>
          <h2 className="text-xl font-bold text-text-primary">Change Temporary Password</h2>
          <p className="text-text-secondary text-sm mt-1">To secure your account, you must change your temporary credentials before proceeding.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Current Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Current Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-secondary"><Lock className="w-4 h-4" /></span>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-2 border border-border rounded text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-secondary"><Lock className="w-4 h-4" /></span>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-10 py-2 border border-border rounded text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Confirm New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-secondary"><Lock className="w-4 h-4" /></span>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-10 py-2 border border-border rounded text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-card p-3.5 rounded border border-border mt-1 flex flex-col gap-2">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Strength Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checklistItem('Min 8 characters', meetsMinLength)}
              {checklistItem('Uppercase letter', hasUppercase)}
              {checklistItem('Lowercase letter', hasLowercase)}
              {checklistItem('Includes number', hasNumber)}
              {checklistItem('Special character', hasSpecial)}
              {checklistItem('Passwords match', matchesConfirm)}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover active:bg-primary text-white py-2.5 font-bold uppercase tracking-wider rounded text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Updating...' : 'Change Password'}
          </button>

        </form>

      </div>

    </div>
  );
};
export default ChangePassword;
