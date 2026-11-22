import React, { useState, useEffect } from 'react';
import { WorkspaceView } from '../../types';
import { playPopSound } from '../../utils/delight';
import { useScrollVisibility } from '../../utils/useScrollVisibility';

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
  const isVisible = useScrollVisibility();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModals = () => {
      // 1. Explicit dialog or modal elements
      const explicitModal = document.querySelector(
        '[role="dialog"], [aria-modal="true"], dialog[open], [data-modal="true"], .modal-container'
      );
      if (explicitModal) {
        setIsModalOpen(true);
        return;
      }

      // 2. Backdrop overlays for modals / popups
      const overlays = document.querySelectorAll('.fixed.inset-0');
      for (const el of overlays) {
        if (el.hasAttribute('data-nav-dock') || el.id === 'toast-container' || el.id === 'root') continue;
        const className = el.className || '';
        // If it has children (modal content) and modal styling
        if (
          el.children.length > 0 &&
          (className.includes('z-50') ||
           className.includes('z-[') ||
           className.includes('bg-') ||
           className.includes('backdrop'))
        ) {
          setIsModalOpen(true);
          return;
        }
      }

      setIsModalOpen(false);
    };

    checkModals();

    const observer = new MutationObserver(() => {
      checkModals();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
    });

    return () => observer.disconnect();
  }, []);

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

  const shouldShow = isVisible && !isModalOpen;

  return (
    <nav
      data-nav-dock="true"
      className={`fixed z-50 transition-all duration-300 ease-in-out bottom-0 w-full pb-safe md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[560px] md:max-w-2xl md:rounded-3xl md:pb-0 bg-surface-card/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(139,92,246,0.08)] md:shadow-[0_8px_32px_rgba(139,92,246,0.18)] border-t md:border border-border-subtle ${
        shouldShow ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[160%] opacity-0 pointer-events-none'
      }`}
      aria-label="Navigation Dock"
      style={!shouldShow ? { pointerEvents: 'none' } : undefined}
    >
      <div className="flex items-center justify-around h-20 md:h-18 px-space-xs md:px-4 max-w-xl md:max-w-2xl mx-auto gap-1">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view || (tab.view === 'notebook' && currentView === 'both');
          return (
            <button
              key={tab.view}
              type="button"
              className={`flex flex-col items-center justify-center min-w-[50px] flex-1 h-14 md:h-12 rounded-2xl md:rounded-xl px-1 md:px-3 transition-all duration-200 cursor-pointer ${
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
