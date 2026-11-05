import React, { useState, useEffect, useRef } from 'react';
import {
  BotMessageSquare,
  Sparkles,
  Send,
  Plus,
  Trash2,
  BookOpen,
  MessageSquare,
  BrainCircuit,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import { TutorConversation, TutorMessage } from '../types';

interface AiTutorPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MODES = [
  {
    id: 'socratic',
    label: 'Socratic Method',
    desc: 'Guides through probing questions rather than spoon-feeding answers',
    icon: Lightbulb,
  },
  {
    id: 'eli5',
    label: "Explain Like I'm 5",
    desc: 'Intuitive real-world analogies and zero unnecessary jargon',
    icon: Sparkles,
  },
  {
    id: 'exam_drill',
    label: 'Exam Drill Coach',
    desc: 'Presents challenging test-format problems & grades rigorously',
    icon: BrainCircuit,
  },
  {
    id: 'concept_breakdown',
    label: 'Deep Masterclass',
    desc: 'First-principles breakdown with formulas, mechanisms, and traps',
    icon: BookOpen,
  },
] as const;

const SUBJECTS = [
  'Biology & Medicine',
  'Chemistry & Biochemistry',
  'Physics & Engineering',
  'Mathematics & Statistics',
  'Computer Science',
  'Economics & Finance',
  'History & Social Sciences',
  'Literature & Writing',
];

export const AiTutorPage: React.FC<AiTutorPageProps> = ({
  onShowToast,
}) => {
  const [conversations, setConversations] = useState<TutorConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [mode, setMode] = useState<'socratic' | 'eli5' | 'exam_drill' | 'concept_breakdown'>('socratic');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (res.conversations.length > 0 && !currentConvId) {
        selectConversation(res.conversations[0].id);
      }
    } catch (err: any) {
      onShowToast('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const selectConversation = async (id: string) => {
    try {
      const res = await api.getConversation(id);
      setCurrentConvId(res.conversation.id);
      setSubject(res.conversation.subject);
      setMode(res.conversation.mode);
      setMessages(res.conversation.messages || []);
    } catch (err: any) {
      onShowToast('Could not load conversation', 'error');
    }
  };

  const handleStartNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInputMessage('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistically add user message
    const tempUserMsg: TutorMessage = {
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await api.sendTutorMessage({
        conversationId: currentConvId,
        subject,
        mode,
        message: userText,
      });

      setCurrentConvId(res.conversationId);
      setMessages(res.messages);

      // Refresh conversations list to update titles/timestamps
      const listRes = await api.getConversations();
      setConversations(listRes.conversations);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to get tutor response', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConvId === id) {
        handleStartNewChat();
      }
      onShowToast('Conversation deleted', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete conversation', 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-in fade-in duration-200">
      {/* Left Chat History Drawer / Sidebar */}
      <div className="w-full md:w-72 bg-white rounded-3xl border border-slate-200 p-4 flex flex-col shrink-0 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tutor Chats</span>
          </div>
          <button
            onClick={handleStartNewChat}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-3">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No previous conversations.</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  currentConvId === conv.id
                    ? 'bg-indigo-50 text-indigo-900 font-semibold border border-indigo-100'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate pr-2 flex-1">
                  <p className="truncate">{conv.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{conv.subject}</p>
                </div>
                <button
                  onClick={e => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Learning Mode Quick Switch */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Pedagogical Mode:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`p-2 rounded-xl text-left text-[11px] font-medium border transition-all ${
                  mode === m.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-800">
              StudyMate AI Tutor
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              {MODES.find(m => m.id === mode)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Subject:</span>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BotMessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Your Personal AI Tutor is Ready</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Ask any concept, mechanism, problem step, or diagnostic drill in {subject}.
                </p>
              </div>

              {/* Starter questions */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
                {[
                  `Can you give me a Socratic drill on high-yield concepts?`,
                  `Explain the hardest topic in simple terms`,
                  `What are the most common exam traps to avoid?`,
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputMessage(promptText);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs transition-colors border border-slate-200/60"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-violet-600 text-white'
                    }`}
                  >
                    {isUser ? 'You' : 'AI'}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-line shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                AI
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 animate-spin" />
                <span>Formulating pedagogical response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={`Ask your ${subject} tutor anything...`}
              disabled={sending}
              className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-900 bg-white disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-100 transition-all disabled:opacity-40 shrink-0"
              aria-label="Send message to AI Tutor"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
