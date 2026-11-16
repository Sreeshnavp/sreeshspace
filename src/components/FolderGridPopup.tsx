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
  GripVertical, 
  FolderInput,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import type { LinkItem, CategoryInfo, Attachment } from '../types';
import { extractDomain, formatRelativeTime } from '../utils/urlHelper';

interface FolderGridPopupProps {
  category: CategoryInfo | null;
  links: LinkItem[];
  allCategories: CategoryInfo[];
  onClose: () => void;
  onOpenLinkDetail: (link: LinkItem) => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onVisitLink: (link: LinkItem) => void;
  onOpenAttachment: (attachment: Attachment) => void;
  onAddNewLinkToCategory: (categoryName: string) => void;
  onEditCategory: (category: CategoryInfo) => void;
  onMoveLinkCategory: (linkId: string, newCategoryName: string) => void;
  onReorderLinksInCategory: (reorderedLinks: LinkItem[]) => void;
}

export const FolderGridPopup: React.FC<FolderGridPopupProps> = ({
  category,
  links,
  allCategories,
  onClose,
  onOpenLinkDetail,
  onEditLink,
  onDeleteLink,
  onTogglePin,
  onVisitLink,
  onOpenAttachment,
  onAddNewLinkToCategory,
  onEditCategory,
  onMoveLinkCategory,
  onReorderLinksInCategory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [movingLinkId, setMovingLinkId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isBackdropOver, setIsBackdropOver] = useState(false);

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

  // Drag start for cards inside this folder
  const handleDragStart = (e: React.DragEvent, index: number, linkId: string) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', linkId);
    e.dataTransfer.setData('application/link-id', linkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleCardDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const items = [...categoryLinks];
      const [movedItem] = items.splice(draggedIndex, 1);
      items.splice(dropIndex, 0, movedItem);

      const otherLinks = links.filter(
        (l) => (l.category || '').toLowerCase() !== category.name.toLowerCase()
      );
      onReorderLinksInCategory([...items, ...otherLinks]);
    }
    setDraggedIndex(null);
  };

  // Dropping onto backdrop moves card out of the category to the home canvas!
  const handleBackdropDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBackdropOver(false);

    const linkId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/link-id');
    if (linkId) {
      onMoveLinkCategory(linkId, 'Uncategorized');
    }
    setDraggedIndex(null);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 transition-all duration-300 ${
        isBackdropOver ? 'bg-sage-950/70' : 'bg-espresso-950/50 backdrop-blur-md'
      }`}
      onClick={onClose}
      onDragOver={(e) => {
        e.preventDefault();
        setIsBackdropOver(true);
      }}
      onDragLeave={() => setIsBackdropOver(false)}
      onDrop={handleBackdropDrop}
    >
      {/* Drop-outside liquid notice */}
      {isBackdropOver && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 px-5 py-2.5 rounded-full bg-white/90 dark:bg-espresso-850/90 shadow-2xl border border-sage-400 text-xs sm:text-sm font-bold text-sage-700 dark:text-sage-300 flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>Release here to move link out to the Home canvas!</span>
        </div>
      )}

      <div 
        className="w-full max-w-3xl bg-cream-50/95 dark:bg-espresso-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-cream-200/80 dark:border-espresso-750 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Liquid Pastel Glow */}
        <div 
          className="p-5 sm:p-6 pb-4 border-b border-cream-200/80 dark:border-espresso-800 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${category.color}18 0%, transparent 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
              style={{ backgroundColor: `${category.color}25` }}
            >
              {category.icon || '📁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-espresso-900 dark:text-cream-50">
                  {category.name}
                </h2>
                <button
                  onClick={() => onEditCategory(category)}
                  className="p-1 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg hover:bg-cream-200 dark:hover:bg-espresso-800 transition"
                  title="Rename folder"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <p className="text-xs text-espresso-800/50 dark:text-cream-100/50 font-medium">
                {categoryLinks.length} {categoryLinks.length === 1 ? 'bookmark' : 'bookmarks'} • Drag to re-order or drag outside to remove!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddNewLinkToCategory(category.name)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sage-600 hover:bg-sage-500 text-white rounded-2xl text-xs font-bold shadow-pill transition-all active:scale-95"
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

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {categoryLinks.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cream-200 dark:bg-espresso-800 text-espresso-800/40 flex items-center justify-center mb-3">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-bold text-espresso-900 dark:text-cream-50 mb-1">
                This folder is empty
              </h4>
              <p className="text-xs text-espresso-800/50 dark:text-cream-100/50 mb-4 max-w-xs mx-auto">
                Drag any link from the home screen into this folder, or add one below!
              </p>
              <button
                onClick={() => onAddNewLinkToCategory(category.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-600 text-white rounded-2xl text-xs font-bold shadow-pill active:scale-95 transition"
              >
                <Plus size={14} />
                <span>Add first bookmark</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {categoryLinks.map((link, index) => {
                const domain = extractDomain(link.url);
                const isCopied = copiedId === link.id;
                const isOver = dragOverIndex === index;
                const isDraggingThis = draggedIndex === index;

                return (
                  <div
                    key={link.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, link.id)}
                    onDragOver={(e) => handleCardDragOver(e, index)}
                    onDrop={(e) => handleCardDrop(e, index)}
                    onClick={() => onOpenLinkDetail(link)}
                    className={`group relative flex flex-col justify-between bg-white dark:bg-espresso-850 rounded-3xl p-4 sm:p-4.5 border shadow-soft transition-all duration-200 cursor-grab active:cursor-grabbing h-[205px] overflow-hidden ${
                      isOver
                        ? 'border-sage-500 bg-sage-50 dark:bg-sage-950/80 scale-[1.02] ring-4 ring-sage-400/30'
                        : isDraggingThis
                        ? 'opacity-30 border-dashed border-sage-400 scale-95'
                        : 'border-cream-200/90 dark:border-espresso-750 hover:shadow-soft-hover hover:border-sage-300 dark:hover:border-sage-600 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top Bar: Grip + Favicon + Domain + Star */}
                    <div className="flex items-center justify-between gap-1.5 h-7 shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-espresso-800/25 group-hover:text-espresso-800/60 dark:text-cream-100/25 cursor-grab" title="Drag to reorder or drag outside to remove">
                          <GripVertical size={14} />
                        </span>

                        <div className="w-6 h-6 rounded-lg bg-cream-100 dark:bg-espresso-800 flex items-center justify-center shrink-0 border border-cream-200 dark:border-espresso-750 overflow-hidden">
                          {link.favicon ? (
                            <img src={link.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                          ) : (
                            <ExternalLink size={11} className="text-espresso-800/40" />
                          )}
                        </div>

                        <span className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 truncate font-medium">
                          {domain}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(link.id);
                        }}
                        className={`p-1 rounded-lg transition ${
                          link.pinned ? 'text-amber-500' : 'text-espresso-800/20 hover:text-amber-400'
                        }`}
                      >
                        <Star size={15} className={link.pinned ? 'fill-amber-400 text-amber-500' : ''} />
                      </button>
                    </div>

                    {/* Middle Body: Symmetrical 88px area */}
                    <div className="my-auto h-[88px] flex flex-col justify-between overflow-hidden">
                      <h4 className="font-extrabold text-xs sm:text-sm text-espresso-900 dark:text-cream-50 leading-tight line-clamp-2 group-hover:text-sage-600 transition-colors">
                        {link.title || link.url}
                      </h4>

                      {link.notes ? (
                        <p className="text-[11px] text-espresso-800/70 dark:text-cream-100/70 line-clamp-2 leading-relaxed bg-cream-50 dark:bg-espresso-900 px-2.5 py-1 rounded-xl border border-cream-200/70 dark:border-espresso-800 font-normal">
                          {link.notes}
                        </p>
                      ) : link.attachments && link.attachments.length > 0 ? (
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAttachment(link.attachments[0]);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-peach-600 dark:text-peach-300 bg-peach-50 dark:bg-peach-950 px-2.5 py-0.5 rounded-full border border-peach-200 dark:border-peach-900 hover:bg-peach-100 transition active:scale-95"
                          >
                            <Paperclip size={10} />
                            <span>{link.attachments.length} file(s) • View</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-espresso-800/35 dark:text-cream-100/35 italic">
                          No notes added
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 mt-auto border-t border-cream-200 dark:border-espresso-800 flex items-center justify-between text-xs h-7 shrink-0">
                      {/* Move to another category dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingLinkId(movingLinkId === link.id ? null : link.id);
                          }}
                          className="p-1 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
                          title="Move to another category"
                        >
                          <FolderInput size={13} />
                        </button>

                        {movingLinkId === link.id && (
                          <div 
                            className="absolute left-0 bottom-full mb-1 z-30 w-44 bg-white dark:bg-espresso-800 rounded-2xl shadow-xl border border-cream-300 dark:border-espresso-700 py-1.5 text-xs text-espresso-800 dark:text-cream-100 animate-in fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-1 font-bold text-[10px] uppercase text-espresso-800/40 border-b border-cream-200 dark:border-espresso-700">
                              Move to...
                            </div>
                            <button
                              onClick={() => {
                                onMoveLinkCategory(link.id, 'Uncategorized');
                                setMovingLinkId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-cream-100 dark:hover:bg-espresso-750 font-medium text-xs flex items-center gap-1.5"
                            >
                              <span>📎</span> <span>Home Canvas</span>
                            </button>
                            {allCategories.filter(c => c.name.toLowerCase() !== category.name.toLowerCase()).map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  onMoveLinkCategory(link.id, c.name);
                                  setMovingLinkId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-cream-100 dark:hover:bg-espresso-750 font-medium text-xs flex items-center gap-1.5"
                              >
                                <span>{c.icon || '📁'}</span>
                                <span className="truncate">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCopy(e, link)}
                          className="p-1 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
                          title="Copy link"
                        >
                          {isCopied ? <Check size={13} className="text-sage-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditLink(link);
                          }}
                          className="p-1 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLink(link.id);
                          }}
                          className="p-1 text-espresso-800/40 hover:text-red-500 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVisitLink(link);
                            window.open(link.url, '_blank', 'noopener,noreferrer');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sage-700 bg-sage-50 hover:bg-sage-100 dark:bg-sage-950/60 dark:text-sage-300 rounded-xl transition border border-sage-200/80 dark:border-sage-800 ml-1"
                        >
                          <span>Open</span>
                          <ArrowUpRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-sage-600 hover:bg-sage-500 rounded-xl shadow-pill transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
