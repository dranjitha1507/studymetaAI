import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { RevisionItem } from '../types';
import { REVISION_INTERVALS } from '../utils/pure_logic';

interface RevisionPlannerPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const RevisionPlannerPage: React.FC<RevisionPlannerPageProps> = ({
  onShowToast,
}) => {
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New revision form inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [nextDate, setNextDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const loadRevisions = async () => {
    try {
      const res = await api.getRevisions();
      setRevisions(res.revisions);
    } catch (err: any) {
      onShowToast('Failed to load revision items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, []);

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      onShowToast('Subject and topic are required', 'error');
      return;
    }

    try {
      const res = await api.createRevision({
        subject: subject.trim(),
        topic: topic.trim(),
        nextRevisionDate: nextDate,
        sourceType: 'custom',
      });

      setRevisions(prev => [res.revision, ...prev]);
      setShowAddModal(false);
      setSubject('');
      setTopic('');
      onShowToast('Scheduled revision added!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to add revision', 'error');
    }
  };

  const handleAdvanceRevision = async (id: string) => {
    try {
      const res = await api.advanceRevision(id);
      setRevisions(prev =>
        prev.map(r =>
          r.id === id
            ? {
                ...r,
                stage: res.stage,
                next_revision_date: res.next_revision_date,
                status: res.status as any,
                completed_dates: res.completed_dates,
              }
            : r
        )
      );
      onShowToast(
        res.status === 'completed'
          ? 'Topic fully consolidated to long-term memory!'
          : `Advanced to Stage ${res.stage}! Next review: ${res.next_revision_date}`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Failed to advance revision', 'error');
    }
  };

  const handleDeleteRevision = async (id: string) => {
    if (!confirm('Delete this revision item?')) return;
    try {
      await api.deleteRevision(id);
      setRevisions(prev => prev.filter(r => r.id !== id));
      onShowToast('Revision item removed', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete item', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const dueItems = revisions.filter(r => r.status === 'pending' && r.next_revision_date <= todayStr);
  const upcomingItems = revisions.filter(r => r.status === 'pending' && r.next_revision_date > todayStr);
  const completedItems = revisions.filter(r => r.status === 'completed');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Repeat className="w-7 h-7 text-indigo-600" />
            Revision Planner (Spaced Repetition)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Scientific Ebbinghaus forgetting curve intervals: 1d, 3d, 7d, 14d, 30d
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Topic</span>
        </button>
      </div>

      {/* Interval Reference Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {REVISION_INTERVALS.map(int => (
          <div key={int.stage} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Stage {int.stage}
            </span>
            <p className="text-base font-bold text-slate-800 mt-1">+{int.daysToAdd} Day{int.daysToAdd === 1 ? '' : 's'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{int.label}</p>
          </div>
        ))}
      </div>

      {/* Revisions Sections */}
      <div className="space-y-6">
        {/* Due Today / Overdue Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-sm font-bold text-slate-900">
                Due Today / Overdue ({dueItems.length})
              </h2>
            </div>
            <span className="text-xs text-rose-600 font-semibold">Priority Reviews</span>
          </div>

          {dueItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No revisions due today! You are completely up to date with your memory consolidation.
            </p>
          ) : (
            <div className="space-y-3">
              {dueItems.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white">
                        Stage {item.stage}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{item.topic}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Subject: <strong>{item.subject}</strong> • Due: <strong>{item.next_revision_date}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleAdvanceRevision(item.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Reviewed</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRevision(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Revisions Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Upcoming Revisions ({upcomingItems.length})
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Scheduled for Future</span>
          </div>

          {upcomingItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No upcoming revisions scheduled.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs"
                >
                  <div className="truncate flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px]">
                        Stage {item.stage}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{item.topic}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.subject} • Scheduled for: <strong className="text-slate-600">{item.next_revision_date}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdvanceRevision(item.id)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 rounded-lg text-xs transition-colors"
                    >
                      Review Early
                    </button>
                    <button
                      onClick={() => handleDeleteRevision(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mastered Section */}
        {completedItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Mastered Topics ({completedItems.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {completedItems.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950">{item.topic}</span>
                    <p className="text-[11px] text-emerald-700">{item.subject} • Stage 5 Completed</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRevision(item.id)}
                    className="p-1 text-emerald-600 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Topic to Spaced Repetition */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Schedule Revision Topic</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Topic / Concept *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Diels-Alder Stereochemistry"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Review Date
                </label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={e => setNextDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Schedule Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
