import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Layers,
  CalendarDays,
  FileText,
  HelpCircle,
  Repeat,
  CheckCircle2,
  TrendingUp,
  Clock,
  PieChart,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProgressAnalyticsPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProgressAnalyticsPage: React.FC<ProgressAnalyticsPageProps> = ({
  onShowToast,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err: any) {
      onShowToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalArtifacts = data
    ? data.counts.plans +
      data.counts.notes +
      data.counts.quizzes +
      data.counts.decks +
      data.counts.conversations +
      data.counts.revisions
    : 0;

  // Maximum count for scaling past 7-day bars
  const maxDayCount = Math.max(...(data?.activityTrends?.map(d => d.count) || [1]), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Progress Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time insights synthesized from your personal SQLite study records
          </p>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Streak</p>
            <p className="text-2xl font-bold text-slate-900">{data?.streakDays || 0} Days</p>
            <p className="text-[11px] text-amber-600 font-medium">Consecutive learning</p>
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Quiz Score</p>
            <p className="text-2xl font-bold text-slate-900">
              {data?.quizPerformance.averagePercentage || 0}%
            </p>
            <p className="text-[11px] text-indigo-600 font-medium">
              {data?.quizPerformance.attempts || 0} attempts completed
            </p>
          </div>
        </div>

        {/* Flashcard Mastery */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card Mastery</p>
            <p className="text-2xl font-bold text-slate-900">
              {data?.flashcards.masteryRate || 0}%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              {data?.flashcards.totalMastered || 0} of {data?.flashcards.totalCards || 0} cards
            </p>
          </div>
        </div>

        {/* Total Study Items */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Assets</p>
            <p className="text-2xl font-bold text-slate-900">{totalArtifacts}</p>
            <p className="text-[11px] text-purple-600 font-medium">Saved in database</p>
          </div>
        </div>
      </div>

      {/* Grid: 7-Day Volume & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Past 7-Day Activity Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">7-Day Study Activity Volume</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Daily Actions</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Tracks completed study tasks, notes, quizzes, and revisions over the past week.
            </p>

            {/* Custom Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
              {data?.activityTrends?.map(day => {
                const heightPct = Math.max(12, Math.round((day.count / maxDayCount) * 100));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                      {day.count}
                    </span>
                    <div className="w-full max-w-[36px] bg-indigo-50 rounded-t-xl overflow-hidden h-32 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-xl group-hover:brightness-110 transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Daily goal: <strong>{user?.daily_goal_minutes || 120} min</strong></span>
            <span className="text-emerald-600 font-semibold">Active Streak Running</span>
          </div>
        </div>

        {/* Subject Breakdown Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-600" />
                <h2 className="text-base font-bold text-slate-900">Subject Distribution</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Focus Areas</span>
            </div>

            {data?.subjectDistribution && Object.keys(data.subjectDistribution).length > 0 ? (
              <div className="space-y-4 pt-2">
                {Object.entries(data.subjectDistribution).map(([subj, count], idx) => {
                  const colors = ['bg-indigo-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
                  const barColor = colors[idx % colors.length];
                  return (
                    <div key={subj} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{subj}</span>
                        <span>{count} records</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${Math.min(100, count * 20)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No subjects recorded yet. Create notes, plans, or quizzes to see distribution.
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Target Exam: <strong className="text-slate-700">{user?.target_exam || 'General Studies'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
