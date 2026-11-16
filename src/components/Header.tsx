import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Moon, 
  Sun, 
  DownloadCloud, 
  Smartphone,
  X,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { isSoundEnabled, toggleSound, triggerPartyPop } from '../utils/delight';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  onOpenPwaGuide: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenBackupModal,
  onOpenPwaGuide,
  darkMode,
  onToggleDarkMode,
  totalCount,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-espresso-950/95 backdrop-blur-md border-b border-cream-200/90 dark:border-espresso-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Creative Title for Sreeshnav */}
          <div 
            onClick={() => triggerPartyPop('stars')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group select-none"
            title="Click for celebratory stars ✨"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sage-600 via-sage-500 to-peach-400 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <span className="text-base select-none">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-espresso-900 dark:text-cream-50 group-hover:text-sage-600 transition-colors">
                  SreeshSpace
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-peach-100 text-peach-600 dark:bg-peach-950 dark:text-peach-300">
                  Sreeshnav
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm mx-2">
            <div className="relative group">
              <Search 
                size={15} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-800/40 dark:text-cream-100/40 group-focus-within:text-sage-600 transition-colors pointer-events-none" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search across links, tasks & notes..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-cream-50/70 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-400/40 text-espresso-800 dark:text-cream-100 placeholder-espresso-800/40 dark:placeholder-cream-100/40 shadow-2xs transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Action Icons & Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Sound toggle (Party pop & plink sound effects) */}
            <button
              onClick={handleToggleSound}
              aria-label={soundOn ? 'Sound effects on' : 'Sound effects muted'}
              className={`p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                soundOn
                  ? 'text-sage-600 hover:text-sage-700 bg-sage-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40'
              }`}
              title={soundOn ? 'Sound effects on (Bubble plink & celebrations)' : 'Sound effects muted'}
            >
              {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            {/* Dark/Light toggle */}
            <button
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-espresso-800/60 hover:text-espresso-800 dark:text-cream-100/60 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-850 transition cursor-pointer active:scale-95"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* PWA / App mode button */}
            <button
              onClick={onOpenPwaGuide}
              aria-label="Add to home screen or desktop app"
              className="p-2 text-espresso-800/60 hover:text-espresso-800 dark:text-cream-100/60 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-850 transition hidden sm:block cursor-pointer active:scale-95"
              title="Add to phone or desktop"
            >
              <Smartphone size={17} />
            </button>

            {/* Backup / Export */}
            <button
              onClick={onOpenBackupModal}
              aria-label="Backup and restore data"
              className="p-2 text-espresso-800/60 hover:text-espresso-800 dark:text-cream-100/60 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-850 transition cursor-pointer active:scale-95"
              title="Backup & restore"
            >
              <DownloadCloud size={17} />
            </button>

            {/* Save Link Button */}
            <button
              onClick={onOpenAddModal}
              aria-label="Add bookmark or note"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold shadow-pill hover:shadow-soft transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Add Item</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
