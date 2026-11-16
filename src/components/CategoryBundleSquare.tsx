import React, { useState, useRef } from 'react';
import { Edit3, Sparkles, GripHorizontal, Plus } from 'lucide-react';
import type { CategoryInfo, LinkItem } from '../types';
import { getCategoryToken } from '../utils/themeColors';

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
          ? 'border-accent bg-accent-soft ring-4 ring-ring/30 scale-[1.03] -translate-y-1'
          : 'bg-surface border-subtle shadow-soft hover:shadow-soft-hover hover:border-strong hover:-translate-y-1'
      }`}
    >
      {/* Liquid drop animation overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-accent text-on-accent font-bold text-xs sm:text-sm animate-in fade-in zoom-in-95 pointer-events-none">
          <Sparkles size={28} className="mb-1.5 animate-bounce" />
          <span>Drop to file into {category.name}!</span>
        </div>
      )}

      {/* 1. Header: Compact Title & Icon */}
      <div className="flex items-center justify-between gap-2 h-8 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs transition-transform group-hover:scale-110"
            style={{ backgroundColor: catToken.softVar, color: catToken.textVar }}
          >
            {category.icon || '📁'}
          </div>

          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-main truncate leading-tight group-hover:text-accent transition-colors">
              {category.name}
            </h3>
            <span className="text-[10px] text-faint font-medium">
              {bundleLinks.length} {bundleLinks.length === 1 ? 'bookmark' : 'bookmarks'}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(category);
          }}
          className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
          title="Rename category"
        >
          <Edit3 size={13} />
        </button>
      </div>

      {/* 2. SYMMETRICAL 2x2 MINI GRID PREVIEW */}
      <div className="my-auto h-[92px] p-2 rounded-2xl bg-sunken border border-subtle flex items-center justify-center transition-colors group-hover:border-strong overflow-hidden">
        <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full">
          {[0, 1, 2, 3].map((slotIndex) => {
            const link = bundleLinks[slotIndex];
            const isOverflowTile = slotIndex === 3 && bundleLinks.length > 4;

            if (link) {
              return (
                <div
                  key={link.id || slotIndex}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-surface border border-subtle shadow-2xs overflow-hidden min-w-0 h-full text-main"
                  title={link.title}
                >
                  <div className="w-4 h-4 rounded-md bg-sunken flex items-center justify-center shrink-0 overflow-hidden">
                    {link.favicon ? (
                      <img src={link.favicon} alt="" className="w-3 h-3 object-contain" />
                    ) : (
                      <span className="text-[8px]">🔗</span>
                    )}
                  </div>
                  
                  {isOverflowTile ? (
                    <span className="text-[10px] font-bold text-accent-text font-mono truncate">
                      +{bundleLinks.length - 3} more
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-main truncate">
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
                className="flex items-center justify-center rounded-xl border border-dashed border-strong bg-surface/40 h-full text-faint"
                title="Empty slot • drag link here"
              >
                <Plus size={11} className="stroke-[2] opacity-40" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Footer: Interaction Cues */}
      <div className="pt-2 mt-auto border-t border-subtle flex items-center justify-between text-[11px] h-7 shrink-0">
        <span 
          className="text-faint hover:text-muted cursor-grab active:cursor-grabbing flex items-center gap-1 font-medium" 
          title="Drag to rearrange folders"
        >
          <GripHorizontal size={13} />
          <span className="text-[10px] hidden sm:inline">Reorder</span>
        </span>

        <span className="font-bold text-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-xs">
          <span>Open</span>
          <span>&rarr;</span>
        </span>
      </div>
    </div>
  );
};
