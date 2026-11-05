import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  ShieldQuestion,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { validatePassword } from '../utils/pure_logic';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigate,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Lookup Question
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your account email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPasswordCheck(email.trim());
      setSecurityQuestion(res.securityQuestion);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'No registered account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify & Reset
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!securityAnswer.trim()) {
      setError('Please answer your security question.');
      return;
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      setError(passCheck.error || 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.forgotPasswordReset({
        email: email.trim(),
        securityAnswer: securityAnswer.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Check your security answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 mb-4">
            <ShieldQuestion className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Recovery
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {step === 1 && 'Enter your email to verify your identity'}
            {step === 2 && 'Answer your security question to set a new password'}
            {step === 3 && 'Password successfully reset!'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email Lookup */}
        {step === 1 && (
          <form onSubmit={handleLookup} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Verifying email...' : 'Continue to Security Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Security Question & New Password */}
        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                Security Question:
              </p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {securityQuestion}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Answer
              </label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Enter the answer you set during registration"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password (min 6 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Resetting password...' : 'Update & Reset Password'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 3: Success State */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-600">
              Your password has been securely updated. You can now log into your account using your new credentials.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
