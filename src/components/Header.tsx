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
  Palette,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { isSoundEnabled, toggleSound, triggerPartyPop } from '../utils/delight';
import avatarImg from '../assets/avatar.png';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  onOpenPwaGuide: () => void;
  onOpenDesignGuide?: () => void;
  onOpenWallpaper?: () => void;
  onLock?: () => void;
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
  onOpenDesignGuide,
  onOpenWallpaper,
  onLock,
  darkMode,
  onToggleDarkMode,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-subtle transition-colors shadow-2xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          
          {/* Logo & Title */}
          <div 
            onClick={() => triggerPartyPop('stars')}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer group select-none"
            title="Click for celebratory stars ✨"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-2xl p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-soft group-hover:scale-110 active:scale-95 transition-all">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-surface relative flex items-center justify-center">
                <img 
                  src={avatarImg} 
                  alt="Sreeshnav" 
                  className="w-full h-full object-cover rounded-[14px] group-hover:rotate-6 transition-transform duration-300" 
                />
                <span className="absolute -top-1 -right-1 text-[9px] animate-pulse select-none">✨</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-head font-extrabold text-base sm:text-lg tracking-tight text-main group-hover:text-accent transition-colors">
                  Orbit
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-accent-soft text-accent-text border border-accent/20">
                  Sreeshnav
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Search Bar (hidden on mobile, centered on md+) */}
          <div className="hidden md:block flex-1 max-w-sm mx-2">
            <div className="relative group">
              <Search 
                size={15} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint group-focus-within:text-accent transition-colors pointer-events-none" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search across links, tasks & notes..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-sunken border border-subtle rounded-full focus:outline-none focus:ring-2 focus:ring-ring text-main placeholder-faint shadow-2xs transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-main p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Action Icons & Controls (Ordered for immediate mobile visibility) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* 1. Dark/Light Mode Toggle (Always visible & prominent!) */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 sm:p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={17} className="text-warning" /> : <Moon size={17} />}
            </button>

            {/* 2. Custom Wallpaper & Background Image */}
            {onOpenWallpaper && (
              <button
                type="button"
                onClick={onOpenWallpaper}
                aria-label="Custom background wallpaper"
                className="p-1.5 sm:p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
                title="Wallpaper & Background Image"
              >
                <ImageIcon size={17} />
              </button>
            )}

            {/* 3. Colour Guide & Theme Accent */}
            {onOpenDesignGuide && (
              <button
                type="button"
                onClick={onOpenDesignGuide}
                aria-label="Colour guide and design system"
                className="p-1.5 sm:p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
                title="Colour Guide & Accent Theme"
              >
                <Palette size={17} />
              </button>
            )}

            {/* 4. Sound Effects Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={soundOn ? 'Sound effects on' : 'Sound effects muted'}
              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                soundOn
                  ? 'text-accent bg-accent-soft'
                  : 'text-muted hover:text-main hover:bg-sunken'
              }`}
              title={soundOn ? 'Sound effects on' : 'Sound effects muted'}
            >
              {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            {/* 5. PWA / Install to phone (desktop/tablet) */}
            <button
              type="button"
              onClick={onOpenPwaGuide}
              aria-label="Add to home screen or desktop app"
              className="p-1.5 sm:p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition hidden sm:block cursor-pointer active:scale-95"
              title="Add to phone or desktop"
            >
              <Smartphone size={17} />
            </button>

            {/* 6. Lock Orbit Button */}
            {onLock && (
              <button
                type="button"
                onClick={onLock}
                aria-label="Lock Orbit"
                className="p-1.5 sm:p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
                title="Lock Orbit 🔒"
              >
                <Lock size={17} />
              </button>
            )}

            {/* 7. Backup & Restore Data */}
            <button
              type="button"
              onClick={onOpenBackupModal}
              aria-label="Backup and restore data"
              className="p-1.5 sm:p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
              title="Backup & restore"
            >
              <DownloadCloud size={17} />
            </button>

            {/* 7. Add Item Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              aria-label="Add bookmark or note"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition-all active:scale-95 cursor-pointer ml-0.5"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Add Item</span>
            </button>

          </div>

        </div>

        {/* Mobile Dedicated Search Row (< md) */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <div className="relative group w-full">
            <Search 
              size={14} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint group-focus-within:text-accent transition-colors pointer-events-none" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search links, habits & notes..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-sunken border border-subtle rounded-full focus:outline-none focus:ring-2 focus:ring-ring text-main placeholder-faint shadow-2xs transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-main p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
