import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Target,
  Clock,
  ShieldQuestion,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { validatePassword } from '../utils/pure_logic';

interface ProfilePageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SECURITY_QUESTIONS = [
  'What was the name of your first elementary school?',
  'What is the name of your favorite book or subject?',
  'What was the model of your first car or computer?',
  'In what city were you born?',
  'What is your favorite academic subject?',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onShowToast,
}) => {
  const { user, updateProfile } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [targetExam, setTargetExam] = useState(user?.target_exam || '');
  const [learningStyle, setLearningStyle] = useState(user?.learning_style || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.daily_goal_minutes || 120);
  const [securityQuestion, setSecurityQuestion] = useState(user?.security_question || SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        target_exam: targetExam.trim(),
        learning_style: learningStyle,
        daily_goal_minutes: dailyGoalMinutes,
        securityQuestion,
        securityAnswer: securityAnswer.trim() || undefined,
      });
      setSecurityAnswer('');
      onShowToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      onShowToast(passCheck.error || 'Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('New passwords do not match', 'error');
      return;
    }

    setChangingPass(true);
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast('Password changed successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-indigo-600" />
            Student Profile & Academic Goals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal settings, curriculum targets, and account security
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card & Preferences (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Academic Details
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Exam / Academic Focus
              </label>
              <input
                type="text"
                value={targetExam}
                onChange={e => setTargetExam(e.target.value)}
                placeholder="e.g. MCAT, USMLE Step 1, GRE, AP Calculus"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Daily Study Goal
                </label>
                <select
                  value={dailyGoalMinutes}
                  onChange={e => setDailyGoalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 bg-white"
                >
                  <option value={45}>45 Minutes / day</option>
                  <option value={60}>1 Hour / day</option>
                  <option value={90}>1.5 Hours / day</option>
                  <option value={120}>2 Hours / day (Standard)</option>
                  <option value={180}>3 Hours / day (Intensive)</option>
                  <option value={240}>4 Hours / day (Full-time)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Learning Style
                </label>
                <input
                  type="text"
                  value={learningStyle}
                  onChange={e => setLearningStyle(e.target.value)}
                  placeholder="e.g. Active Recall & Visual Mnemonics"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>
            </div>

            {/* Security Question Update */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Account Recovery Security Question
              </label>
              <select
                value={securityQuestion}
                onChange={e => setSecurityQuestion(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
              >
                {SECURITY_QUESTIONS.map(q => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Leave blank to keep existing answer, or enter new secret answer"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-60"
                >
                  {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
