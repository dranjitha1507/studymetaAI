import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  FileText,
  HelpCircle,
  Layers,
  Repeat,
  History,
  CheckCircle2,
  Lock,
  ChevronRight,
  BarChart3,
  BookOpen,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onQuickDemoLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onQuickDemoLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'planner' | 'tutor' | 'quiz'>('tutor');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 border-b border-slate-200">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs animate-in fade-in slide-in-from-top-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Cognitive Science Powered Study Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
              Master Any Subject with{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 bg-clip-text text-transparent">
                StudyMate AI
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Replace passive reading with active recall, intelligent study schedules, personalized Socratic tutoring, dynamic quizzes, and automated spaced repetition.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Start Studying Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onQuickDemoLogin}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Try Demo Account</span>
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="w-full sm:w-auto px-5 py-3.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
              >
                Already have an account? Log in
              </button>
            </div>

            {/* Feature Pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                SQLite Persistent History
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                100% Isolated Student Records
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Socratic & ELI5 AI Tutor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Spaced Repetition Scheduler
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demo Preview */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Explore Your Intelligent Study Arsenal
            </h2>
            <p className="mt-2 text-slate-600">
              Experience how StudyMate AI transforms complex syllabi into mastery.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('tutor')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'tutor'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Tutor Dialogue
              </button>
              <button
                onClick={() => setActiveTab('planner')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'planner'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Study Roadmap
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Diagnostic Quiz
              </button>
            </div>
          </div>

          {/* Tab Content Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {activeTab === 'tutor' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    You
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 text-sm shadow-xs">
                    How does the sodium-potassium pump create membrane potential?
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    AI
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-indigo-100 text-sm shadow-xs space-y-2">
                    <p className="font-medium text-indigo-900">
                      Great question! Let’s trace the electrogenic stoichiometry:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs sm:text-sm">
                      <li>The pump hydrolyzes <strong>1 ATP</strong> molecule per cycle.</li>
                      <li>It exports <strong>3 Na⁺ ions out</strong> of the cell against their gradient.</li>
                      <li>It imports <strong>2 K⁺ ions in</strong>.</li>
                      <li>Notice the net imbalance: each cycle pumps out 3 positive charges for every 2 positive charges brought in, leaving the interior negatively charged!</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'planner' && (
              <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-sm">MCAT Biochemistry Roadmap - Week 1</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    67% Completed
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="line-through text-slate-400">Amino acid structures & pKa titration curves</span>
                    <span className="ml-auto text-xs text-slate-400">2.5 hrs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="line-through text-slate-400">Enzyme kinetics: Michaelis-Menten & Lineweaver-Burk</span>
                    <span className="ml-auto text-xs text-slate-400">3 hrs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-2 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <div className="w-4 h-4 rounded border-2 border-indigo-500 shrink-0" />
                    <span className="text-slate-800 font-medium">Krebs cycle intermediates & oxidative phosphorylation</span>
                    <span className="ml-auto text-xs text-indigo-600 font-semibold">Today (2 hrs)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Question 1 of 5</span>
                  <span className="text-indigo-600 font-semibold">Difficulty: Medium</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Which factor shifts hemoglobin's oxygen dissociation curve to the right (Bohr effect)?
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 bg-slate-50/50">
                    A) Increased blood pH (alkalosis)
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-400 bg-emerald-50 text-xs sm:text-sm text-emerald-900 font-medium flex items-center justify-between">
                    <span>B) Increased [H⁺] (lower pH) and elevated 2,3-BPG</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 bg-slate-50/50">
                    C) Decreased body temperature
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Complete Feature Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Everything You Need for Academic Excellence
            </h2>
            <p className="mt-3 text-slate-600">
              Built from scratch to adhere to real learning psychology principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Intelligent Study Planner</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Generates a day-by-day customized schedule based on your target exam date, daily available hours, and weakness areas. Check off tasks as you progress.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Conversational AI Tutor</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Choose between Socratic inquiry, Explain Like I'm 5, Exam Drill, or Concept Masterclass modes. Retains full conversation history across sessions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Notes Generator</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Generate structured revision notes with summaries, key takeaways, mnemonics, and markdown tables. Copy or export anytime.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Adaptive Quiz Maker</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Test yourself with randomized multiple choice exams. Receive immediate score feedback and comprehensive distractor explanations.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Active Flashcards</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Flip through digital flashcards with keyboard shortcuts, self-rate mastery, and track cards that need further repetition.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ebbinghaus Revision Planner</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Automatically schedules follow-up reviews at 1-day, 3-day, 7-day, 14-day, and 30-day intervals so information enters long-term memory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The StudyMate AI Cognitive Protocol
            </h2>
            <p className="mt-2 text-slate-600">
              Why high performers learn 3x faster with our structured workflow.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm shrink-0">
                1
              </span>
              <div>
                <h4 className="font-semibold text-slate-900">Structure with the Study Planner</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Eliminate decision fatigue. Every morning your daily study goals and estimated study hours are mapped out.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm shrink-0">
                2
              </span>
              <div>
                <h4 className="font-semibold text-slate-900">Engage in Socratic Deep Inquiry</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Instead of copying notes passively, ask the AI Tutor to challenge your mental model with edge cases and intuitive analogies.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm shrink-0">
                3
              </span>
              <div>
                <h4 className="font-semibold text-slate-900">Test via Active Recall & Flashcards</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Retrieve knowledge under test conditions with generated quizzes and flashcards. Scores are tracked in your real-time analytics.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm shrink-0">
                4
              </span>
              <div>
                <h4 className="font-semibold text-slate-900">Lock in Retention with Spaced Intervals</h4>
                <p className="text-sm text-slate-600 mt-1">
                  The Revision Planner surfaces topics right as you are about to forget them, flattening the forgetting curve permanently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="p-4 rounded-xl bg-white border border-slate-200 group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between">
                <span>Is my study data isolated and private?</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Yes. Every single user account in StudyMate AI has dedicated SQLite records scoped strictly to your account ID. Other students cannot access your notes, quizzes, or chat history.
              </p>
            </details>

            <details className="p-4 rounded-xl bg-white border border-slate-200 group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between">
                <span>Does my history persist after logging out?</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                All study plans, generated notes, quizzes, quiz scores, flashcards, tutor conversations, and revision schedules persist permanently in SQLite.
              </p>
            </details>

            <details className="p-4 rounded-xl bg-white border border-slate-200 group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between">
                <span>What if I forget my password?</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                StudyMate AI includes a built-in security question recovery workflow. You can verify your security answer to immediately reset your password without losing your study materials.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-white border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-700">StudyMate AI — Cognitive Science Study Companion</p>
        <p>Built with SQLite persistence, session isolation, and server-side Gemini intelligence.</p>
      </footer>
    </div>
  );
};
