import React, { useState, useEffect } from 'react';
import {
  Play,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem } from '../../types/reels';
import {
  getInstagramDirectUrl,
  getInstagramThumbnailUrl,
  resolveInstagramCover,
  isValidCoverUrl,
  getSafeCoverPhotoUrl,
} from '../../utils/instagramHelper';
import { formatRelativeTime } from '../../utils/urlHelper';
import { playPopSound } from '../../utils/delight';

interface ReelListItemProps {
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

export const ReelListItem: React.FC<ReelListItemProps> = ({
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
  const [coverUrl, setCoverUrl] = useState<string>(() => {
    if (isValidCoverUrl(reel.thumbnailUrl)) return getSafeCoverPhotoUrl(reel.thumbnailUrl);
    return getSafeCoverPhotoUrl(getInstagramThumbnailUrl(reel.shortcode, 'm'));
  });
  const [imgError, setImgError] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isValidCoverUrl(reel.thumbnailUrl)) {
      setCoverUrl(getSafeCoverPhotoUrl(reel.thumbnailUrl));
      setImgError(false);
      return;
    }
    let isMounted = true;
    resolveInstagramCover(reel.shortcode).then((meta) => {
      if (isMounted && meta && isValidCoverUrl(meta.thumbnailUrl)) {
        setCoverUrl(getSafeCoverPhotoUrl(meta.thumbnailUrl));
        setImgError(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [reel.thumbnailUrl, reel.shortcode]);

  const handleImageError = () => {
    if (!retryAttempted) {
      setRetryAttempted(true);
      resolveInstagramCover(reel.shortcode, true).then((meta) => {
        if (meta && isValidCoverUrl(meta.thumbnailUrl)) {
          setCoverUrl(getSafeCoverPhotoUrl(meta.thumbnailUrl));
          setImgError(false);
          return;
        }
        setImgError(true);
      });
    } else {
      setImgError(true);
    }
  };

  const directUrl = getInstagramDirectUrl(reel.shortcode);

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
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-surface rounded-2xl border border-subtle shadow-soft hover:shadow-soft-hover hover:border-strong transition cursor-pointer active:cursor-grabbing text-main"
    >
      {/* Left: Drag Handle, Star, Cover Photo, and Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
        {/* Drag handle */}
        <span
          className="text-faint hover:text-muted cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to rearrange order"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </span>

        {/* Favorite Star */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playPopSound();
            onToggleFavorite(reel.id);
          }}
          className={`shrink-0 p-1 rounded-lg transition cursor-pointer ${
            reel.favorite ? 'text-amber-500' : 'text-faint hover:text-muted'
          }`}
          title={reel.favorite ? 'Favorited' : 'Add to favorites'}
        >
          <Star
            size={16}
            className={reel.favorite ? 'fill-amber-500 text-amber-500' : ''}
          />
        </button>

        {/* Default Reel Cover Photo / Thumbnail */}
        <div className="w-16 h-14 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 border border-subtle bg-sunken relative group/cover">
          {!imgError ? (
            <img
              src={coverUrl}
              alt={reel.headline || 'Reel cover'}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-rose-500/10 text-rose-500">
              <Instagram size={14} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover/cover:bg-black/40 transition">
            <Play size={14} className="fill-white text-white translate-x-0.5" />
          </div>
        </div>

        {/* Title, Collection, Author & Takeaway */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-0.5">
            {reel.collection && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20 text-[10px]">
                {reel.collection}
              </span>
            )}
            {reel.author && (
              <span className="text-muted font-medium truncate">
                {reel.author}
              </span>
            )}
          </div>

          <h4 className="font-bold text-xs sm:text-sm text-main truncate group-hover:text-rose-600 transition-colors">
            {reel.headline || 'Instagram Reel'}
          </h4>

          {reel.takeaway && (
            <p className="text-[11px] text-muted truncate mt-0.5 max-w-md hidden sm:block">
              {reel.takeaway}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions, Reorder & Date */}
      <div
        className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-subtle/50"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] text-faint font-medium">
          {formatRelativeTime(reel.createdAt)}
        </span>

        {/* Move Up / Move Down buttons for mobile arranging */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex items-center bg-sunken border border-subtle rounded-lg p-0.5">
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
              title="Move up"
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
              title="Move down"
            >
              <ChevronDown size={12} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
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
            <Play size={13} className="fill-current" />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              onEdit(reel);
            }}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Edit details"
          >
            <Edit3 size={13} />
          </button>

          {/* Delete */}
          {isDeleting ? (
            <div className="flex items-center gap-1 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  onDelete(reel.id);
                }}
                className="px-2 py-0.5 rounded-lg bg-danger text-white text-[10px] font-bold shadow-2xs cursor-pointer"
              >
                Delete?
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="px-1.5 py-0.5 rounded-lg bg-sunken text-muted text-[10px] cursor-pointer"
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
              <Trash2 size={13} />
            </button>
          )}

          {/* External link */}
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-faint hover:text-rose-500 rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Open in Instagram"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};
