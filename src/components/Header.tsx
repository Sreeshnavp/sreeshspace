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
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { isSoundEnabled, toggleSound, triggerPartyPop } from '../utils/delight';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  onOpenPwaGuide: () => void;
  onOpenDesignGuide?: () => void;
  onOpenWallpaper?: () => void;
  onOpenSync?: () => void;
  syncState?: 'synced' | 'syncing' | 'offline' | 'error';
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
  onOpenSync,
  syncState = 'synced',
  darkMode,
  onToggleDarkMode,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-subtle transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Title */}
          <div 
            onClick={() => triggerPartyPop('stars')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group select-none"
            title="Click for celebratory stars ✨"
          >
            <div className="w-9 h-9 rounded-2xl bg-accent text-on-accent flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <span className="text-base select-none">🪐</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-main group-hover:text-accent transition-colors">
                  Orbit
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-soft text-accent-text">
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
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-main p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Action Icons & Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Colour Guide & Theme Picker */}
            {onOpenDesignGuide && (
              <button
                onClick={onOpenDesignGuide}
                aria-label="Colour guide and design system"
                className="p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
                title="Colour Guide & Accent Theme"
              >
                <Palette size={17} />
              </button>
            )}

            {/* Custom Wallpaper & Opacity */}
            {onOpenWallpaper && (
              <button
                onClick={onOpenWallpaper}
                aria-label="Custom background wallpaper"
                className="p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
                title="Wallpaper & Background Image"
              >
                <ImageIcon size={17} />
              </button>
            )}

            {/* Sound toggle */}
            <button
              onClick={handleToggleSound}
              aria-label={soundOn ? 'Sound effects on' : 'Sound effects muted'}
              className={`p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                soundOn
                  ? 'text-accent bg-accent-soft'
                  : 'text-muted hover:text-main hover:bg-sunken'
              }`}
              title={soundOn ? 'Sound effects on' : 'Sound effects muted'}
            >
              {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            {/* Dark/Light toggle */}
            <button
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* PWA / App mode button */}
            <button
              onClick={onOpenPwaGuide}
              aria-label="Add to home screen or desktop app"
              className="p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition hidden sm:block cursor-pointer active:scale-95"
              title="Add to phone or desktop"
            >
              <Smartphone size={17} />
            </button>

            {/* Cloud Sync & Phone Pairing */}
            {onOpenSync && (
              <button
                onClick={onOpenSync}
                aria-label={`Cloud sync status: ${syncState}`}
                className={`p-2 rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  syncState === 'syncing'
                    ? 'text-accent bg-accent-soft'
                    : syncState === 'synced'
                    ? 'text-success hover:bg-sunken'
                    : 'text-muted hover:text-main hover:bg-sunken'
                }`}
                title={
                  syncState === 'syncing'
                    ? 'Syncing with Supabase...'
                    : syncState === 'synced'
                    ? 'Cloud Synced (Supabase)'
                    : 'Cloud Offline'
                }
              >
                {syncState === 'syncing' ? (
                  <RefreshCw size={17} className="animate-spin text-accent" />
                ) : syncState === 'synced' ? (
                  <Cloud size={17} className="text-success" />
                ) : (
                  <CloudOff size={17} className="text-muted" />
                )}
              </button>
            )}

            {/* Backup / Export */}
            <button
              onClick={onOpenBackupModal}
              aria-label="Backup and restore data"
              className="p-2 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer active:scale-95"
              title="Backup & restore"
            >
              <DownloadCloud size={17} />
            </button>

            {/* Save Link Button */}
            <button
              onClick={onOpenAddModal}
              aria-label="Add bookmark or note"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition-all active:scale-95 cursor-pointer"
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
