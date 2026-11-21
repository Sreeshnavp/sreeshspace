import React from 'react';
import { WorkspaceView } from '../../types';
import { playPopSound } from '../../utils/delight';

interface MobileBottomNavProps {
  currentView: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
  linksCount: number;
  tasksCount: number;
  reelsCount: number;
  financeCount: number;
  notesCount: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  linksCount,
  tasksCount,
  reelsCount,
  financeCount,
  notesCount,
}) => {
  const tabs: Array<{
    view: WorkspaceView;
    label: string;
    icon: string;
    count?: number;
  }> = [
    { view: 'home', label: 'Home', icon: 'auto_awesome' },
    { view: 'links', label: 'Links', icon: 'bookmark_heart', count: linksCount },
    { view: 'notebook', label: 'Habits', icon: 'spa', count: tasksCount },
    { view: 'finance', label: 'Finances', icon: 'account_balance_wallet', count: financeCount },
    { view: 'reels', label: 'Reels', icon: 'movie', count: reelsCount },
    { view: 'notes', label: 'Notes', icon: 'edit_note', count: notesCount },
  ];

  return (
    <nav
      className="fixed bottom-0 w-full z-50 pb-safe bg-surface-card/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(139,92,246,0.08)] border-t border-border-subtle"
      aria-label="Navigation Dock"
    >
      <div className="flex items-center justify-around h-20 px-space-xs max-w-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view || (tab.view === 'notebook' && currentView === 'both');
          return (
            <button
              key={tab.view}
              type="button"
              className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-14 rounded-2xl px-1 transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-[0_4px_16px_rgba(107,56,212,0.35)] scale-105'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-lavender-subtle/50 active:scale-95'
              }`}
              onClick={() => {
                onNavigate(tab.view);
                playPopSound();
              }}
              aria-selected={isActive}
              role="tab"
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                {tab.icon}
              </span>
              <span className={`font-label-sm text-[11px] mt-0.5 truncate ${isActive ? 'text-on-primary font-bold' : 'text-on-surface-variant'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
