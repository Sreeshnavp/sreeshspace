import React, { useState } from 'react';
import {
  Play,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  Tag,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem } from '../../types/reels';
import { getInstagramEmbedUrl, getInstagramDirectUrl } from '../../utils/instagramHelper';
import { playPopSound } from '../../utils/delight';

interface ReelCardProps {
  reel: ReelItem;
  onPlayInSequence: (reel: ReelItem) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (reel: ReelItem) => void;
  onDelete: (id: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  onPlayInSequence,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const embedUrl = getInstagramEmbedUrl(reel.shortcode);
  const directUrl = getInstagramDirectUrl(reel.shortcode);

  return (
    <div className="group relative bg-surface rounded-3xl border border-subtle shadow-soft hover:shadow-raised hover:border-strong transition-all duration-200 overflow-hidden flex flex-col">
      
      {/* 9:16 Aspect Media Header */}
      <div className="relative aspect-[9/13] w-full bg-sunken overflow-hidden flex items-center justify-center">
        {showEmbed ? (
          <iframe
            src={embedUrl}
            title={reel.headline || 'Instagram Reel'}
            className="w-full h-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full relative flex flex-col items-center justify-between p-4 bg-gradient-to-b from-sunken via-surface/40 to-surface">
            {/* Top Bar inside preview */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                <Instagram size={11} className="stroke-[2.5]" />
                <span>Reel</span>
              </span>

              {reel.collection && (
                <span className="px-2 py-0.5 rounded-full bg-sunken/80 backdrop-blur-xs text-muted text-[10px] font-bold border border-subtle">
                  {reel.collection}
                </span>
              )}
            </div>

            {/* Centered Play Button & Reel Title */}
            <div className="text-center space-y-2 z-10">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  onPlayInSequence(reel);
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-raised mx-auto group-hover:scale-110 transition active:scale-95 cursor-pointer"
                title="Play in Fullscreen Sequence"
              >
                <Play size={22} className="fill-current translate-x-0.5" />
              </button>
              <p className="text-[11px] font-bold text-muted">
                Tap to watch in sequence
              </p>
            </div>

            {/* Bottom preview controls */}
            <div className="w-full flex items-center justify-between z-10 pt-2 border-t border-subtle/50 text-[10px] font-bold text-muted">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setShowEmbed(true);
                }}
                className="hover:text-main flex items-center gap-1 cursor-pointer transition"
              >
                <span>Load embedded view</span>
              </button>

              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-500 flex items-center gap-1 cursor-pointer transition"
              >
                <span>Instagram</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}

        {/* Favorite Star Top-Right Corner */}
        <button
          type="button"
          onClick={() => {
            playPopSound();
            onToggleFavorite(reel.id);
          }}
          className={`absolute top-3 right-3 z-20 p-2 rounded-2xl backdrop-blur-md transition shadow-2xs cursor-pointer ${
            reel.favorite
              ? 'bg-amber-500 text-white shadow-soft'
              : 'bg-surface/80 hover:bg-surface text-muted hover:text-amber-500 border border-subtle'
          }`}
          title={reel.favorite ? 'Favorited' : 'Add to favorites'}
        >
          <Star size={13} className={reel.favorite ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Card Content & Highlights */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Headline */}
          <h3 className="font-extrabold text-sm sm:text-base text-main leading-snug line-clamp-2">
            {reel.headline || 'Instagram Reel'}
          </h3>

          {/* Author */}
          {reel.author && (
            <p className="text-[11px] font-bold text-accent font-mono">
              {reel.author}
            </p>
          )}

          {/* Key Takeaway / Highlight Note */}
          {reel.takeaway && (
            <div className="p-2.5 rounded-2xl bg-sunken/60 border border-subtle text-[11px] text-main space-y-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1">
                <Sparkles size={10} className="text-accent" />
                <span>Highlight / Takeaway:</span>
              </span>
              <p className="font-medium line-clamp-3 leading-relaxed whitespace-pre-wrap">
                {reel.takeaway}
              </p>
            </div>
          )}

          {/* Tags */}
          {reel.tags && reel.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {reel.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg bg-surface border border-subtle text-muted text-[10px] font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
          <button
            type="button"
            onClick={() => {
              playPopSound();
              onPlayInSequence(reel);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition active:scale-95 cursor-pointer"
          >
            <Play size={12} className="fill-current" />
            <span>Feed Sequence</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(reel)}
              className="p-1.5 rounded-lg hover:bg-sunken text-muted hover:text-main cursor-pointer transition"
              title="Edit Reel Notes & Headline"
            >
              <Edit3 size={13} />
            </button>

            <button
              type="button"
              onClick={() => setIsDeleting(true)}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 cursor-pointer transition"
              title="Delete Reel"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

      </div>

      {/* In-Card Delete Confirmation Dialog */}
      {isDeleting && (
        <div className="absolute inset-0 z-30 bg-surface/95 backdrop-blur-xs p-4 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-150">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Trash2 size={20} className="stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-main">Delete this Reel?</p>
            <p className="text-[11px] text-muted max-w-[200px] truncate">
              {reel.headline || 'Instagram Reel'}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full max-w-[220px]">
            <button
              type="button"
              onClick={() => setIsDeleting(false)}
              className="flex-1 py-1.5 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                playPopSound();
                onDelete(reel.id);
                setIsDeleting(false);
              }}
              className="flex-1 py-1.5 rounded-xl bg-danger hover:bg-danger-hover text-on-accent text-xs font-extrabold shadow-soft cursor-pointer transition active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
