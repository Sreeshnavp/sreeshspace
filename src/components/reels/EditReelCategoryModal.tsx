import React, { useState, useEffect } from 'react';
import { X, Trash2, Sparkles, Check } from 'lucide-react';
import type { CategoryInfo } from '../../types';
import { CATEGORY_KEYS, getCategoryToken } from '../../utils/themeColors';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface EditReelCategoryModalProps {
  isOpen: boolean;
  category: CategoryInfo | null;
  onClose: () => void;
  onSave: (category: CategoryInfo) => void;
  onDelete?: (id: string) => void;
}

const COMMON_EMOJIS = ['🎬', '💪', '🍳', '💻', '✨', '✈️', '🎵', '🎨', '📚', '😂', '🌿', '☕', '👗', '🧘'];

export const EditReelCategoryModal: React.FC<EditReelCategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('rose');
  const [icon, setIcon] = useState('🎬');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (category) {
      setName(category.name);
      setColor(category.color || 'rose');
      setIcon(category.icon || '🎬');
      setIsDeleting(false);
    } else {
      setName('');
      setColor('rose');
      setIcon('🎬');
      setIsDeleting(false);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    playPopSound();
    triggerPartyPop('single');

    const nowIso = new Date().toISOString();
    const updated: CategoryInfo = {
      id: category ? category.id : `reel_cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      color,
      icon,
      createdAt: category ? category.createdAt : nowIso,
      updatedAt: nowIso,
      order: category?.order,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface text-main rounded-3xl border border-subtle shadow-raised p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-extrabold text-base text-main">
              {category ? 'Edit Collection' : 'New Reel Collection'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-sunken text-muted hover:text-main cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Collection Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recipes, Morning Workouts, UI Inspo"
              className="w-full bg-sunken border border-subtle rounded-xl px-3.5 py-2 text-xs font-semibold text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40"
              autoFocus
            />
          </div>

          {/* Emoji Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Choose Icon
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-sunken border border-subtle">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setIcon(emoji);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition cursor-pointer ${
                    icon === emoji
                      ? 'bg-surface shadow-2xs scale-110 border border-subtle font-bold'
                      : 'hover:bg-surface/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Pastel Color Theme */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Color Theme
            </label>
            <div className="flex items-center gap-2">
              {CATEGORY_KEYS.map((k) => {
                const token = getCategoryToken(k);
                const isSelected = color === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setColor(k);
                    }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition cursor-pointer ${
                      isSelected ? 'ring-2 ring-main ring-offset-2 scale-110 shadow-2xs' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: token.softVar }}
                    title={k}
                  >
                    {isSelected && <Check size={12} style={{ color: token.textVar }} className="stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            {category && onDelete ? (
              isDeleting ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      onDelete(category.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-danger text-white text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    Confirm Delete?
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="px-2 py-1 rounded-xl bg-sunken text-muted text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="p-2 rounded-xl text-faint hover:text-danger hover:bg-sunken transition cursor-pointer"
                  title="Delete collection"
                >
                  <Trash2 size={16} />
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-sunken text-muted hover:text-main text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer"
              >
                {category ? 'Save Changes' : 'Create Collection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
