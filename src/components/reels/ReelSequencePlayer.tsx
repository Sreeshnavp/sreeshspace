import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import type { ReelItem } from '../../types/reels';
import { getInstagramEmbedUrl } from '../../utils/instagramHelper';
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
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (initialReelId && reels && reels.length > 0) {
      const idx = reels.findIndex((r) => r.id === initialReelId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [initialReelId, reels]);

  // Keyboard navigation: ArrowUp, ArrowDown, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
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

  if (!reels || reels.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-6 select-none">
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
          className="mt-4 px-5 py-2 rounded-full bg-primary text-white font-bold text-xs shadow-md active:scale-95 transition"
        >
          Return to Reels
        </button>
      </div>
    );
  }

  const currentReel = reels[currentIndex] || reels[0];
  const embedUrl = getInstagramEmbedUrl(currentReel.shortcode);

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

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-150">
      
      {/* Floating Minimal Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md cursor-pointer transition active:scale-90 shadow-lg"
        title="Close (Esc)"
      >
        <X size={20} />
      </button>

      {/* Pure Full Screen Reel Viewport (Only the Reel) */}
      <div className="relative w-full h-full max-w-[480px] sm:max-w-[520px] flex items-center justify-center overflow-hidden bg-black">
        <iframe
          key={currentReel.shortcode || currentReel.id}
          src={embedUrl}
          title={currentReel.headline || 'Instagram Reel'}
          className="w-full border-0 absolute left-0"
          style={{
            top: '-56px',
            height: 'calc(100% + 112px)',
          }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Desktop / Tablet Up & Down Navigation Controls */}
      {reels.length > 1 && (
        <div className="hidden sm:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-40">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-20 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md disabled:cursor-not-allowed"
            title="Previous Reel (↑)"
          >
            <ChevronUp size={22} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === reels.length - 1}
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-20 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md disabled:cursor-not-allowed"
            title="Next Reel (↓)"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      )}

    </div>
  );
};
