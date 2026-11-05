import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { Quiz, QuizAttempt, QuizQuestion } from '../types';

interface QuizGeneratorPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const QuizGeneratorPage: React.FC<QuizGeneratorPageProps> = ({
  onShowToast,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generator inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(5);

  // Quiz Taking State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submittedAttempt, setSubmittedAttempt] = useState<QuizAttempt | null>(null);

  const loadQuizData = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        api.getQuizzes(),
        api.getRecentAttempts(),
      ]);
      setQuizzes(qRes.quizzes);
      setRecentAttempts(aRes.attempts);
      if (qRes.quizzes.length > 0 && !activeQuiz) {
        startQuiz(qRes.quizzes[0]);
      }
    } catch (err: any) {
      onShowToast('Failed to load quiz data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizData();
  }, []);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      onShowToast('Please provide subject and topic', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const genRes = await api.generateQuiz({
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        questionCount,
      });

      // Save generated quiz
      const saveRes = await api.createQuiz({
        title: genRes.quiz.title,
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        questions: genRes.quiz.questions,
      });

      setQuizzes(prev => [saveRes.quiz, ...prev]);
      startQuiz(saveRes.quiz);
      // Reset form
      setTopic('');
      onShowToast('Quiz generated & ready to take!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Quiz generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmittedAttempt(null);
  };

  const handleSelectOption = (optIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < activeQuiz.questions.length) {
      if (!confirm(`You have only answered ${answeredCount} of ${activeQuiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    try {
      const res = await api.recordQuizAttempt(activeQuiz.id, userAnswers);
      setSubmittedAttempt(res.attempt);
      setRecentAttempts(prev => [res.attempt, ...prev]);
      onShowToast(`Quiz completed! You scored ${res.attempt.percentage}%`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit quiz attempt', 'error');
    }
  };

  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this quiz?')) return;
    try {
      await api.deleteQuiz(id);
      setQuizzes(prev => prev.filter(q => q.id !== id));
      if (activeQuiz?.id === id) {
        const remaining = quizzes.filter(q => q.id !== id);
        if (remaining.length > 0) startQuiz(remaining[0]);
        else setActiveQuiz(null);
      }
      onShowToast('Quiz deleted', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete quiz', 'error');
    }
  };

  const currentQ = activeQuiz?.questions[currentQuestionIndex];
  const progressPct = activeQuiz ? Math.round(((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-indigo-600" />
            Quiz Generator & Drills
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate multiple-choice diagnostic exams with instant feedback and distractor explanations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Generator & Quiz Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generator Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Create New Quiz</h2>
            </div>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Pharmacology"
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
                  placeholder="e.g. Beta-Blockers & Antihypertensives"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard (Exam-level)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={e => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 bg-white"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Writing test items...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Quizzes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quiz Library ({quizzes.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {quizzes.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No quizzes created yet.</p>
              ) : (
                quizzes.map(q => (
                  <div
                    key={q.id}
                    onClick={() => startQuiz(q)}
                    className={`group flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeQuiz?.id === q.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <p className="truncate">{q.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {q.subject} • {q.difficulty} • {q.questions?.length} Qs
                      </p>
                    </div>
                    <button
                      onClick={e => handleDeleteQuiz(q.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                      aria-label="Delete quiz"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quiz Taking or Review Area (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          {activeQuiz ? (
            !submittedAttempt ? (
              /* Active Quiz Taking Interface */
              <div className="space-y-6">
                {/* Header & Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">
                      Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      {activeQuiz.difficulty}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Question Prompt */}
                {currentQ && (
                  <div className="space-y-5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {currentQ.question}
                    </h3>

                    {/* Options list */}
                    <div className="space-y-3">
                      {currentQ.options.map((option, optIdx) => {
                        const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-500'
                                : 'bg-slate-50/50 border-slate-200 text-slate-800 hover:bg-slate-100/70'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-slate-300 text-slate-500 bg-white'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation & Submit controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit & Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Review & Score Breakdown State */
              <div className="space-y-6">
                {/* Score Summary Box */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-slate-200 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-800 text-xs font-bold shadow-xs">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Assessment Completed</span>
                  </div>

                  <p className="text-3xl font-extrabold text-slate-900">
                    Score: {submittedAttempt.score} / {submittedAttempt.total_questions} ({submittedAttempt.percentage}%)
                  </p>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    {submittedAttempt.percentage >= 70
                      ? 'Solid grasp of core principles! Review missed items below.'
                      : 'Review the explanations below and schedule this topic for spaced revision.'}
                  </p>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => startQuiz(activeQuiz)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Retake Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Explanations List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Detailed Question Review & Explanations:
                  </h4>

                  {activeQuiz.questions.map((q, idx) => {
                    const userChoice = submittedAttempt.user_answers[idx];
                    const isCorrect = userChoice === q.correctIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-3 ${
                          isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <span className="font-bold text-slate-900">Q{idx + 1}: {q.question}</span>
                          </div>
                        </div>

                        {/* Options comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Your Answer:</span>
                            <span className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                              {userChoice !== undefined ? q.options[userChoice] : 'Not answered'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Correct Answer:</span>
                            <span className="text-emerald-700 font-semibold">
                              {q.options[q.correctIndex]}
                            </span>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="p-3 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                          <strong className="text-slate-900 block mb-0.5">Explanation:</strong>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-24 text-slate-400 space-y-3">
              <HelpCircle className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm">Create a quiz on the left or select an existing one to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
