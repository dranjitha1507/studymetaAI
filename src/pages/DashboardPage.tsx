import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  CalendarDays,
  BotMessageSquare,
  FileText,
  HelpCircle,
  Layers,
  Repeat,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  History as HistoryIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StudyPlan, RevisionItem, ActivityLogItem, AnalyticsData } from '../types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [plansRes, revsRes, histRes, statsRes] = await Promise.all([
        api.getStudyPlans(),
        api.getRevisions(),
        api.getHistory({ sort: 'newest' }),
        api.getAnalytics(),
      ]);

      setPlans(plansRes.plans);
      setRevisions(revsRes.revisions);
      setActivities(histRes.history.slice(0, 5));
      setAnalytics(statsRes);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      onShowToast('Could not refresh dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activePlan = plans.find(p => p.status === 'active') || plans[0];

  // Calculate task counts for active plan
  const allTasks = activePlan?.schedule?.flatMap(w => w.tasks) || [];
  const completedTasks = allTasks.filter(t => t.completed).length;
  const planProgressPct = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  const handleToggleTask = async (taskId: string) => {
    if (!activePlan) return;
    const updatedSchedule = activePlan.schedule.map(week => ({
      ...week,
      tasks: week.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    }));

    try {
      await api.updatePlanTasks(activePlan.id, { schedule: updatedSchedule });
      setPlans(prev => prev.map(p => (p.id === activePlan.id ? { ...p, schedule: updatedSchedule } : p)));
      onShowToast('Study task updated!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleAdvanceRevision = async (revId: string) => {
    try {
      await api.advanceRevision(revId);
      onShowToast('Revision recorded! Spaced repetition updated.', 'success');
      loadDashboardData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to advance revision', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const dueRevisions = revisions.filter(r => r.status === 'pending' && r.next_revision_date <= todayStr);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Goal Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Target: {user?.target_exam || 'Academic Mastery'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to learn, {user?.name}?
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-xl">
              Daily goal: <strong className="text-white">{user?.daily_goal_minutes || 120} minutes</strong>. Every active recall session sharpens your long-term retention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('tutor')}
              className="px-5 py-3 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <BotMessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Study Planner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Streak</p>
            <p className="text-2xl font-bold text-slate-800">{analytics?.streakDays || 0} Days</p>
          </div>
        </div>

        {/* Quiz Avg */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quiz Accuracy</p>
            <p className="text-2xl font-bold text-slate-800">
              {analytics?.quizPerformance.averagePercentage || 0}%
            </p>
          </div>
        </div>

        {/* Flashcard Mastery */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cards Mastered</p>
            <p className="text-2xl font-bold text-slate-800">
              {analytics?.flashcards.totalMastered || 0}
            </p>
          </div>
        </div>

        {/* Due Revisions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Revisions</p>
            <p className="text-2xl font-bold text-slate-800">{dueRevisions.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Launch Tools Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Quick Launch Generators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('planner')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm text-left transition-all group"
          >
            <CalendarDays className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-bold text-slate-800">Study Plan</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Syllabus roadmap</p>
          </button>

          <button
            onClick={() => onNavigate('tutor')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-sm text-left transition-all group"
          >
            <BotMessageSquare className="w-6 h-6 text-violet-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-bold text-slate-800">AI Tutor</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Socratic dialogue</p>
          </button>

          <button
            onClick={() => onNavigate('notes')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm text-left transition-all group"
          >
            <FileText className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-bold text-slate-800">Notes Maker</p>
            <p className="text-[11px] text-slate-500 mt-0.5">High-yield points</p>
          </button>

          <button
            onClick={() => onNavigate('quiz')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm text-left transition-all group"
          >
            <HelpCircle className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-bold text-slate-800">Quiz Drills</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Adaptive questions</p>
          </button>

          <button
            onClick={() => onNavigate('flashcards')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-sm text-left transition-all group"
          >
            <Layers className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-bold text-slate-800">Flashcards</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active recall deck</p>
          </button>

          <button
            onClick={() => onNavigate('revision')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-sm text-left transition-all group"
          >
            <Repeat className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-bold text-slate-800">Spaced Review</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ebbinghaus dates</p>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Plan & Due Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Study Plan Widget (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {activePlan ? activePlan.title : 'No Active Study Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activePlan ? `${activePlan.subject} • ${activePlan.duration_weeks} Weeks` : 'Generate a plan to start structured tracking'}
                  </p>
                </div>
              </div>

              {activePlan && (
                <button
                  onClick={() => onNavigate('planner')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <span>View Full Schedule</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activePlan ? (
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Completion Progress</span>
                    <span className="text-indigo-600">{planProgressPct}% ({completedTasks}/{allTasks.length} tasks)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${planProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* Pending tasks checklist */}
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Upcoming Tasks (Click checkmark to toggle)
                  </p>
                  {allTasks.slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        task.completed
                          ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-indigo-500'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <span className={`text-xs sm:text-sm flex-1 ${task.completed ? 'line-through' : 'font-medium'}`}>
                        {task.title}
                      </span>
                      {task.estHours && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                          {task.estHours}h
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-slate-500">You don't have an active study roadmap yet.</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Create First Study Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Spaced Revisions Due Widget (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Spaced Revisions</h3>
              </div>
              <button
                onClick={() => onNavigate('revision')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                All ({revisions.length})
              </button>
            </div>

            {revisions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No topics currently in spaced repetition. Adding notes or taking quizzes automatically adds revision items!
              </div>
            ) : (
              <div className="space-y-2.5">
                {revisions.slice(0, 4).map(rev => {
                  const isDue = rev.status === 'pending' && rev.next_revision_date <= todayStr;
                  return (
                    <div
                      key={rev.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        isDue ? 'bg-rose-50/70 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <p className="font-semibold truncate">{rev.topic}</p>
                        <p className="text-[11px] text-slate-500">
                          {rev.subject} • Stage {rev.stage} ({rev.next_revision_date})
                        </p>
                      </div>

                      {rev.status === 'pending' ? (
                        <button
                          onClick={() => handleAdvanceRevision(rev.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shrink-0"
                        >
                          Reviewed
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 shrink-0">Done</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Intervals: 1d, 3d, 7d, 14d, 30d</span>
            <button
              onClick={() => onNavigate('revision')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Open Planner
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity History</h3>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recent activity recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map(act => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] shrink-0">
                    {act.activity_type}
                  </span>
                  <span className="font-medium text-slate-800 truncate">{act.title}</span>
                  {act.details && (
                    <span className="hidden sm:inline text-slate-400 truncate">— {act.details}</span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {new Date(act.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
