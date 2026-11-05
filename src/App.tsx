import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Toast, ToastMessage } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { AiTutorPage } from './pages/AiTutorPage';
import { NotesGeneratorPage } from './pages/NotesGeneratorPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { RevisionPlannerPage } from './pages/RevisionPlannerPage';
import { ProgressAnalyticsPage } from './pages/ProgressAnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

function MainApp() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [pendingRevisionsCount, setPendingRevisionsCount] = useState(0);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync route on auth change
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register' || currentPage === 'forgot-password') {
          setCurrentPage('dashboard');
        }
        // Fetch streak & pending revisions
        api.getAnalytics().then(res => {
          setStreakDays(res.streakDays);
        }).catch(() => {});

        api.getRevisions().then(res => {
          const today = new Date().toISOString().split('T')[0];
          const due = res.revisions.filter(r => r.status === 'pending' && r.next_revision_date <= today);
          setPendingRevisionsCount(due.length);
        }).catch(() => {});
      } else {
        const protectedPages = [
          'dashboard', 'planner', 'tutor', 'notes', 'quiz',
          'flashcards', 'revision', 'analytics', 'history', 'profile', 'settings'
        ];
        if (protectedPages.includes(currentPage)) {
          setCurrentPage('login');
        }
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleQuickDemoLogin = async () => {
    try {
      await login('demo@studymate.ai', 'studymate123');
      setCurrentPage('dashboard');
      addToast('Welcome to StudyMate Demo! All records are pre-loaded and live.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Demo login failed', 'error');
    }
  };

  // Protected route check
  const isProtectedPage = [
    'dashboard', 'planner', 'tutor', 'notes', 'quiz',
    'flashcards', 'revision', 'analytics', 'history', 'profile', 'settings'
  ].includes(currentPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-bounce shadow-lg shadow-indigo-200">
          <span className="text-xl font-black">S</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Initializing StudyMate AI...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        streakDays={streakDays}
      />

      {/* Main Layout */}
      <div className="flex-1 flex w-full">
        {/* Sidebar for authenticated dashboard pages */}
        {isAuthenticated && isProtectedPage && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            pendingRevisionsCount={pendingRevisionsCount}
          />
        )}

        {/* Page Content Viewport */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto ${!isAuthenticated || !isProtectedPage ? 'p-0 sm:p-0 lg:p-0 max-w-none' : ''}`}>
          {currentPage === 'landing' && (
            <LandingPage
              onNavigate={setCurrentPage}
              onQuickDemoLogin={handleQuickDemoLogin}
            />
          )}

          {currentPage === 'login' && (
            <LoginPage
              onNavigate={setCurrentPage}
              onSuccess={() => {
                setCurrentPage('dashboard');
                addToast('Signed in successfully!', 'success');
              }}
            />
          )}

          {currentPage === 'register' && (
            <RegisterPage
              onNavigate={setCurrentPage}
              onSuccess={() => {
                setCurrentPage('dashboard');
                addToast('Account created! Welcome to StudyMate AI.', 'success');
              }}
            />
          )}

          {currentPage === 'forgot-password' && (
            <ForgotPasswordPage onNavigate={setCurrentPage} />
          )}

          {currentPage === 'dashboard' && isAuthenticated && (
            <DashboardPage
              onNavigate={setCurrentPage}
              onShowToast={addToast}
            />
          )}

          {currentPage === 'planner' && isAuthenticated && (
            <StudyPlannerPage onShowToast={addToast} />
          )}

          {currentPage === 'tutor' && isAuthenticated && (
            <AiTutorPage onShowToast={addToast} />
          )}

          {currentPage === 'notes' && isAuthenticated && (
            <NotesGeneratorPage onShowToast={addToast} />
          )}

          {currentPage === 'quiz' && isAuthenticated && (
            <QuizGeneratorPage onShowToast={addToast} />
          )}

          {currentPage === 'flashcards' && isAuthenticated && (
            <FlashcardsPage onShowToast={addToast} />
          )}

          {currentPage === 'revision' && isAuthenticated && (
            <RevisionPlannerPage onShowToast={addToast} />
          )}

          {currentPage === 'analytics' && isAuthenticated && (
            <ProgressAnalyticsPage onShowToast={addToast} />
          )}

          {currentPage === 'history' && isAuthenticated && (
            <HistoryPage
              onNavigate={setCurrentPage}
              onShowToast={addToast}
            />
          )}

          {currentPage === 'profile' && isAuthenticated && (
            <ProfilePage onShowToast={addToast} />
          )}

          {currentPage === 'settings' && isAuthenticated && (
            <SettingsPage
              onNavigate={setCurrentPage}
              onShowToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
