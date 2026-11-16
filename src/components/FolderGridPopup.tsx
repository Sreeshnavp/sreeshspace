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
import { extractDomain } from '../utils/urlHelper';
import { getCategoryToken } from '../utils/themeColors';

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

  const catToken = getCategoryToken(category.color || category.name);

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
        isBackdropOver ? 'bg-accent/40' : 'bg-main/50 backdrop-blur-md'
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
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 px-5 py-2.5 rounded-full bg-surface shadow-raised border border-accent text-xs sm:text-sm font-bold text-accent flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>Release here to move link out to the Home canvas!</span>
        </div>
      )}

      <div 
        className="w-full max-w-3xl bg-surface border border-subtle rounded-3xl shadow-raised flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200 text-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-5 sm:p-6 pb-4 border-b border-subtle flex items-center justify-between bg-surface"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-2xs"
              style={{ backgroundColor: catToken.softVar, color: catToken.textVar }}
            >
              {category.icon || '📁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-main">
                  {category.name}
                </h2>
                <button
                  onClick={() => onEditCategory(category)}
                  className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
                  title="Rename folder"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <p className="text-xs text-muted font-medium">
                {categoryLinks.length} {categoryLinks.length === 1 ? 'bookmark' : 'bookmarks'} • Drag to re-order or drag outside to remove!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddNewLinkToCategory(category.name)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-2xl text-xs font-bold shadow-soft transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Link</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-sunken">
          {categoryLinks.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-surface border border-subtle text-faint flex items-center justify-center mb-3">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-bold text-main mb-1">
                This folder is empty
              </h4>
              <p className="text-xs text-muted mb-4 max-w-xs mx-auto">
                Drag any link from the home screen into this folder, or add one below!
              </p>
              <button
                onClick={() => onAddNewLinkToCategory(category.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-2xl text-xs font-bold shadow-soft active:scale-95 transition cursor-pointer"
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
                    className={`group relative flex flex-col justify-between bg-surface rounded-3xl p-4 sm:p-4.5 border shadow-soft transition-all duration-200 cursor-grab active:cursor-grabbing h-[205px] overflow-hidden ${
                      isOver
                        ? 'border-accent bg-accent-soft scale-[1.02] ring-4 ring-ring/30'
                        : isDraggingThis
                        ? 'opacity-30 border-dashed border-accent scale-95'
                        : 'border-subtle hover:shadow-soft-hover hover:border-strong hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top Bar: Grip + Favicon + Domain + Star */}
                    <div className="flex items-center justify-between gap-1.5 h-7 shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-faint group-hover:text-muted cursor-grab" title="Drag to reorder or drag outside to remove">
                          <GripVertical size={14} />
                        </span>

                        <div className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0 border border-subtle overflow-hidden">
                          {link.favicon ? (
                            <img src={link.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                          ) : (
                            <ExternalLink size={11} className="text-faint" />
                          )}
                        </div>

                        <span className="text-[11px] text-faint truncate font-medium">
                          {domain}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(link.id);
                        }}
                        className={`p-1 rounded-lg transition cursor-pointer ${
                          link.pinned ? 'text-accent' : 'text-faint hover:text-muted'
                        }`}
                      >
                        <Star size={15} className={link.pinned ? 'fill-accent text-accent' : ''} />
                      </button>
                    </div>

                    {/* Middle Body */}
                    <div className="my-auto h-[88px] flex flex-col justify-between overflow-hidden">
                      <h4 className="font-extrabold text-xs sm:text-sm text-main leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                        {link.title || link.url}
                      </h4>

                      {link.notes ? (
                        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed bg-sunken px-2.5 py-1 rounded-xl border border-subtle font-normal">
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
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-text bg-accent-soft px-2.5 py-0.5 rounded-full border border-subtle hover:opacity-90 transition active:scale-95 cursor-pointer"
                          >
                            <Paperclip size={10} />
                            <span>{link.attachments.length} file(s) • View</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-faint italic">
                          No notes added
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 mt-auto border-t border-subtle flex items-center justify-between text-xs h-7 shrink-0">
                      {/* Move to another category dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingLinkId(movingLinkId === link.id ? null : link.id);
                          }}
                          className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
                          title="Move to another category"
                        >
                          <FolderInput size={13} />
                        </button>

                        {movingLinkId === link.id && (
                          <div 
                            className="absolute left-0 bottom-full mb-1 z-30 w-44 bg-raised rounded-2xl shadow-raised border border-subtle py-1.5 text-xs text-main animate-in fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-1 font-bold text-[10px] uppercase text-faint border-b border-subtle">
                              Move to...
                            </div>
                            <button
                              onClick={() => {
                                onMoveLinkCategory(link.id, 'Uncategorized');
                                setMovingLinkId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-sunken font-medium text-xs flex items-center gap-1.5 cursor-pointer"
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
                                className="w-full text-left px-3 py-1.5 hover:bg-sunken font-medium text-xs flex items-center gap-1.5 cursor-pointer"
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
                          className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
                          title="Copy link"
                        >
                          {isCopied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditLink(link);
                          }}
                          className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLink(link.id);
                          }}
                          className="p-1 text-faint hover:text-danger rounded-lg hover:bg-sunken transition cursor-pointer"
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
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-accent-text bg-accent-soft hover:bg-accent hover:text-on-accent rounded-xl transition border border-subtle ml-1 cursor-pointer"
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
        <div className="px-6 py-3 border-t border-subtle bg-sunken flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-on-accent bg-accent hover:bg-accent-hover rounded-xl shadow-soft transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
