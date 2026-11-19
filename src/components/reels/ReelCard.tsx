import React, { useState } from 'react';
import {
  Play,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  Tag,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem } from '../../types/reels';
import { getInstagramDirectUrl, getInstagramThumbnailUrl } from '../../utils/instagramHelper';
import { formatRelativeTime } from '../../utils/urlHelper';
import { playPopSound } from '../../utils/delight';

interface ReelCardProps {
  reel: ReelItem;
  onPlayInSequence: (reel: ReelItem) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (reel: ReelItem) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  onPlayInSequence,
  onToggleFavorite,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const directUrl = getInstagramDirectUrl(reel.shortcode);
  const coverUrl = reel.thumbnailUrl || getInstagramThumbnailUrl(reel.shortcode, 'l');

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', reel.id);
    e.dataTransfer.setData('application/reel-id', reel.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, reel.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        if (onDragOver) onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onDrop) onDrop(e, reel.id);
      }}
      onClick={() => onPlayInSequence(reel)}
      className="group relative flex flex-col justify-between bg-surface rounded-3xl p-4 sm:p-5 border border-subtle shadow-soft hover:shadow-soft-hover hover:border-strong transition-all duration-200 cursor-pointer active:cursor-grabbing text-main"
    >
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag Handle Indicator for Arranging */}
            <span
              className="text-faint hover:text-muted cursor-grab active:cursor-grabbing -ml-1 p-0.5"
              title="Drag to rearrange order"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={14} />
            </span>

            {/* Instagram Gradient Icon Badge */}
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Instagram size={13} className="stroke-[2.5]" />
            </div>

            {/* Collection Pill */}
            {reel.collection && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 border border-subtle bg-rose-500/10 text-rose-600">
                <span>{reel.collection}</span>
              </span>
            )}

            {/* Author Handle */}
            {reel.author && (
              <span className="text-[11px] text-faint truncate font-medium">
                {reel.author}
              </span>
            )}
          </div>

          {/* Star Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playPopSound();
              onToggleFavorite(reel.id);
            }}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              reel.favorite
                ? 'text-amber-500 hover:scale-110'
                : 'text-faint hover:text-muted'
            }`}
            title={reel.favorite ? 'Favorited' : 'Add to favorites'}
          >
            <Star
              size={18}
              className={reel.favorite ? 'fill-amber-500 text-amber-500' : ''}
            />
          </button>
        </div>

        {/* Default Reel Cover Photo / Thumbnail */}
        <div className="relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden mb-3 border border-subtle bg-sunken group/cover">
          {!imgError ? (
            <img
              src={coverUrl}
              alt={reel.headline || 'Reel cover'}
              className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-rose-500/15 via-amber-500/10 to-purple-500/15 p-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-soft mb-1.5">
                <Play size={16} className="fill-current translate-x-0.5" />
              </div>
              <span className="text-[11px] font-extrabold text-main">Instagram Reel</span>
              <span className="text-[10px] text-muted font-mono">{reel.shortcode}</span>
            </div>
          )}

          {/* Gradient Overlay & Center Play Button */}
          <div className="absolute inset-0 bg-gradient-to-t from-main/60 via-main/20 to-transparent flex items-center justify-center opacity-85 group-hover/cover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-surface/90 backdrop-blur-md text-main flex items-center justify-center shadow-raised group-hover/cover:scale-110 transition-transform">
              <Play size={18} className="fill-current translate-x-0.5 text-rose-500" />
            </div>
          </div>

          {/* Top Left Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold flex items-center gap-1">
              <Instagram size={10} className="stroke-[2.5]" />
              <span>Watch Reel</span>
            </span>
          </div>

          {/* Bottom Right Shortcode Indicator */}
          <div className="absolute bottom-2.5 right-2.5">
            <span className="px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white/90 text-[9px] font-mono">
              ▶ Feed Sequence
            </span>
          </div>
        </div>

        {/* Title / Headline */}
        <h3 className="font-bold text-sm sm:text-base text-main leading-snug group-hover:text-rose-600 transition-colors mb-2 line-clamp-2">
          {reel.headline || 'Instagram Reel'}
        </h3>

        {/* Key Highlights / Takeaway Preview */}
        {reel.takeaway && (
          <div className="bg-sunken rounded-2xl p-3 mb-3 border border-subtle">
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-500 mb-1">
              <Sparkles size={11} />
              <span>Key Highlights</span>
            </div>
            <p className="text-xs text-muted leading-relaxed line-clamp-3 whitespace-pre-line font-normal">
              {reel.takeaway}
            </p>
          </div>
        )}

        {/* Tags */}
        {reel.tags && reel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {reel.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-sunken text-muted text-[10px] font-medium border border-subtle"
              >
                <Tag size={9} className="opacity-60" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Clear Actions & Reordering */}
      <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-faint">
        
        {/* Left: Relative Time + Arranging Arrows (Move Up / Down) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium">
            {formatRelativeTime(reel.createdAt)}
          </span>

          {/* Mobile-friendly Reorder Buttons */}
          {(onMoveUp || onMoveDown) && (
            <div
              className="flex items-center ml-1 bg-sunken border border-subtle rounded-lg p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={() => {
                  playPopSound();
                  if (onMoveUp) onMoveUp(reel.id);
                }}
                className={`p-1 rounded transition ${
                  canMoveUp ? 'hover:bg-surface text-muted hover:text-main cursor-pointer' : 'opacity-25 cursor-not-allowed'
                }`}
                title="Move up in order"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={() => {
                  playPopSound();
                  if (onMoveDown) onMoveDown(reel.id);
                }}
                className={`p-1 rounded transition ${
                  canMoveDown ? 'hover:bg-surface text-muted hover:text-main cursor-pointer' : 'opacity-25 cursor-not-allowed'
                }`}
                title="Move down in order"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          
          {/* Play Sequence */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              onPlayInSequence(reel);
            }}
            className="p-1.5 text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
            title="Watch in Sequence"
          >
            <Play size={14} className="fill-current" />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              onEdit(reel);
            }}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Edit highlights & details"
          >
            <Edit3 size={14} />
          </button>

          {/* Delete with 2-step confirmation */}
          {isDeleting ? (
            <div className="flex items-center gap-1 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  onDelete(reel.id);
                }}
                className="px-2 py-0.5 rounded-lg bg-danger text-white text-[10px] font-bold shadow-2xs hover:opacity-90 cursor-pointer"
              >
                Delete?
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="px-1.5 py-0.5 rounded-lg bg-sunken text-muted text-[10px] hover:text-main cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsDeleting(true)}
              className="p-1.5 text-faint hover:text-danger rounded-xl hover:bg-sunken transition cursor-pointer"
              title="Delete reel"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Open in Instagram */}
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-faint hover:text-rose-500 rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Open in Instagram app"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
