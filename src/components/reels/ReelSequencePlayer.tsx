import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronUp, ChevronDown, Folder, Star, ExternalLink } from 'lucide-react';
import type { ReelItem } from '../../types/reels';
import { getInstagramEmbedUrl, getInstagramDirectUrl } from '../../utils/instagramHelper';
import { playPopSound } from '../../utils/delight';

interface ReelSequencePlayerProps {
  reels: ReelItem[];
  initialReelId?: string;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
  onEdit?: (reel: ReelItem) => void;
  onDelete?: (id: string) => void;
}

export const ReelSequencePlayer: React.FC<ReelSequencePlayerProps> = ({
  reels,
  initialReelId,
  onClose,
  onToggleFavorite,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (initialReelId && reels && reels.length > 0) {
      const idx = reels.findIndex((r) => r.id === initialReelId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [initialReelId, reels]);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      playPopSound();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playPopSound();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Escape, PageUp, PageDown, j, k
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels ? reels.length : 0]);

  // Touch swipe support on player container edges
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY < -60) {
      handleNext();
    } else if (deltaY > 60) {
      handlePrev();
    }
  };

  if (!reels || reels.length === 0) {
    return createPortal(
      <div 
        role="dialog" 
        aria-modal="true" 
        data-modal="true" 
        id="reel-fullscreen-player"
        className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-center p-6 select-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition active:scale-95"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
        <span className="text-4xl mb-3">🎬</span>
        <h3 className="font-bold text-lg text-white">No Reels in Feed</h3>
        <p className="text-xs text-zinc-400 max-w-xs text-center mt-1">
          Paste an Instagram Reel link in the Reels tab to watch it in full screen!
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-5 py-2 rounded-full bg-primary text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
        >
          Return to Reels Vault
        </button>
      </div>,
      document.body
    );
  }

  const currentReel = reels[currentIndex] || reels[0];
  const embedUrl = getInstagramEmbedUrl(currentReel.shortcode);
  const directInstagramUrl = getInstagramDirectUrl(currentReel.shortcode);

  return createPortal(
    <div 
      role="dialog"
      aria-modal="true"
      data-modal="true"
      id="reel-fullscreen-player"
      className="fixed inset-0 z-[99999] bg-black text-white flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-150"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ======================================================== */}
      {/* 1. TOP FLOATING CONTROLS (Folders & Vault, Counter, Close) */}
      {/* ======================================================== */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        {/* Left: Folders & Vault Shortcut + Counter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer"
            title="Open Folders & Vault"
          >
            <Folder size={14} className="text-pink-400 fill-pink-400/20" />
            <span className="hidden sm:inline">Folders & Vault</span>
            <span className="sm:hidden">Folders</span>
          </button>

          <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/15 text-white/80 backdrop-blur-md text-[11px] font-mono font-medium">
            {currentIndex + 1} / {reels.length}
          </span>
        </div>

        {/* Right: Star & Close */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => {
                playPopSound();
                onToggleFavorite(currentReel.id);
              }}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
              title={currentReel.favorite ? 'Unstar Reel' : 'Star Reel'}
            >
              <Star size={18} className={currentReel.favorite ? 'fill-amber-400 text-amber-400' : 'text-white/80'} />
            </button>
          )}

          <a
            href={directInstagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
            title="Open on Instagram"
          >
            <ExternalLink size={16} className="text-white/80" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
            title="Close Fullscreen (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PURE FULL SCREEN REEL VIEWPORT (VIDEO ONLY)            */}
      {/* Scales & crops iframe: completely eliminates top header   */}
      {/* and bottom white caption card ("View more on Instagram"). */}
      {/* Only the clean reel video is visible!                     */}
      {/* ======================================================== */}
      <div 
        className="relative overflow-hidden bg-black flex items-center justify-center shadow-2xl rounded-2xl"
        style={{
          width: 'min(100vw, calc((100dvh - 36px) * 9 / 16))',
          height: 'calc(min(calc(100dvh - 36px), calc(100vw * 16 / 9)) - 8px)',
          aspectRatio: '9 / 16',
          maxHeight: 'calc(100dvh - 36px)',
          maxWidth: '100vw',
        }}
      >
        <iframe
          key={currentReel.shortcode || currentReel.id}
          src={embedUrl}
          title={currentReel.headline || 'Instagram Reel'}
          className="border-0 pointer-events-auto bg-black"
          style={{
            position: 'absolute',
            top: '-64px',
            left: '50%',
            transform: 'translateX(-50%) scale(1.36)',
            transformOrigin: 'top center',
            width: '100%',
            height: 'calc(100% + 200px)',
          }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />

        {/* Solid Blackout Base Guard: Completely covers the white Instagram caption / footer card */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-28 bg-black pointer-events-none z-20" 
          aria-hidden="true"
        />
        {/* Smooth Gradient Transition into black base */}
        <div 
          className="absolute bottom-28 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-20" 
          aria-hidden="true"
        />
      </div>

      {/* ======================================================== */}
      {/* 3. FLOATING NEXT & PREVIOUS ARROWS (RIGHT SIDE)           */}
      {/* ======================================================== */}
      {reels.length > 1 && (
        <div className="flex flex-col gap-3 absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-11 h-11 rounded-full bg-black/65 hover:bg-black/90 disabled:opacity-20 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition active:scale-90 cursor-pointer shadow-xl disabled:cursor-not-allowed"
            title="Previous Reel (↑)"
          >
            <ChevronUp size={22} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === reels.length - 1}
            className="w-11 h-11 rounded-full bg-black/65 hover:bg-black/90 disabled:opacity-20 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition active:scale-90 cursor-pointer shadow-xl disabled:cursor-not-allowed"
            title="Next Reel (↓)"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      )}

    </div>,
    document.body
  );
};
