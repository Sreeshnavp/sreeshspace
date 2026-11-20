import React, { useState, useRef } from 'react';
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

  // Pastel theme mapping based on category color
  const getGradientClass = () => {
    const c = (category.color || '').toLowerCase();
    if (c === 'sky' || c === 'blue') return 'from-sky-subtle/40 hover:border-sky-accent/40';
    if (c === 'peach' || c === 'pink' || c === 'rose') return 'from-peach-subtle/40 hover:border-tertiary-container/30';
    if (c === 'sage' || c === 'green') return 'from-mint-subtle/40 hover:border-secondary/40';
    if (c === 'amber' || c === 'yellow' || c === 'honey') return 'from-sunshine-subtle/40 hover:border-sunshine-accent/40';
    return 'from-lavender-subtle/40 hover:border-primary/40';
  };

  const getBadgeClass = () => {
    const c = (category.color || '').toLowerCase();
    if (c === 'sky' || c === 'blue') return 'bg-sky-subtle text-sky-accent ring-sky-accent/20';
    if (c === 'peach' || c === 'pink' || c === 'rose') return 'bg-peach-subtle text-tertiary ring-tertiary-container/20';
    if (c === 'sage' || c === 'green') return 'bg-mint-subtle text-secondary ring-secondary/20';
    if (c === 'amber' || c === 'yellow' || c === 'honey') return 'bg-sunshine-subtle text-sunshine-accent ring-sunshine-accent/20';
    return 'bg-lavender-subtle text-primary ring-primary/20';
  };

  return (
    <article
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
      className={`folder-dropzone bg-surface-card rounded-3xl p-4 shadow-[0_3px_14px_rgba(21,19,17,0.04)] border border-border-subtle flex flex-col gap-3 transition-all duration-200 relative overflow-hidden bg-gradient-to-br via-surface-card to-surface-card cursor-pointer ${getGradientClass()} ${
        isDragOver ? 'ring-2 ring-primary scale-[1.02] bg-lavender-subtle/40' : ''
      }`}
    >
      {/* Folder Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] shadow-sm ring-2 shrink-0 ${getBadgeClass()}`}>
            {category.icon || '📁'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight font-fraunces truncate">
                {category.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold shrink-0 ${getBadgeClass()}`}>
                {bundleLinks.length}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {bundleLinks.length} {bundleLinks.length === 1 ? 'bookmark' : 'bookmarks'}
            </p>
          </div>
        </div>

        <button
          className="w-8 h-8 rounded-full bg-canvas-bg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shrink-0 shadow-xs"
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(category);
          }}
          title="Edit folder"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      </div>

      {/* 2x2 Link Pill Slots */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        {[0, 1, 2, 3].map((slotIdx) => {
          const link = bundleLinks[slotIdx];
          const isOverflow = slotIdx === 3 && bundleLinks.length > 4;

          if (link) {
            const initial = (link.title?.[0] || 'L').toUpperCase();
            return (
              <div
                key={link.id || slotIdx}
                className="link-pill flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-canvas-bg text-on-surface font-label-md text-label-md shadow-sm border border-border-subtle hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all min-w-0"
                title={link.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFolder(category);
                }}
              >
                <span className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center text-[11px] shadow-xs font-bold text-primary shrink-0 overflow-hidden">
                  {link.favicon ? (
                    <img src={link.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    initial
                  )}
                </span>
                <span className="truncate flex-1 font-semibold text-xs">
                  {isOverflow ? `+${bundleLinks.length - 3} more` : link.title}
                </span>
              </div>
            );
          }

          return (
            <div
              key={`empty-${slotIdx}`}
              className="slot-target flex items-center justify-center py-2.5 rounded-2xl border-2 border-dashed border-outline-variant/60 text-outline hover:text-primary hover:border-primary/60 cursor-pointer bg-canvas-bg/50 active:scale-95 transition-all text-sm font-bold"
              title="Empty slot · drop link here"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </div>
          );
        })}
      </div>

      {/* Footer Strip */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-on-surface-variant font-label-sm text-label-sm">
        <div className="flex items-center gap-1 cursor-move text-outline">
          <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          <span className="text-[11px]">Reorder</span>
        </div>
        <button
          className="flex items-center gap-1 text-primary font-bold hover:underline py-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFolder(category);
          }}
        >
          <span>Open</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
    </article>
  );
};
