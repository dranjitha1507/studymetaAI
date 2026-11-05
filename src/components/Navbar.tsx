import React, { useState } from 'react';
import {
  GraduationCap,
  Flame,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Compass,
  Sparkles,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onToggleSidebar?: () => void;
  streakDays?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onToggleSidebar,
  streakDays = 0,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    onNavigate('landing');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {isAuthenticated && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 bg-clip-text text-transparent">
                  StudyMate
                </span>
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                  AI
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation - For Guests */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => onNavigate('landing')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'landing' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => {
                  onNavigate('landing');
                  setTimeout(() => {
                    document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Methodology
              </button>
              <button
                onClick={() => {
                  onNavigate('landing');
                  setTimeout(() => {
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                FAQ
              </button>
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Streak Counter */}
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/70 rounded-full text-amber-800 text-xs font-semibold shadow-xs"
                  title="Consecutive daily study streak"
                >
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{streakDays} Day{streakDays === 1 ? '' : 's'} Streak</span>
                </div>

                {/* Quick Action */}
                <button
                  onClick={() => onNavigate('tutor')}
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200/70 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI Tutor
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors focus:outline-none"
                    aria-expanded={userMenuOpen}
                    aria-label="User profile menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                      {user?.name?.slice(0, 1) || 'U'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-slate-700 max-w-[110px] truncate">
                      {user?.name || 'Account'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                          <p className="text-xs text-slate-500">Signed in as</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('profile');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Student Profile
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('settings');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings & Data
                        </button>

                        <div className="border-t border-slate-100 my-1"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Sign Up Free
                </button>
              </div>
            )}

            {/* Mobile Hamburger for Guests */}
            {!isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Mobile Menu */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('landing');
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Features & Overview
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('login');
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg"
          >
            Log In to Account
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('register');
            }}
            className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            Create New Account
          </button>
        </div>
      )}
    </header>
  );
};
