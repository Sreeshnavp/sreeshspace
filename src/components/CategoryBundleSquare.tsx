import React, { useState, useRef } from 'react';
import { Edit3, Sparkles, GripHorizontal, Plus } from 'lucide-react';
import type { CategoryInfo, LinkItem } from '../types';

interface CategoryBundleSquareProps {
  category: CategoryInfo;
  links: LinkItem[];
  index: number;
  activeDraggingLinkId: string | null;
  onOpenFolder: (category: CategoryInfo) => void;
  onEditCategory: (category: CategoryInfo) => void;
  onDropLink: (linkId: string, categoryName: string) => void;
  onReorderCategory: (fromIndex: number, toIndex: number) => void;
  onStartDragCategory: (index: number) => void;
  onEndDragCategory: () => void;
  isDraggingAnyCategory: boolean;
}

export const CategoryBundleSquare: React.FC<CategoryBundleSquareProps> = ({
  category,
  links,
  index,
  activeDraggingLinkId,
  onOpenFolder,
  onEditCategory,
  onDropLink,
  onReorderCategory,
  onStartDragCategory,
  onEndDragCategory,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const bundleLinks = links.filter(
    (l) => (l.category || '').toLowerCase() === category.name.toLowerCase()
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

    const data = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/link-id');

    // Case 1: Reordering category squares
    if (data && data.startsWith('category-move:')) {
      const fromIdx = parseInt(data.replace('category-move:', ''), 10);
      if (!isNaN(fromIdx) && fromIdx !== index) {
        onReorderCategory(fromIdx, index);
      }
      return;
    }

    // Case 2: Dropping a link into this category
    const targetLinkId = activeDraggingLinkId || data;
    if (targetLinkId) {
      onDropLink(targetLinkId, category.name);
    }
  };

  return (
    <div
      draggable={!activeDraggingLinkId}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `category-move:${index}`);
        e.dataTransfer.effectAllowed = 'move';
        onStartDragCategory(index);
      }}
      onDragEnd={() => {
        onEndDragCategory();
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onOpenFolder(category)}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4.5 rounded-3xl cursor-pointer transition-all duration-300 ease-out select-none border h-[210px] sm:h-[215px] overflow-hidden ${
        isDragOver
          ? 'border-sage-500 bg-sage-50/95 dark:bg-sage-950/95 scale-[1.03] shadow-glow ring-4 ring-sage-400/40 -translate-y-1'
          : 'bg-white/95 dark:bg-espresso-850/95 backdrop-blur-md border-cream-200/90 dark:border-espresso-750 shadow-soft hover:shadow-soft-hover hover:border-sage-300 dark:hover:border-sage-600 hover:-translate-y-1'
      }`}
      style={{
        background: isDragOver
          ? undefined
          : `linear-gradient(145deg, rgba(255,255,255,0.96) 30%, ${category.color}15 100%)`
      }}
    >
      {/* Liquid drop animation overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-sage-600/90 rounded-3xl text-white font-bold text-xs sm:text-sm animate-in fade-in zoom-in-95 backdrop-blur-xs pointer-events-none">
          <Sparkles size={28} className="mb-1.5 animate-bounce" />
          <span>Drop to file into {category.name}!</span>
        </div>
      )}

      {/* 1. Header: Compact Symmetrical Title & Icon */}
      <div className="flex items-center justify-between gap-2 h-8 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${category.color}25` }}
          >
            {category.icon || '📁'}
          </div>

          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-espresso-900 dark:text-cream-50 truncate leading-tight group-hover:text-sage-600 transition-colors">
              {category.name}
            </h3>
            <span className="text-[10px] text-espresso-800/45 dark:text-cream-100/45 font-medium">
              {bundleLinks.length} {bundleLinks.length === 1 ? 'bookmark' : 'bookmarks'}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(category);
          }}
          className="p-1 text-espresso-800/30 hover:text-espresso-800 dark:text-cream-100/30 dark:hover:text-cream-100 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-750 transition"
          title="Rename category"
        >
          <Edit3 size={13} />
        </button>
      </div>

      {/* 2. SYMMETRICAL 2x2 MINI GRID PREVIEW (Always 4 balanced squircle slots!) */}
      <div className="my-auto h-[92px] p-2 rounded-2xl bg-cream-50/70 dark:bg-espresso-900/60 border border-cream-200/70 dark:border-espresso-750/70 flex items-center justify-center transition-colors group-hover:border-sage-200 dark:group-hover:border-sage-800 overflow-hidden">
        <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full">
          {[0, 1, 2, 3].map((slotIndex) => {
            const link = bundleLinks[slotIndex];
            const isOverflowTile = slotIndex === 3 && bundleLinks.length > 4;

            if (link) {
              return (
                <div
                  key={link.id || slotIndex}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/95 dark:bg-espresso-800/95 border border-cream-200/60 dark:border-espresso-700/60 shadow-2xs overflow-hidden min-w-0 h-full"
                  title={link.title}
                >
                  <div className="w-4 h-4 rounded-md bg-cream-100 dark:bg-espresso-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {link.favicon ? (
                      <img src={link.favicon} alt="" className="w-3 h-3 object-contain" />
                    ) : (
                      <span className="text-[8px]">🔗</span>
                    )}
                  </div>
                  
                  {isOverflowTile ? (
                    <span className="text-[10px] font-bold text-sage-600 dark:text-sage-400 font-mono truncate">
                      +{bundleLinks.length - 3} more
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-espresso-900/80 dark:text-cream-50/80 truncate">
                      {link.title.split(' ')[0] || 'Link'}
                    </span>
                  )}
                </div>
              );
            }

            // Symmetrical placeholder slot for empty quadrants
            return (
              <div
                key={`empty-${slotIndex}`}
                className="flex items-center justify-center rounded-xl border border-dashed border-cream-300/60 dark:border-espresso-800/60 bg-white/40 dark:bg-espresso-850/40 h-full text-espresso-800/20 dark:text-cream-100/20"
                title="Empty slot • drag link here"
              >
                <Plus size={11} className="stroke-[2] opacity-40" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Footer: Fluid Interaction Cues */}
      <div className="pt-2 mt-auto border-t border-cream-200/80 dark:border-espresso-800/80 flex items-center justify-between text-[11px] h-7 shrink-0">
        <span 
          className="text-espresso-800/35 hover:text-espresso-800/80 dark:text-cream-100/35 cursor-grab active:cursor-grabbing flex items-center gap-1 font-medium" 
          title="Drag to rearrange folders"
        >
          <GripHorizontal size={13} />
          <span className="text-[10px] hidden sm:inline">Reorder</span>
        </span>

        <span className="font-bold text-sage-600 dark:text-sage-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-xs">
          <span>Open</span>
          <span>&rarr;</span>
        </span>
      </div>
    </div>
  );
};
