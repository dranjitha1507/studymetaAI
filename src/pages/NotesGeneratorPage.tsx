import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Copy,
  Check,
  Printer,
  Trash2,
  BookOpen,
  Tag,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { StudyNote } from '../types';

interface NotesGeneratorPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const NotesGeneratorPage: React.FC<NotesGeneratorPageProps> = ({
  onShowToast,
}) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generator inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'detailed' | 'summary' | 'cheat_sheet'>('detailed');
  const [customInstructions, setCustomInstructions] = useState('');

  // Preview before saving
  const [generatedPreview, setGeneratedPreview] = useState<any | null>(null);

  const loadNotes = async () => {
    try {
      const res = await api.getNotes();
      setNotes(res.notes);
      if (res.notes.length > 0 && !selectedNote) {
        setSelectedNote(res.notes[0]);
      }
    } catch (err: any) {
      onShowToast('Failed to load notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      onShowToast('Please provide both subject and topic', 'error');
      return;
    }

    setIsGenerating(true);
    setGeneratedPreview(null);
    try {
      const res = await api.generateNotes({
        subject: subject.trim(),
        topic: topic.trim(),
        depth,
        customInstructions: customInstructions.trim(),
      });
      setGeneratedPreview(res.note);
      onShowToast('Notes generated successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!generatedPreview) return;
    try {
      const res = await api.createNote({
        title: generatedPreview.title,
        subject: subject.trim(),
        topic: topic.trim(),
        contentMarkdown: generatedPreview.contentMarkdown,
        summary: generatedPreview.summary,
        keyTakeaways: generatedPreview.keyTakeaways,
        mnemonics: generatedPreview.mnemonics,
        tags: generatedPreview.tags,
      });

      setNotes(prev => [res.note, ...prev]);
      setSelectedNote(res.note);
      setGeneratedPreview(null);
      // Reset form
      setTopic('');
      setCustomInstructions('');
      onShowToast('Note saved to library & scheduled for spaced review!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save note', 'error');
    }
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        const remaining = notes.filter(n => n.id !== id);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
      }
      onShowToast('Note deleted', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete note', 'error');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Copied to clipboard!', 'info');
  };

  const displayedContent = generatedPreview || selectedNote;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            Notes Generator
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Synthesize any textbook chapter or syllabus unit into structured high-yield revision notes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Form & Saved Notes Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generator Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Generate New Note</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Molecular Biology"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Topic *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. DNA Replication Fork"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Depth Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['summary', 'detailed', 'cheat_sheet'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDepth(d)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        depth === d
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Emphasis / Specific Directives (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Highlight polymerase error rates and proofreading mechanisms"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Synthesizing notes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Notes with AI</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Notes List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Saved Notes ({notes.length})
            </h3>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No saved notes yet.</p>
              ) : (
                notes.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setGeneratedPreview(null);
                      setSelectedNote(n);
                    }}
                    className={`group flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedNote?.id === n.id && !generatedPreview
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <p className="truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.subject} • {n.topic}</p>
                    </div>
                    <button
                      onClick={e => handleDeleteNote(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Note Reader Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          {displayedContent ? (
            <div className="space-y-6">
              {/* Note Header & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                    {displayedContent.subject || subject}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">{displayedContent.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  {generatedPreview ? (
                    <button
                      onClick={handleSaveNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save to Library</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCopy(displayedContent.content_markdown || displayedContent.contentMarkdown)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Copy content"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Summary Callout Box */}
              {displayedContent.summary && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Executive Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
                    {displayedContent.summary}
                  </p>
                </div>
              )}

              {/* High-Yield Key Takeaways */}
              {displayedContent.key_takeaways?.length > 0 || displayedContent.keyTakeaways?.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    High-Yield Takeaways
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(displayedContent.key_takeaways || displayedContent.keyTakeaways).map((t: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Memory Mnemonics */}
              {displayedContent.mnemonics?.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    Memory Mnemonics
                  </h4>
                  <ul className="list-disc pl-4 text-xs text-amber-900 space-y-1">
                    {displayedContent.mnemonics.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Markdown Notes Body */}
              <div className="prose prose-slate max-w-none pt-4 border-t border-slate-100 text-sm leading-relaxed whitespace-pre-line text-slate-800">
                {displayedContent.content_markdown || displayedContent.contentMarkdown}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-400 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm">Select an existing note or generate a new one on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
