import React from 'react';
import { X, Play, Plus, Edit3, Film, Sparkles } from 'lucide-react';
import type { CategoryInfo, ReelItem } from '../../types';
import { ReelCard } from './ReelCard';
import { getCategoryToken } from '../../utils/themeColors';
import { playPopSound } from '../../utils/delight';

interface ReelFolderModalProps {
  category: CategoryInfo | null;
  reels: ReelItem[];
  isOpen: boolean;
  onClose: () => void;
  onPlayInSequence: (reel?: ReelItem) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (reel: ReelItem) => void;
  onDelete: (id: string) => void;
  onAddReelToCategory: (categoryName: string) => void;
  onEditCategory: (category: CategoryInfo) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
}

export const ReelFolderModal: React.FC<ReelFolderModalProps> = ({
  category,
  reels,
  isOpen,
  onClose,
  onPlayInSequence,
  onToggleFavorite,
  onEdit,
  onDelete,
  onAddReelToCategory,
  onEditCategory,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDrop,
}) => {
  if (!isOpen || !category) return null;

  const catToken = getCategoryToken(category.color || category.name);
  const folderReels = reels.filter(
    (r) => (r.collection || '').toLowerCase().trim() === category.name.toLowerCase().trim()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-main/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-surface text-main rounded-3xl border border-subtle shadow-raised p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-soft"
              style={{ backgroundColor: catToken.softVar, color: catToken.textVar }}
            >
              {category.icon || '🎬'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-main leading-tight">
                  {category.name}
                </h2>
                <button
                  type="button"
                  onClick={() => onEditCategory(category)}
                  className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
                  title="Rename collection"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <p className="text-[11px] text-muted font-medium mt-0.5">
                {folderReels.length} {folderReels.length === 1 ? 'reel' : 'reels'} in collection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Play all in sequence */}
            {folderReels.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  onPlayInSequence(folderReels[0]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sunken hover:bg-surface border border-subtle text-main font-bold text-xs transition active:scale-95 shadow-2xs cursor-pointer"
              >
                <Play size={12} className="fill-current text-rose-500" />
                <span>Play Sequence</span>
              </button>
            )}

            {/* Add Reel directly to this category */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                onAddReelToCategory(category.name);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft transition active:scale-95 cursor-pointer"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span>+ Add Reel</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-sunken text-muted hover:text-main cursor-pointer transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content: Reels in this category */}
        <div className="flex-1 overflow-y-auto pr-1">
          {folderReels.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Film size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-main">This collection is empty</h4>
                <p className="text-xs text-muted max-w-xs mx-auto">
                  Drag reels from your canvas onto this category square, or tap + Add Reel to save one directly here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {folderReels.map((reel, idx) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  onPlayInSequence={onPlayInSequence}
                  onToggleFavorite={onToggleFavorite}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < folderReels.length - 1}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
