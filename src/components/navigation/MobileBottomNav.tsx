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
    { view: 'home', label: 'Home', icon: '🏠' },
    { view: 'links', label: 'Links', icon: '🔗', count: linksCount },
    { view: 'notebook', label: 'Habits', icon: '📖', count: tasksCount },
    { view: 'reels', label: 'Reels', icon: '🎬', count: reelsCount },
    { view: 'finance', label: 'Finance', icon: '👛', count: financeCount },
    { view: 'notes', label: 'Notes', icon: '🎨', count: notesCount },
  ];

  return (
    <nav className="sreesh-mobile-dock" aria-label="Mobile Navigation Dock">
      {tabs.map((tab) => {
        const isActive = currentView === tab.view;
        return (
          <button
            key={tab.view}
            type="button"
            className={`mobile-dock-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              onNavigate(tab.view);
              playPopSound();
            }}
            aria-selected={isActive}
            role="tab"
          >
            <div className="mobile-dock-icon-wrap">
              <span>{tab.icon}</span>
              {Boolean(tab.count && tab.count > 0 && !isActive) && (
                <span className="mobile-dock-badge">
                  {tab.count! > 99 ? '99+' : tab.count}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
            {isActive && <div className="mobile-dock-pill-indicator" />}
          </button>
        );
      })}
    </nav>
  );
};
