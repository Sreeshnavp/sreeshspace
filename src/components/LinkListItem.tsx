import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  Paperclip, 
  Edit3, 
  Trash2,
  GripVertical
} from 'lucide-react';
import type { LinkItem, CategoryInfo } from '../types';
import { extractDomain, formatRelativeTime } from '../utils/urlHelper';

interface LinkListItemProps {
  link: LinkItem;
  categories: CategoryInfo[];
  onOpenDetail: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onVisit: (link: LinkItem) => void;
}

export const LinkListItem: React.FC<LinkListItemProps> = ({
  link,
  categories,
  onOpenDetail,
  onEdit,
  onDelete,
  onTogglePin,
  onVisit,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const domain = extractDomain(link.url);
  const category = categories.find((c) => c.name === link.category);
  const categoryColor = category?.color || '#4e876c';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVisit(link);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(link.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', link.id);
    e.dataTransfer.setData('application/link-id', link.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetail(link)}
      className="group flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-espresso-850 rounded-2xl border border-cream-300/80 dark:border-espresso-800 shadow-soft hover:shadow-soft-hover hover:border-sage-300 dark:hover:border-sage-700 transition cursor-pointer active:cursor-grabbing"
    >
      {/* Favicon & Title & Domain */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span 
          className="text-espresso-800/20 hover:text-espresso-800/50 cursor-grab active:cursor-grabbing" 
          title="Drag to move into a category square"
        >
          <GripVertical size={14} />
        </span>

        <button
          onClick={handlePin}
          className="text-espresso-800/20 dark:text-cream-100/20 hover:text-amber-400 transition shrink-0"
        >
          <Star 
            size={18} 
            className={link.pinned ? 'fill-amber-400 text-amber-500' : ''} 
          />
        </button>

        <div className="w-8 h-8 rounded-xl bg-cream-100 dark:bg-espresso-900 flex items-center justify-center shrink-0 border border-cream-200 dark:border-espresso-800 overflow-hidden">
          {link.favicon && !imgError ? (
            <img 
              src={link.favicon} 
              alt="" 
              className="w-4 h-4 object-contain"
              onError={() => setImgError(true)} 
            />
          ) : (
            <ExternalLink size={12} className="text-espresso-800/40 dark:text-cream-100/40" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-espresso-900 dark:text-cream-50 truncate group-hover:text-sage-600 transition-colors">
              {link.title || link.url}
            </span>
            {link.attachments && link.attachments.length > 0 && (
              <Paperclip size={12} className="text-peach-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-espresso-800/40 dark:text-cream-100/40 mt-0.5">
            <span className="truncate max-w-[130px]">{domain}</span>
            <span>•</span>
            <span 
              className="font-semibold text-[10px] px-1.5 py-0.2 rounded-full"
              style={{ color: categoryColor, backgroundColor: `${categoryColor}15` }}
            >
              {category?.icon || '•'} {link.category}
            </span>
            {link.notes && (
              <span className="hidden md:inline truncate max-w-[280px] text-espresso-800/60 dark:text-cream-100/60">
                • {link.notes.split('\n')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Relative Time */}
      <span className="hidden sm:block text-xs text-espresso-800/40 dark:text-cream-100/40 shrink-0">
        {formatRelativeTime(link.createdAt)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
          title="Copy URL"
        >
          {copied ? <Check size={14} className="text-sage-600" /> : <Copy size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
          title="Edit"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          className="p-1.5 text-espresso-800/40 hover:text-red-500 rounded-lg hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleVisit}
          className="px-2.5 py-1 text-xs font-bold text-sage-700 bg-sage-50 hover:bg-sage-100 dark:bg-sage-950/60 dark:text-sage-300 rounded-xl transition"
        >
          Open
        </button>
      </div>

    </div>
  );
};
