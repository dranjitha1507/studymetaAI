import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  CalendarDays,
  BotMessageSquare,
  FileText,
  HelpCircle,
  Layers,
  Repeat,
  Trash2,
  ExternalLink,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { ActivityLogItem } from '../types';
import { Modal } from '../components/Modal';

interface HistoryPageProps {
  onNavigate: (page: string, context?: any) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [historyItems, setHistoryItems] = useState<ActivityLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<ActivityLogItem | null>(null);

  const loadHistory = async () => {
    try {
      const res = await api.getHistory({
        search: search.trim() || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        sort: sortOrder,
      });
      setHistoryItems(res.history);
    } catch (err: any) {
      onShowToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [typeFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistory();
  };

  const handleOpenDetails = async (item: ActivityLogItem) => {
    setSelectedLog(item);
    setLoadingDetails(true);
    try {
      const res = await api.getHistoryDetails(item.id);
      setSelectedDetails(res.itemData);
    } catch (err: any) {
      onShowToast('Could not load record details', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteHistoryItem(deleteTarget.id);
      setHistoryItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (selectedLog?.id === deleteTarget.id) {
        setSelectedLog(null);
      }
      onShowToast('History record removed', 'info');
    } catch (err: any) {
      onShowToast('Failed to remove record', 'error');
    }
  };

  const handleRestoreOrReuse = (item: ActivityLogItem) => {
    if (item.activity_type === 'plan') {
      onNavigate('planner');
    } else if (item.activity_type === 'note') {
      onNavigate('notes');
    } else if (item.activity_type === 'quiz') {
      onNavigate('quiz');
    } else if (item.activity_type === 'flashcard') {
      onNavigate('flashcards');
    } else if (item.activity_type === 'chat') {
      onNavigate('tutor');
    } else if (item.activity_type === 'revision') {
      onNavigate('revision');
    }
  };

  const activityIcons: Record<string, any> = {
    plan: CalendarDays,
    chat: BotMessageSquare,
    note: FileText,
    quiz: HelpCircle,
    flashcard: Layers,
    revision: Repeat,
    auth: Sparkles,
  };

  const activityColors: Record<string, string> = {
    plan: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    chat: 'bg-violet-50 text-violet-700 border-violet-200',
    note: 'bg-blue-50 text-blue-700 border-blue-200',
    quiz: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    flashcard: 'bg-amber-50 text-amber-700 border-amber-200',
    revision: 'bg-rose-50 text-rose-700 border-rose-200',
    auth: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600" />
            Activity History & Archives
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete persistent log of your study plans, notes, quizzes, flashcards, and tutor chats
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search history by title or subject..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
            />
          </form>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => (prev === 'newest' ? 'oldest' : 'newest'))}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>

        {/* Activity Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'plan', label: 'Study Plans' },
            { id: 'chat', label: 'Tutor Chats' },
            { id: 'note', label: 'Notes' },
            { id: 'quiz', label: 'Quizzes' },
            { id: 'flashcard', label: 'Flashcards' },
            { id: 'revision', label: 'Revisions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                typeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Records List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {historyItems.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-3">
            <History className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm">No history records match your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyItems.map(item => {
              const Icon = activityIcons[item.activity_type] || History;
              const badgeStyle = activityColors[item.activity_type] || 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeStyle}`}>
                          {item.activity_type}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm truncate">{item.title}</h3>
                      </div>
                      {item.details && (
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{item.details}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleOpenDetails(item)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleRestoreOrReuse(item)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Open in dedicated tool"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Reopen / Reuse</span>
                    </button>

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      aria-label="Delete history record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setSelectedDetails(null);
          }}
          title={`History Item: ${selectedLog.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><strong>Activity:</strong> {selectedLog.activity_type.toUpperCase()}</p>
              <p><strong>Summary:</strong> {selectedLog.details}</p>
              <p><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}</p>
            </div>

            {loadingDetails ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading full records...</div>
            ) : selectedDetails ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Associated Study Record Content:
                </h4>

                {/* Plan schedule preview */}
                {selectedDetails.schedule && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedDetails.schedule.map((w: any) => (
                      <div key={w.week} className="p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold">Week {w.week}: {w.theme}</span>
                        <ul className="list-disc pl-4 mt-1 text-slate-600 space-y-0.5">
                          {w.tasks?.map((t: any) => (
                            <li key={t.id}>{t.title} ({t.completed ? 'Completed' : 'Pending'})</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note markdown preview */}
                {selectedDetails.content_markdown && (
                  <div className="p-4 rounded-xl border border-slate-200 text-xs whitespace-pre-line max-h-64 overflow-y-auto bg-slate-50 text-slate-800">
                    {selectedDetails.content_markdown}
                  </div>
                )}

                {/* Quiz attempt details */}
                {selectedDetails.score !== undefined && selectedDetails.total_questions !== undefined && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium">
                    Attempt Result: {selectedDetails.score} / {selectedDetails.total_questions} ({selectedDetails.percentage}%)
                  </div>
                )}

                {/* Tutor messages preview */}
                {selectedDetails.messages && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDetails.messages.map((m: any, i: number) => (
                      <div key={i} className={`p-2.5 rounded-xl text-xs ${m.role === 'user' ? 'bg-indigo-50 text-indigo-900' : 'bg-slate-100 text-slate-800'}`}>
                        <strong>{m.role === 'user' ? 'You' : 'AI Tutor'}:</strong> {m.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Flashcard cards preview */}
                {selectedDetails.cards && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedDetails.cards.map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded-xl border border-slate-200 text-xs">
                        <p className="font-bold text-slate-900">Q: {c.front}</p>
                        <p className="text-slate-600 mt-1">A: {c.back}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                The primary item has either been updated or completed.
              </p>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedLog(null);
                  setSelectedDetails(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedLog;
                  setSelectedLog(null);
                  setSelectedDetails(null);
                  handleRestoreOrReuse(target);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Open in Tool
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete History Record"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove this record from your history?
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
              {deleteTarget.title} ({new Date(deleteTarget.created_at).toLocaleDateString()})
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
