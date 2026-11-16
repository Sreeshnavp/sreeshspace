import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import type { CategoryInfo } from '../types';

interface EditCategoryModalProps {
  isOpen: boolean;
  category: CategoryInfo | null;
  onClose: () => void;
  onSave: (updated: CategoryInfo) => void;
  onDelete: (id: string, name: string) => void;
}

const EMOJI_OPTIONS = ['🌿', '🛠️', '🎨', '📚', '☕', '💡', '🚀', '💻', '🎮', '🍕', '🌟', '🎯', '✨', '🎬', '🎧', '📁'];
const COLOR_OPTIONS = ['#4e876c', '#38bdf8', '#f7885e', '#aa73d7', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#4e876c');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || '📁');
      setColor(category.color || '#4e876c');
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
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-espresso-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-espresso-900 rounded-3xl shadow-2xl border border-cream-300 dark:border-espresso-800 p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-cream-200 dark:border-espresso-800 mb-4">
          <h3 className="font-bold text-base text-espresso-900 dark:text-cream-50">
            Edit Category
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-espresso-800/40 hover:text-espresso-800 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-espresso-800 dark:text-cream-100 mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work & Projects"
              className="w-full px-3.5 py-2 rounded-2xl border border-cream-300 dark:border-espresso-750 bg-cream-50/50 dark:bg-espresso-850 text-espresso-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>

          {/* Emoji selection */}
          <div>
            <label className="block text-xs font-bold text-espresso-800 dark:text-cream-100 mb-1">
              Choose Icon
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-cream-50/70 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 text-center text-lg">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`p-1 rounded-xl transition ${icon === e ? 'bg-white dark:bg-espresso-700 shadow-xs scale-110' : 'hover:scale-105'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color selection */}
          <div>
            <label className="block text-xs font-bold text-espresso-800 dark:text-cream-100 mb-1">
              Theme Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-cream-200 dark:border-espresso-800">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete the "${category.name}" category? Links inside will stay safe under Work & Projects.`)) {
                  onDelete(category.id, category.name);
                  onClose();
                }
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-espresso-800/60 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sage-600 hover:bg-sage-500 text-white rounded-xl text-xs font-bold shadow-pill"
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
