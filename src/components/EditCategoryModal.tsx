import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { CategoryInfo } from '../types';
import { CATEGORY_KEYS, CATEGORY_TOKENS, resolveCategoryKey } from '../utils/themeColors';

interface EditCategoryModalProps {
  isOpen: boolean;
  category: CategoryInfo | null;
  onClose: () => void;
  onSave: (updated: CategoryInfo) => void;
  onDelete: (id: string, name: string) => void;
}

const EMOJI_OPTIONS = ['🌿', '🛠️', '🎨', '📚', '☕', '💡', '🚀', '💻', '🎮', '🍕', '🌟', '🎯', '✨', '🎬', '🎧', '📁'];

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('sage');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || '📁');
      setColor(resolveCategoryKey(category.color));
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...category,
      name: name.trim(),
      icon,
      color,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-surface rounded-3xl shadow-raised border border-subtle p-6 overflow-hidden text-main"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4">
          <h3 className="font-bold text-base text-main">
            Edit Category
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-faint hover:text-main rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-main mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work & Projects"
              className="w-full px-3.5 py-2 rounded-2xl border border-input bg-sunken text-main focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Emoji selection */}
          <div>
            <label className="block text-xs font-bold text-main mb-1">
              Choose Icon
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-sunken border border-subtle text-center text-lg">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`p-1 rounded-xl transition cursor-pointer ${icon === e ? 'bg-surface shadow-2xs scale-110 border border-subtle' : 'hover:scale-105'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color selection */}
          <div>
            <label className="block text-xs font-bold text-main mb-1">
              Category Hue
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setColor(k)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${color === k ? 'scale-125 ring-2 ring-ring' : 'opacity-80 hover:opacity-100 border-subtle'}`}
                  style={{ backgroundColor: CATEGORY_TOKENS[k].solidVar }}
                  title={CATEGORY_TOKENS[k].name}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete the "${category.name}" category? Links inside will stay safe under Work & Projects.`)) {
                  onDelete(category.id, category.name);
                  onClose();
                }
              }}
              className="text-xs font-semibold text-danger hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-muted hover:text-main font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-xl text-xs font-bold shadow-soft cursor-pointer transition"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
