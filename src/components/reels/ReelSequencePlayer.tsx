import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Heart,
  ExternalLink,
  Edit3,
  Trash2,
  Sparkles,
  Tag,
  Maximize2,
  Minimize2,
  Info,
  Layers
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem } from '../../types/reels';
import { getInstagramEmbedUrl, getInstagramDirectUrl, getInstagramThumbnailUrl } from '../../utils/instagramHelper';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface ReelSequencePlayerProps {
  reels: ReelItem[];
  initialReelId?: string;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (reel: ReelItem) => void;
  onDelete: (id: string) => void;
}

export const ReelSequencePlayer: React.FC<ReelSequencePlayerProps> = ({
  reels,
  initialReelId,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialReelId && reels.length > 0) {
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
  }, [currentIndex, reels.length]);

  if (!reels || reels.length === 0) {
    return null;
  }

  const currentReel = reels[currentIndex] || reels[0];
  const embedUrl = getInstagramEmbedUrl(currentReel.shortcode);
  const directUrl = getInstagramDirectUrl(currentReel.shortcode);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      playPopSound();
      setCurrentIndex((prev) => prev + 1);
      setIsCaptionExpanded(false);
      setIsDeleting(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playPopSound();
      setCurrentIndex((prev) => prev - 1);
      setIsCaptionExpanded(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col animate-in fade-in duration-200 select-none">
      
      {/* Top Floating Control Bar */}
      <div className="w-full flex items-center justify-between p-3 sm:p-4 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-soft">
            <Instagram size={16} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>Reel Sequence</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono font-bold">
                {currentIndex + 1} / {reels.length}
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              Use ↑ / ↓ arrow keys or buttons to swipe through reels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Highlight Notes Drawer Toggle */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              setIsNotesOpen(!isNotesOpen);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
              isNotesOpen
                ? 'bg-accent text-on-accent shadow-soft'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Highlights & Notes</span>
            <span className="sm:hidden">Notes</span>
          </button>

          {/* Close / Return to Grid */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition border border-white/15 active:scale-95"
            title="Exit Fullscreen (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Reel Viewport: Vertical Sequence Movement */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        
        {/* Centered Reel 9:16 Video Player Container */}
        <div className="relative w-full max-w-[420px] h-full max-h-[760px] aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between">
          
          {/* Cover photo backdrop while iframe loads */}
          <div className="absolute inset-0 z-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
            <img
              src={currentReel.thumbnailUrl || getInstagramThumbnailUrl(currentReel.shortcode, 'l')}
              alt=""
              className="w-full h-full object-cover blur-sm opacity-35"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Instagram Embed iframe */}
          <iframe
            key={currentReel.shortcode}
            src={embedUrl}
            title={currentReel.headline || 'Instagram Reel'}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />

          {/* Floating Actions on the Right Side (Instagram Reels Style) */}
          <div className="absolute right-2.5 bottom-20 z-30 flex flex-col items-center gap-3">
            
            {/* Favorite / Heart Button */}
            <button
              type="button"
              onClick={() => {
                triggerPartyPop('single');
                playPopSound();
                onToggleFavorite(currentReel.id);
              }}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex flex-col items-center justify-center transition active:scale-90 shadow-raised cursor-pointer ${
                currentReel.favorite
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-black/60 hover:bg-black/80 text-white border border-white/20'
              }`}
              title={currentReel.favorite ? 'Favorited' : 'Add to favorites'}
            >
              <Heart size={20} className={currentReel.favorite ? 'fill-current' : 'stroke-[2.2]'} />
            </button>

            {/* View Notes / Highlights */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setIsNotesOpen(!isNotesOpen);
              }}
              className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition active:scale-90 shadow-raised cursor-pointer"
              title="View Key Takeaway"
            >
              <Sparkles size={18} className="text-amber-400 stroke-[2.2]" />
            </button>

            {/* Direct Open in Instagram App */}
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition active:scale-90 shadow-raised cursor-pointer"
              title="Open in Instagram App"
            >
              <ExternalLink size={18} className="text-rose-400 stroke-[2.2]" />
            </a>

            {/* Edit Reel */}
            <button
              type="button"
              onClick={() => onEdit(currentReel)}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition active:scale-90 shadow-raised cursor-pointer"
              title="Edit Reel Notes"
            >
              <Edit3 size={15} />
            </button>

            {/* Delete Reel */}
            <button
              type="button"
              onClick={() => setIsDeleting(true)}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition active:scale-90 shadow-raised cursor-pointer"
              title="Delete Reel"
            >
              <Trash2 size={15} />
            </button>

          </div>

          {/* Bottom Gradient Overlay: Headline, Author & Caption */}
          <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none bg-gradient-to-t from-black via-black/75 to-transparent pt-16 pb-3 px-4 flex flex-col justify-end">
            <div className="pointer-events-auto space-y-1.5 max-w-[80%]">
              
              {/* Creator Handle */}
              {currentReel.author && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-amber-300 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                    {currentReel.author}
                  </span>
                  {currentReel.collection && (
                    <span className="text-[10px] text-zinc-300 bg-white/10 px-2 py-0.5 rounded-full font-bold">
                      {currentReel.collection}
                    </span>
                  )}
                </div>
              )}

              {/* Headline */}
              <h3 className="font-black text-sm sm:text-base text-white leading-tight drop-shadow-md">
                {currentReel.headline || 'Instagram Reel'}
              </h3>

              {/* Caption Snippet */}
              {currentReel.caption && (
                <div className="text-xs text-zinc-300 leading-snug drop-shadow-sm">
                  <p className={isCaptionExpanded ? 'line-clamp-none' : 'line-clamp-2'}>
                    {currentReel.caption}
                  </p>
                  {currentReel.caption.length > 80 && (
                    <button
                      type="button"
                      onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                      className="text-[11px] font-bold text-accent hover:underline mt-0.5"
                    >
                      {isCaptionExpanded ? 'Show less' : '...more'}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* In-Player Delete Confirm Modal */}
          {isDeleting && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                <Trash2 size={24} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-white">Delete this Reel?</p>
                <p className="text-xs text-zinc-400 max-w-[240px] truncate">
                  "{currentReel.headline}"
                </p>
              </div>
              <div className="flex items-center gap-2 w-full max-w-[240px]">
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    onDelete(currentReel.id);
                    setIsDeleting(false);
                    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
                  }}
                  className="flex-1 py-2 rounded-xl bg-danger hover:bg-danger-hover text-white text-xs font-extrabold shadow-soft cursor-pointer transition active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Up / Down Floating Navigation Arrows (Desktop & Tablet) */}
        <div className="hidden sm:flex flex-col gap-3 ml-4 z-40">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 disabled:opacity-20 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-raised disabled:cursor-not-allowed"
            title="Previous Reel (↑)"
          >
            <ChevronUp size={24} className="stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === reels.length - 1}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 disabled:opacity-20 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-raised disabled:cursor-not-allowed"
            title="Next Reel (↓)"
          >
            <ChevronDown size={24} className="stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* Slide-over Side Drawer: Highlights & Key Takeaways */}
      {isNotesOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-surface text-main shadow-2xl border-l border-subtle p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <h3 className="font-extrabold text-sm sm:text-base text-main">
                  Highlight & Takeaways
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotesOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-main cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Headline
              </span>
              <p className="font-extrabold text-sm text-main">
                {currentReel.headline || 'No headline set'}
              </p>
            </div>

            {/* Creator */}
            {currentReel.author && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Creator
                </span>
                <p className="text-xs font-mono font-bold text-accent">
                  {currentReel.author}
                </p>
              </div>
            )}

            {/* Key Takeaway / Notes */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Key Takeaway Notes
              </span>
              <div className="p-3 rounded-2xl bg-sunken border border-subtle text-xs font-medium text-main whitespace-pre-wrap leading-relaxed">
                {currentReel.takeaway || (
                  <span className="text-muted italic">
                    No highlights added yet. Tap "Edit Reel" to write key bullet points or takeaways!
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            {currentReel.tags && currentReel.tags.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentReel.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-sunken border border-subtle text-muted text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Original Caption */}
            {currentReel.caption && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Original Caption
                </span>
                <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap bg-sunken/40 p-2.5 rounded-xl border border-subtle/50">
                  {currentReel.caption}
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-subtle flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onEdit(currentReel);
                setIsNotesOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNotesOpen(false)}
              className="px-3.5 py-2 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-muted cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Swipe Bar */}
      <div className="sm:hidden w-full flex items-center justify-between p-3 z-40 bg-black/80 backdrop-blur-md border-t border-white/10">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-2.5 rounded-xl bg-white/10 disabled:opacity-20 text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/15"
        >
          <ChevronUp size={16} />
          <span>Previous</span>
        </button>
        <span className="px-3 text-xs font-mono font-bold text-zinc-400">
          {currentIndex + 1} / {reels.length}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === reels.length - 1}
          className="flex-1 py-2.5 rounded-xl bg-accent text-on-accent disabled:opacity-20 font-bold text-xs flex items-center justify-center gap-1 shadow-soft"
        >
          <span>Next Reel</span>
          <ChevronDown size={16} />
        </button>
      </div>

    </div>
  );
};
