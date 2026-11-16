import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Star, 
  Paperclip,
  FolderEdit,
  Folder
} from 'lucide-react';
import type { LinkItem, CategoryInfo } from '../types';
import { extractDomain, formatRelativeTime } from '../utils/urlHelper';

interface CategoryFolderModalProps {
  category: CategoryInfo | null;
  links: LinkItem[];
  onClose: () => void;
  onOpenLinkDetail: (link: LinkItem) => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onVisitLink: (link: LinkItem) => void;
  onAddNewLinkToCategory: (categoryName: string) => void;
  onEditCategory: (category: CategoryInfo) => void;
}

export const CategoryFolderModal: React.FC<CategoryFolderModalProps> = ({
  category,
  links,
  onClose,
  onOpenLinkDetail,
  onEditLink,
  onDeleteLink,
  onTogglePin,
  onVisitLink,
  onAddNewLinkToCategory,
  onEditCategory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!category) return null;

  const categoryLinks = links.filter(
    (l) => (l.category || '').toLowerCase() === category.name.toLowerCase()
  );

  const handleCopy = (e: React.MouseEvent, link: LinkItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-espresso-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-espresso-900 rounded-3xl shadow-2xl border border-cream-300 dark:border-espresso-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-5 sm:p-6 pb-4 border-b border-cream-200 dark:border-espresso-800 flex items-center justify-between"
          style={{ backgroundColor: `${category.color}08` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl select-none">{category.icon || '📁'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-espresso-900 dark:text-cream-50">
                  {category.name}
                </h2>
                <button
                  onClick={() => onEditCategory(category)}
                  className="p-1 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg hover:bg-cream-200 dark:hover:bg-espresso-800 transition"
                  title="Rename or edit category"
                >
                  <Edit3 size={14} />
                </button>
              </div>
              <p className="text-xs text-espresso-800/50 dark:text-cream-100/50">
                {categoryLinks.length} {categoryLinks.length === 1 ? 'bookmark' : 'bookmarks'} in this folder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddNewLinkToCategory(category.name)}
              className="flex items-center gap-1 px-3 py-1.5 bg-sage-600 hover:bg-sage-500 text-white rounded-xl text-xs font-bold shadow-pill transition active:scale-95"
            >
              <Plus size={14} />
              <span>Add Link</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-200 dark:hover:bg-espresso-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {categoryLinks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cream-100 dark:bg-espresso-800 text-espresso-800/40 flex items-center justify-center mb-2">
                <Folder size={24} />
              </div>
              <p className="text-sm font-semibold text-espresso-900 dark:text-cream-50 mb-1">
                This folder is empty
              </p>
              <p className="text-xs text-espresso-800/50 dark:text-cream-100/50 mb-3">
                Drag any link from the "All Links" page and drop it onto this folder, or add one now!
              </p>
              <button
                onClick={() => onAddNewLinkToCategory(category.name)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-sage-600 text-white rounded-xl text-xs font-bold"
              >
                <Plus size={13} />
                <span>Add first link</span>
              </button>
            </div>
          ) : (
            categoryLinks.map((link) => (
              <div
                key={link.id}
                onClick={() => onOpenLinkDetail(link)}
                className="group flex items-center justify-between gap-3 p-3.5 bg-cream-50/60 dark:bg-espresso-850 rounded-2xl border border-cream-200 dark:border-espresso-800 hover:border-sage-400 dark:hover:border-sage-600 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(link.id);
                    }}
                    className="text-espresso-800/20 hover:text-amber-500 transition shrink-0"
                  >
                    <Star size={16} className={link.pinned ? 'fill-amber-400 text-amber-500' : ''} />
                  </button>

                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-espresso-900 flex items-center justify-center shrink-0 border border-cream-300 dark:border-espresso-750 overflow-hidden">
                    {link.favicon ? (
                      <img src={link.favicon} alt="" className="w-4 h-4 object-contain" />
                    ) : (
                      <ExternalLink size={12} className="text-espresso-800/40" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-espresso-900 dark:text-cream-50 truncate group-hover:text-sage-600 transition-colors">
                        {link.title || link.url}
                      </span>
                      {link.attachments && link.attachments.length > 0 && (
                        <Paperclip size={11} className="text-peach-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-espresso-800/40 dark:text-cream-100/40 mt-0.5">
                      <span className="truncate max-w-[140px]">{extractDomain(link.url)}</span>
                      {link.notes && (
                        <span className="hidden sm:inline truncate max-w-[280px] text-espresso-800/60 dark:text-cream-100/60">
                          • {link.notes.split('\n')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleCopy(e, link)}
                    className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg hover:bg-cream-200 dark:hover:bg-espresso-800 transition"
                    title="Copy URL"
                  >
                    {copiedId === link.id ? <Check size={14} className="text-sage-600" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditLink(link);
                    }}
                    className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg hover:bg-cream-200 dark:hover:bg-espresso-800 transition"
                    title="Edit"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLink(link.id);
                    }}
                    className="p-1.5 text-espresso-800/40 hover:text-red-500 rounded-lg hover:bg-cream-200 dark:hover:bg-espresso-800 transition"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVisitLink(link);
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-sage-700 bg-sage-50 hover:bg-sage-100 dark:bg-sage-950/60 dark:text-sage-300 rounded-xl transition"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-800 rounded-xl"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
