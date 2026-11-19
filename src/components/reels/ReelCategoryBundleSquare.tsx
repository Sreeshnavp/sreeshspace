import React, { useState, useRef } from 'react';
import { Edit3, Sparkles, Play } from 'lucide-react';
import type { CategoryInfo, ReelItem } from '../../types';
import { getCategoryToken } from '../../utils/themeColors';
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

  const catToken = getCategoryToken(category.color || category.name);

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
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4.5 rounded-3xl cursor-pointer transition-all duration-300 ease-out select-none border h-[210px] sm:h-[220px] overflow-hidden ${
        isDragOver
          ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/30 scale-[1.03] -translate-y-1'
          : 'bg-surface border-subtle shadow-soft hover:shadow-soft-hover hover:border-strong hover:-translate-y-1'
      }`}
    >
      {/* Liquid drop animation overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-tr from-rose-500 to-purple-600 text-white font-bold text-xs sm:text-sm animate-in fade-in zoom-in-95 pointer-events-none p-4 text-center">
          <Sparkles size={28} className="mb-1.5 animate-bounce" />
          <span>Drop to file into {category.name}! 🎬✨</span>
        </div>
      )}

      {/* 1. Header: Icon, Category Name, Reel Count & Edit */}
      <div className="flex items-center justify-between gap-2 h-8 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs transition-transform group-hover:scale-110"
            style={{ backgroundColor: catToken.softVar, color: catToken.textVar }}
          >
            {category.icon || '🎬'}
          </div>

          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-main truncate leading-tight group-hover:text-rose-600 transition-colors">
              {category.name}
            </h3>
            <span className="text-[10px] text-faint font-medium">
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
          className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
          title="Edit collection"
        >
          <Edit3 size={13} />
        </button>
      </div>

      {/* 2. SYMMETRICAL 2x2 MINI GRID PREVIEW OF REEL COVER PHOTOS */}
      <div className="my-auto h-[100px] p-2 rounded-2xl bg-sunken border border-subtle flex items-center justify-center transition-colors group-hover:border-strong overflow-hidden">
        {bundleReels.length === 0 ? (
          <div className="text-center space-y-1 p-2">
            <span className="text-xs text-muted block">Empty collection</span>
            <span className="text-[10px] text-faint block">Drag reels here</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full">
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
                    className="relative rounded-xl overflow-hidden border border-subtle shadow-2xs h-full w-full bg-surface group/tile"
                    title={reel.headline || 'Reel'}
                  >
                    <img
                      src={cover}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
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

              // Empty slot placeholder
              return (
                <div
                  key={`empty-${slotIndex}`}
                  className="rounded-xl border border-dashed border-subtle/70 bg-surface/40 flex items-center justify-center"
                >
                  <span className="text-[10px] text-faint opacity-40">🎬</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Footer: Tap to open folder notice */}
      <div className="flex items-center justify-between text-[10px] text-faint pt-1">
        <span className="truncate">Tap to explore folder</span>
        <span className="font-extrabold text-rose-500 group-hover:translate-x-0.5 transition-transform">
          &rarr;
        </span>
      </div>
    </div>
  );
};
