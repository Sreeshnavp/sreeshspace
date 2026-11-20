import React, { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { CategoryInfo, LinkItem } from '../types';
import { getCategoryToken } from '../utils/themeColors';
import './links.css';

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

  // Pastel background helper based on category color
  const getPastelBg = () => {
    const c = (category.color || '').toLowerCase();
    if (c === 'sky' || c === 'blue') return 'var(--orbit-sky)';
    if (c === 'peach' || c === 'pink' || c === 'rose') return 'var(--orbit-pink)';
    if (c === 'sage' || c === 'green') return 'var(--orbit-green-soft)';
    if (c === 'amber' || c === 'yellow' || c === 'honey') return '#fde3a1';
    return catToken.softVar || 'var(--orbit-sky)';
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
      className={`orbit-card ${
        isDragOver ? 'ring-4 ring-green-600/30 scale-[1.02] border-green-700' : ''
      }`}
      style={{ cursor: 'pointer' }}
    >
      {/* Liquid drop animation overlay */}
      {isDragOver && (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center font-bold text-sm pointer-events-none"
          style={{ background: 'var(--orbit-green)', color: '#ffffff', borderRadius: '24px' }}
        >
          <Sparkles size={28} className="mb-1.5 animate-bounce" />
          <span>Drop to file into {category.name}!</span>
        </div>
      )}

      {/* 1. Header: Icon, Category Name, Count, Edit Button */}
      <div className="fh">
        <div 
          className="fi" 
          style={{ background: getPastelBg(), color: 'var(--orbit-ink)' }}
        >
          {category.icon || '📁'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {category.name}
          </h3>
          <small>
            {bundleLinks.length} {bundleLinks.length === 1 ? 'bookmark' : 'bookmarks'}
          </small>
        </div>
        <button
          className="ib"
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(category);
          }}
          aria-label={`Edit ${category.name}`}
          title="Edit folder"
        >
          ✏️
        </button>
      </div>

      {/* 2. Symmetrical 2x2 Slots Grid */}
      <div className="slots">
        {[0, 1, 2, 3].map((slotIndex) => {
          const link = bundleLinks[slotIndex];
          const isOverflowTile = slotIndex === 3 && bundleLinks.length > 4;

          if (link) {
            const initial = (link.title?.[0] || 'L').toUpperCase();
            return (
              <div
                key={link.id || slotIndex}
                className="lk"
                title={link.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFolder(category);
                }}
              >
                <i 
                  className="dot" 
                  style={{ 
                    background: link.favicon ? 'transparent' : '#4285f4',
                    border: link.favicon ? '1px solid var(--orbit-line)' : 'none'
                  }}
                >
                  {link.favicon ? (
                    <img src={link.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    initial
                  )}
                </i>
                <span>
                  {isOverflowTile ? `+${bundleLinks.length - 3} more` : (link.title.split(' ')[0] || 'Link')}
                </span>
              </div>
            );
          }

          // Empty quadrant placeholder
          return (
            <div
              key={`empty-${slotIndex}`}
              className="empty-slot"
              title="Empty slot · drop link here"
            >
              +
            </div>
          );
        })}
      </div>

      {/* 3. Footer: Reorder cue and Open action */}
      <div className="ff">
        <span 
          style={{ cursor: 'grab', userSelect: 'none' }} 
          title="Drag to rearrange folders"
        >
          ⠿ Reorder
        </span>
        <button 
          className="open-action" 
          onClick={(e) => {
            e.stopPropagation();
            onOpenFolder(category);
          }}
        >
          Open →
        </button>
      </div>
    </article>
  );
};
