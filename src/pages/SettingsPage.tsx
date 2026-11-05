import React, { useState } from 'react';
import {
  Settings,
  Download,
  Trash2,
  Bell,
  Volume2,
  Sparkles,
  LogOut,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const { logout, user } = useAuth();
  const [soundEffects, setSoundEffects] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [defaultTutorTone, setDefaultTutorTone] = useState<'socratic' | 'eli5' | 'exam_drill'>('socratic');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleExportData = () => {
    api.exportUserData();
    onShowToast('Preparing your JSON study archive download...', 'info');
  };

  const handleConfirmClearHistory = async () => {
    setClearing(true);
    try {
      await api.clearHistory();
      setShowClearModal(false);
      onShowToast('Activity history cleared successfully', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-600" />
            Application Settings & Privacy
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure learning defaults, data export, notifications, and security
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Learning & AI Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI & Study Defaults
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default AI Tutor Pedagogy
              </label>
              <select
                value={defaultTutorTone}
                onChange={e => {
                  setDefaultTutorTone(e.target.value as any);
                  onShowToast('Default tutor mode saved', 'success');
                }}
                className="w-full sm:w-80 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800"
              >
                <option value="socratic">Socratic Inquiry (Guided Questions)</option>
                <option value="eli5">Explain Like I'm 5 (Visual Analogies)</option>
                <option value="exam_drill">Exam Coach (Strict Standardized Drills)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">Study Sound Effects</p>
                <p className="text-xs text-slate-500">Auditory feedback on quiz completion and card ratings</p>
              </div>
              <button
                type="button"
                onClick={() => setSoundEffects(!soundEffects)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  soundEffects ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
                aria-label="Toggle study sounds"
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">Daily Study Reminders</p>
                <p className="text-xs text-slate-500">Notification banners for due spaced repetition reviews</p>
              </div>
              <button
                type="button"
                onClick={() => setDailyReminders(!dailyReminders)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  dailyReminders ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
                aria-label="Toggle daily reminders"
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Portability & Backup */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            Data Backup & Portability
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Download your full personal study database archive containing all your study plans, notes, quizzes, flashcards, conversation logs, and revision progress as a JSON bundle.
          </p>

          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Personal Study Archive (JSON)</span>
          </button>
        </div>

        {/* Danger Zone: Clear History & Account Actions */}
        <div className="bg-rose-50/50 rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-rose-900 pb-3 border-b border-rose-200/60">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold">Account Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-rose-950">Clear Activity Logs</p>
              <p className="text-xs text-rose-800/80">
                Removes all timestamped activity history while preserving your core notes and study plans.
              </p>
            </div>

            <button
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto shrink-0"
            >
              Clear Logs
            </button>
          </div>

          <div className="pt-4 border-t border-rose-200/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Sign Out of Session</p>
              <p className="text-xs text-slate-500">Securely invalidate current session token</p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showClearModal && (
        <Modal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          title="Clear Activity History"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to clear your activity logs? This action will erase your recorded audit history, but your created study plans, notes, and flashcard decks will remain safe.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleConfirmClearHistory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-60"
              >
                {clearing ? 'Clearing...' : 'Yes, Clear Logs'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
