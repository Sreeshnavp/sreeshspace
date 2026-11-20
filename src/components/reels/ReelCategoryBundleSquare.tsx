import React, { useState, useRef } from 'react';
import { Edit3, Sparkles, Play, Folder } from 'lucide-react';
import type { CategoryInfo, ReelItem } from '../../types';
import { getInstagramThumbnailUrl, isValidCoverUrl, getSafeCoverPhotoUrl } from '../../utils/instagramHelper';

interface ReelCategoryBundleSquareProps {
  category: CategoryInfo;
  reels: ReelItem[];
  index: number;
  activeDraggingReelId: string | null;
  onOpenFolder: (category: CategoryInfo) => void;
  onEditCategory: (category: CategoryInfo) => void;
  onDropReel: (reelId: string, categoryName: string) => void;
  onReorderCategory: (fromIndex: number, toIndex: number) => void;
  onStartDragCategory?: (index: number) => void;
  onEndDragCategory?: () => void;
}

export const ReelCategoryBundleSquare: React.FC<ReelCategoryBundleSquareProps> = ({
  category,
  reels,
  index,
  activeDraggingReelId,
  onOpenFolder,
  onEditCategory,
  onDropReel,
  onReorderCategory,
  onStartDragCategory,
  onEndDragCategory,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const bundleReels = reels.filter(
    (r) => (r.collection || '').toLowerCase().trim() === category.name.toLowerCase().trim()
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    const data =
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('application/reel-id');

    // Case 1: Reordering category squares
    if (data && data.startsWith('reel-category-move:')) {
      const fromIdx = parseInt(data.replace('reel-category-move:', ''), 10);
      if (!isNaN(fromIdx) && fromIdx !== index) {
        onReorderCategory(fromIdx, index);
      }
      return;
    }

    // Case 2: Dropping a reel into this category
    const targetReelId = activeDraggingReelId || data;
    if (targetReelId) {
      onDropReel(targetReelId, category.name);
    }
  };

  return (
    <div
      draggable={!activeDraggingReelId}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `reel-category-move:${index}`);
        e.dataTransfer.effectAllowed = 'move';
        if (onStartDragCategory) onStartDragCategory(index);
      }}
      onDragEnd={() => {
        if (onEndDragCategory) onEndDragCategory();
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onOpenFolder(category)}
      className={`group relative flex flex-col justify-between bg-white rounded-[24px] p-5 border border-[#EFE5CC] shadow-[0_1px_2px_rgba(60,45,10,.05),0_8px_24px_rgba(60,45,10,.06)] hover:shadow-[0_12px_28px_rgba(60,45,10,.09)] hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none min-h-[220px] text-[#1F2A24] ${
        isDragOver
          ? 'ring-4 ring-[#DE3B78]/40 border-[#DE3B78] scale-[1.02]'
          : ''
      }`}
    >
      {/* Liquid drop animation overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-tr from-[#DE3B78] to-[#9B2896] text-white font-bold text-xs sm:text-sm rounded-[24px] pointer-events-none p-4 text-center animate-in fade-in">
          <Sparkles size={28} className="mb-1.5 animate-bounce" />
          <span>Drop to file into {category.name}! 🎬✨</span>
        </div>
      )}

      {/* 1. Header: Purple squircle icon, Title, Reel Count & Edit Pen */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
            style={{ background: '#EDE7FD', color: '#8B5CF6' }}
          >
            <Folder size={17} className="stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <h3 className="font-['Fredoka',sans-serif] font-semibold text-base text-[#1F2A24] truncate leading-tight group-hover:text-[#DE3B78] transition-colors">
              {category.name}
            </h3>
            <span className="text-xs text-[#6E7A72] font-medium">
              {bundleReels.length} {bundleReels.length === 1 ? 'reel' : 'reels'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(category);
          }}
          className="w-8 h-8 rounded-xl bg-[#FFF5E5] border border-[#EFE5CC] text-[#1F2A24] hover:bg-[#FFE3D2] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
          title="Edit collection"
        >
          <Edit3 size={13} />
        </button>
      </div>

      {/* 2. SYMMETRICAL 2x2 MINI GRID PREVIEW OF REEL COVER PHOTOS */}
      <div className="my-3 h-[115px] sm:h-[120px] grid grid-cols-2 grid-rows-2 gap-2 w-full">
        {[0, 1, 2, 3].map((slotIndex) => {
          const reel = bundleReels[slotIndex];
          const isOverflowTile = slotIndex === 3 && bundleReels.length > 4;

          if (reel) {
            const rawCover = isValidCoverUrl(reel.thumbnailUrl)
              ? reel.thumbnailUrl!
              : getInstagramThumbnailUrl(reel.shortcode, 'm');
            const cover = getSafeCoverPhotoUrl(rawCover) || rawCover;

            return (
              <div
                key={reel.id || slotIndex}
                className="relative rounded-xl overflow-hidden border border-[#EFE5CC] shadow-2xs h-full w-full bg-[#1C3325] group/tile"
                title={reel.headline || 'Reel'}
              >
                <img
                  src={cover}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to green gradient matching Image 1
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.style.background = 'linear-gradient(135deg, #5C824E, #3D5931)';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play size={10} className="fill-white text-white" />
                </div>

                {isOverflowTile && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-[10px] font-bold text-white font-mono">
                    +{bundleReels.length - 3}
                  </div>
                )}
              </div>
            );
          }

          // Empty slot placeholder (soft warm cream box matching Image 1)
          return (
            <div
              key={`empty-${slotIndex}`}
              className="rounded-xl border border-[#EFE5CC] bg-[#FFF5E5] flex items-center justify-center"
            >
              <span className="text-[10px] text-[#C4B7A6] opacity-60">🎬</span>
            </div>
          );
        })}
      </div>

      {/* 3. Footer: Tap to explore folder notice */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E7A72] pt-2 border-t border-[#EFE5CC]">
        <span className="truncate">Tap to explore folder</span>
        <span className="text-sm font-bold text-[#DE3B78] group-hover:translate-x-1 transition-transform">
          &rarr;
        </span>
      </div>
    </div>
  );
};
