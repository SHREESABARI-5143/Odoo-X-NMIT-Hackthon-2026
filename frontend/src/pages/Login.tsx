import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast('Please enter both Login ID/Email and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast('Signed in successfully!', 'success');
      
      // Check first login
      const userStr = localStorage.getItem('df_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.firstLogin) {
          navigate('/change-password');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      
      {/* Centered Login Card */}
      <div className="bg-white rounded-md border border-border shadow-xl w-full max-w-md p-8">
        
        {/* Title & Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
            D
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome to Dayflow</h2>
          <p className="text-text-secondary text-sm mt-1">HR & Employee Management Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Email / ID Field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="login-id" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Login ID / Email <span className="text-status-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="login-id"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full pl-10 pr-4 py-2 border border-border rounded text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Password <span className="text-status-error">*</span>
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 border border-border rounded text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Helper details below password */}
          <div className="text-xs text-text-secondary flex justify-between items-center mt-1">
            <span className="italic">Forgot Password? Contact Admin.</span>
            <span className="font-semibold text-primary">HR/Admin generated credentials.</span>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover active:bg-primary text-white py-2.5 font-bold uppercase tracking-wider rounded text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>

        </form>
      </div>

    </div>
  );
};
export default Login;
