import React, { useState, useEffect } from 'react';
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
  Sparkles,
  AlertTriangle
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
  const [coverUrl, setCoverUrl] = useState<string>(() => {
    if (isValidCoverUrl(reel.thumbnailUrl)) return getSafeCoverPhotoUrl(reel.thumbnailUrl);
    return getSafeCoverPhotoUrl(getInstagramThumbnailUrl(reel.shortcode, 'l'));
  });
  const [imgError, setImgError] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    if (onDragStart) onDragStart(e, reel.id);
  };

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={onDragOver}
        onDrop={(e) => {
          if (onDrop) onDrop(e, reel.id);
        }}
        onClick={() => onPlayInSequence(reel)}
        className="group relative flex flex-col justify-between bg-white rounded-[24px] p-4 sm:p-5 border border-[#EFE5CC] shadow-[0_1px_2px_rgba(60,45,10,.05),0_8px_24px_rgba(60,45,10,.06)] hover:shadow-[0_12px_28px_rgba(60,45,10,.09)] hover:-translate-y-1 transition-all duration-200 cursor-pointer text-[#1F2A24]"
      >
        <div>
          {/* Top Meta Bar */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {/* Drag Handle Indicator */}
              <span
                className="text-[#9AA39C] hover:text-[#1F2A24] cursor-grab active:cursor-grabbing -ml-1 p-0.5"
                title="Drag to rearrange order"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical size={14} />
              </span>

              {/* Category Pill (Pink badge matching design) */}
              <span 
                className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: '#FFE1EA', color: '#DE3B78' }}
              >
                {reel.collection || 'Coding & Tech'}
              </span>

              {/* Author Handle Pill (Soft cream badge) */}
              {reel.author && (
                <span 
                  className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 border border-[#EFE5CC] truncate max-w-[130px]"
                  style={{ background: '#FFF5E5', color: '#6E7A72' }}
                >
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
              className="p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer text-amber-500 shrink-0"
              title={reel.favorite ? 'Favorited' : 'Add to favorites'}
            >
              <Star
                size={18}
                className={reel.favorite ? 'fill-amber-500 text-amber-500' : 'text-[#B0BAAF] hover:text-amber-500'}
              />
            </button>
          </div>

          {/* Video Preview Box (16:9 / 44 height) */}
          <div className="relative w-full h-44 sm:h-48 rounded-[18px] overflow-hidden mb-3 border border-[#EFE5CC] bg-[#1C3325] group/cover">
            {!imgError ? (
              <img
                src={coverUrl}
                alt={reel.headline || 'Reel cover'}
                className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                style={{ background: 'linear-gradient(135deg, #1C3325, #4A3E1B)' }}
              >
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-1.5 backdrop-blur-xs">
                  <Play size={16} className="fill-current translate-x-0.5" />
                </div>
                <span className="text-xs font-bold text-white">Instagram Reel</span>
                <span className="text-[10px] text-white/70 font-mono">{reel.shortcode}</span>
              </div>
            )}

            {/* Gradient Overlay & Center Play Button */}
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-90 group-hover/cover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white text-[#DE3B78] flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-transform">
                <Play size={18} className="fill-current translate-x-0.5" />
              </div>
            </div>

            {/* Top Left Badge: Watch Reel */}
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <Instagram size={11} className="stroke-[2.5]" />
                <span>Watch Reel</span>
              </span>
            </div>
          </div>

          {/* Title / Headline */}
          <h3 className="font-['Fredoka',sans-serif] font-semibold text-base sm:text-[17px] text-[#1F2A24] leading-snug group-hover:text-[#DE3B78] transition-colors mb-2 line-clamp-2">
            {reel.headline || 'Instagram Reel'}
          </h3>

          {/* Key Highlights / Takeaway Preview */}
          {reel.takeaway && (
            <div className="bg-[#FFF8ED] rounded-xl p-2.5 mb-3 border border-[#EFE5CC]">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#DE3B78] mb-1">
                <Sparkles size={11} />
                <span>Key Highlights</span>
              </div>
              <p className="text-xs text-[#6E7A72] leading-relaxed line-clamp-2 whitespace-pre-line font-normal">
                {reel.takeaway}
              </p>
            </div>
          )}

          {/* Tags */}
          {reel.tags && reel.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {reel.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-[#FFF5E5] text-[#6E7A72] text-[10px] font-medium border border-[#EFE5CC]"
                >
                  <Tag size={9} className="opacity-60" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Relative Time + 4 Action Buttons */}
        <div className="pt-3 border-t border-[#EFE5CC] flex items-center justify-between text-xs text-[#6E7A72]">
          
          {/* Left: Relative Time + Up/Down Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#6E7A72]">
              {formatRelativeTime(reel.createdAt)}
            </span>

            {/* Mobile reordering arrows */}
            {(onMoveUp || onMoveDown) && (
              <div
                className="flex items-center ml-1 bg-[#FFF5E5] border border-[#EFE5CC] rounded-lg p-0.5"
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
                    canMoveUp ? 'hover:bg-white text-[#6E7A72] hover:text-[#1F2A24] cursor-pointer' : 'opacity-25 cursor-not-allowed'
                  }`}
                  title="Move up"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={() => {
                    playPopSound();
                    if (onMoveDown) onMoveDown(reel.id);
                  }}
                  className={`p-1 rounded transition ${
                    canMoveDown ? 'hover:bg-white text-[#6E7A72] hover:text-[#1F2A24] cursor-pointer' : 'opacity-25 cursor-not-allowed'
                  }`}
                  title="Move down"
                >
                  <ChevronDown size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Right: Group of 4 Action Buttons */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Play Button */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                onPlayInSequence(reel);
              }}
              className="w-8 h-8 rounded-xl bg-[#FFF5E5] border border-[#EFE5CC] text-[#DE3B78] hover:bg-[#FFE1EA] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
              title="Watch reel"
            >
              <Play size={13} className="fill-current" />
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                onEdit(reel);
              }}
              className="w-8 h-8 rounded-xl bg-[#FFF5E5] border border-[#EFE5CC] text-[#1F2A24] hover:bg-[#FFE3D2] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
              title="Edit reel details"
            >
              <Edit3 size={13} />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setIsDeleteModalOpen(true);
              }}
              className="w-8 h-8 rounded-xl bg-[#FFF5E5] border border-[#EFE5CC] text-[#1F2A24] hover:text-red-500 hover:bg-[#FFE1EA] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
              title="Delete reel"
            >
              <Trash2 size={13} />
            </button>

            {/* Open Externally */}
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl bg-[#FFF5E5] border border-[#EFE5CC] text-[#1F2A24] hover:bg-[#FFE3D2] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
              title="Open in Instagram"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-[24px] p-6 border border-[#EFE5CC] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-[#1F2A24]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE1EA] text-[#DE3B78] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-['Fredoka',sans-serif] font-bold text-base leading-tight">Delete Reel?</h4>
                <p className="text-xs text-[#6E7A72] mt-0.5">Are you sure you want to remove this reel from your vault?</p>
              </div>
            </div>

            <p className="text-xs bg-[#FFF8ED] p-3 rounded-xl border border-[#EFE5CC] text-[#1F2A24] font-medium line-clamp-2">
              "{reel.headline || 'Instagram Reel'}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E7A72] hover:bg-[#FFF5E5] border border-[#EFE5CC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setIsDeleteModalOpen(false);
                  onDelete(reel.id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#DE3B78] hover:bg-[#C22964] text-white shadow-md transition cursor-pointer"
              >
                Delete Reel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
