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
import { getCategoryToken } from '../utils/themeColors';

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
  const catToken = getCategoryToken(category?.color || link.category);

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
      className="group flex items-center justify-between gap-3 p-3.5 bg-surface rounded-2xl border border-subtle shadow-soft hover:shadow-soft-hover hover:border-strong transition cursor-pointer active:cursor-grabbing text-main"
    >
      {/* Favicon & Title & Domain */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span 
          className="text-faint hover:text-muted cursor-grab active:cursor-grabbing" 
          title="Drag to move into a category square"
        >
          <GripVertical size={14} />
        </span>

        <button
          onClick={handlePin}
          className="text-faint hover:text-muted transition shrink-0 cursor-pointer"
        >
          <Star 
            size={18} 
            className={link.pinned ? 'fill-accent text-accent' : ''} 
          />
        </button>

        <div className="w-8 h-8 rounded-xl bg-sunken flex items-center justify-center shrink-0 border border-subtle overflow-hidden">
          {link.favicon && !imgError ? (
            <img 
              src={link.favicon} 
              alt="" 
              className="w-4 h-4 object-contain"
              onError={() => setImgError(true)} 
            />
          ) : (
            <ExternalLink size={12} className="text-faint" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-main truncate group-hover:text-accent transition-colors">
              {link.title || link.url}
            </span>
            {link.attachments && link.attachments.length > 0 && (
              <Paperclip size={12} className="text-accent shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-faint mt-0.5">
            <span className="truncate max-w-[130px]">{domain}</span>
            <span>•</span>
            <span 
              className="font-semibold text-[10px] px-1.5 py-0.5 rounded-full border border-subtle"
              style={{ color: catToken.textVar, backgroundColor: catToken.softVar }}
            >
              {category?.icon || '•'} {link.category}
            </span>
            {link.notes && (
              <span className="hidden md:inline truncate max-w-[280px] text-muted">
                • {link.notes.split('\n')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Relative Time */}
      <span className="hidden sm:block text-xs text-faint shrink-0">
        {formatRelativeTime(link.createdAt)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
          title="Copy URL"
        >
          {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          className="p-1.5 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
          title="Edit"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          className="p-1.5 text-faint hover:text-danger rounded-lg hover:bg-sunken transition cursor-pointer"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleVisit}
          className="px-2.5 py-1 text-xs font-bold text-accent-text bg-accent-soft hover:bg-accent hover:text-on-accent rounded-xl transition cursor-pointer border border-subtle"
        >
          Open
        </button>
      </div>

    </div>
  );
};
