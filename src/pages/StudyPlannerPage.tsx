import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  Plus,
  CheckCircle2,
  Trash2,
  Download,
  Share2,
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
import { StudyPlan, PlanWeek, PlanTask } from '../types';

interface StudyPlannerPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const StudyPlannerPage: React.FC<StudyPlannerPageProps> = ({
  onShowToast,
}) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form inputs for generating plan
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [hoursPerDay, setHoursPerDay] = useState(2.5);
  const [goals, setGoals] = useState('');
  const [topics, setTopics] = useState('');

  // Generated preview before saving
  const [generatedPreview, setGeneratedPreview] = useState<any | null>(null);

  const loadPlans = async () => {
    try {
      const res = await api.getStudyPlans();
      setPlans(res.plans);
      if (res.plans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(res.plans[0].id);
      }
    } catch (err: any) {
      onShowToast('Failed to load study plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      onShowToast('Please provide a subject', 'error');
      return;
    }

    setIsGenerating(true);
    setGeneratedPreview(null);
    try {
      const res = await api.generateStudyPlan({
        subject: subject.trim(),
        examDate,
        durationWeeks,
        hoursPerDay,
        goals: goals.trim() || 'Comprehensive exam preparation',
        topics: topics.trim(),
      });
      setGeneratedPreview(res.plan);
      onShowToast('Study plan generated! Review and save below.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedPlan = async () => {
    if (!generatedPreview) return;
    try {
      const res = await api.createStudyPlan({
        title: generatedPreview.title,
        subject: subject.trim(),
        examDate,
        durationWeeks,
        hoursPerDay,
        goals: goals.trim(),
        schedule: generatedPreview.weeks,
      });

      setPlans(prev => [res.plan, ...prev]);
      setSelectedPlanId(res.plan.id);
      setGeneratedPreview(null);
      setShowCreateModal(false);
      // Reset form
      setSubject('');
      setGoals('');
      setTopics('');
      onShowToast('Study plan saved and activated!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save plan', 'error');
    }
  };

  const handleToggleTask = async (weekIndex: number, taskId: string) => {
    const currentPlan = plans.find(p => p.id === selectedPlanId);
    if (!currentPlan) return;

    const updatedSchedule = currentPlan.schedule.map((week, wIdx) => {
      if (wIdx !== weekIndex) return week;
      return {
        ...week,
        tasks: week.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
      };
    });

    try {
      await api.updatePlanTasks(currentPlan.id, { schedule: updatedSchedule });
      setPlans(prev => prev.map(p => (p.id === currentPlan.id ? { ...p, schedule: updatedSchedule } : p)));
    } catch (err: any) {
      onShowToast('Failed to update task', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this study plan?')) return;
    try {
      await api.deleteStudyPlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      if (selectedPlanId === planId) {
        const remaining = plans.filter(p => p.id !== planId);
        setSelectedPlanId(remaining.length > 0 ? remaining[0].id : null);
      }
      onShowToast('Study plan deleted', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete plan', 'error');
    }
  };

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  // Print/Export
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            Study Planner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Design personalized, day-by-day syllabi powered by cognitive science
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Study Plan</span>
        </button>
      </div>

      {/* Plan Selector & Actions if plans exist */}
      {plans.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2">
              Plans:
            </span>
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedPlanId === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
            {currentPlan && (
              <button
                onClick={() => handleDeletePlan(currentPlan.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete this plan"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main View: Current Plan Schedule */}
      {currentPlan ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                {currentPlan.subject}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">{currentPlan.title}</h2>
              {currentPlan.goals && (
                <p className="text-sm text-slate-600 mt-1 max-w-2xl">{currentPlan.goals}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="text-center">
                <span className="block font-bold text-base text-slate-800">
                  {currentPlan.duration_weeks}
                </span>
                <span>Weeks</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <span className="block font-bold text-base text-slate-800">
                  {currentPlan.hours_per_day}h
                </span>
                <span>Daily</span>
              </div>
              {currentPlan.exam_date && (
                <>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="block font-bold text-base text-slate-800">
                      {currentPlan.exam_date}
                    </span>
                    <span>Target Date</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Schedule Breakdown */}
          <div className="space-y-6">
            {currentPlan.schedule.map((week, weekIdx) => {
              const weekCompleted = week.tasks.filter(t => t.completed).length;
              const weekTotal = week.tasks.length;
              const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

              return (
                <div key={week.week} className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50/80 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                        Week {week.week}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800">{week.theme}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {weekCompleted} of {weekTotal} tasks ({weekPct}%)
                    </span>
                  </div>

                  <div className="p-4 space-y-2 bg-white">
                    {week.tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(weekIdx, task.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          task.completed
                            ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={`Toggle task completion: ${task.title}`}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 text-xs sm:text-sm">
                          <span className={task.completed ? 'line-through' : 'font-medium'}>
                            {task.title}
                          </span>
                        </div>
                        {task.estHours && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium shrink-0">
                            ~{task.estHours} hrs
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Study Plans Yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Give StudyMate your subject and exam date, and our AI will engineer an optimized weekly roadmap.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate First Study Plan</span>
          </button>
        </div>
      )}

      {/* Modal: Create / Generate Study Plan */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">AI Study Plan Generator</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGeneratedPreview(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {!generatedPreview ? (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject / Course Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Organic Chemistry II, AP US History, USMLE Step 1"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Exam Date
                      </label>
                      <input
                        type="date"
                        value={examDate}
                        onChange={e => setExamDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Duration (Weeks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={durationWeeks}
                        onChange={e => setDurationWeeks(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Hours / Day
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0.5}
                        max={12}
                        value={hoursPerDay}
                        onChange={e => setHoursPerDay(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Main Learning Goals
                    </label>
                    <input
                      type="text"
                      value={goals}
                      onChange={e => setGoals(e.target.value)}
                      placeholder="e.g. Score 90%+ on final exam and master reaction mechanisms"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Key Topics / Weak Areas (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={topics}
                      onChange={e => setTopics(e.target.value)}
                      placeholder="e.g. SN1/SN2 kinetics, aldol condensation, spectroscopy interpretation"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Generating pedagogical schedule with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Generate Plan Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Preview of generated plan */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                    <h4 className="font-bold text-indigo-950 text-base">{generatedPreview.title}</h4>
                    <p className="text-xs text-indigo-900 mt-1">{generatedPreview.summary}</p>

                    {generatedPreview.studyTips && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 space-y-1">
                        <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                          Cognitive Tips:
                        </span>
                        <ul className="list-disc pl-4 text-xs text-indigo-900 space-y-0.5">
                          {generatedPreview.studyTips.map((tip: string, i: number) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Generated Schedule Preview ({generatedPreview.weeks?.length} Weeks):
                    </p>
                    {generatedPreview.weeks?.map((w: any) => (
                      <div key={w.week} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <span className="font-bold text-slate-800">Week {w.week}: {w.theme}</span>
                        <ul className="mt-1.5 list-disc pl-4 space-y-1 text-slate-600">
                          {w.tasks?.map((t: any) => (
                            <li key={t.id}>{t.title} (~{t.estHours} hrs)</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setGeneratedPreview(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGeneratedPlan}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Activate Plan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
