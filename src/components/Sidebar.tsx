import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BotMessageSquare,
  FileText,
  HelpCircle,
  Layers,
  Repeat,
  BarChart3,
  History,
  User,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingRevisionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  pendingRevisionsCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'planner',
      label: 'Study Planner',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'tutor',
      label: 'AI Tutor',
      icon: BotMessageSquare,
      badge: 'AI',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      id: 'notes',
      label: 'Notes Generator',
      icon: FileText,
      badge: null,
    },
    {
      id: 'quiz',
      label: 'Quiz Generator',
      icon: HelpCircle,
      badge: null,
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: Layers,
      badge: null,
    },
    {
      id: 'revision',
      label: 'Revision Planner',
      icon: Repeat,
      badge: pendingRevisionsCount > 0 ? String(pendingRevisionsCount) : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'analytics',
      label: 'Progress Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      badge: null,
    },
  ];

  const secondaryItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleSelect = (pageId: string) => {
    onNavigate(pageId);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Application sidebar"
      >
        <div className="p-4 space-y-6">
          {/* Main Study Hub Navigation */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Study Hub
            </p>
            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Account & Settings */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Preferences
            </p>
            <nav className="space-y-1">
              {secondaryItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom AI Assistant callout badge */}
        <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-transparent to-indigo-50/40">
          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-indigo-900">Spaced Repetition Active</p>
              <p className="text-[11px] text-indigo-700 leading-tight mt-0.5">
                Ebbinghaus curve ensures long-term memory retention.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
