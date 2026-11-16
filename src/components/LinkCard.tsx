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

interface LinkCardProps {
  link: LinkItem;
  categories: CategoryInfo[];
  onOpenDetail: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onVisit: (link: LinkItem) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
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

  const imageAttachments = (link.attachments || []).filter((a) => a.type?.startsWith('image/'));
  const otherAttachments = (link.attachments || []).filter((a) => !a.type?.startsWith('image/'));

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetail(link)}
      className="group relative flex flex-col justify-between bg-surface rounded-3xl p-5 border border-subtle shadow-soft hover:shadow-soft-hover hover:border-strong transition-all duration-200 cursor-pointer active:cursor-grabbing text-main"
    >
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag Handle Indicator */}
            <span 
              className="text-faint hover:text-muted cursor-grab active:cursor-grabbing -ml-1" 
              title="Drag to move into a category square"
            >
              <GripVertical size={14} />
            </span>

            {/* Favicon */}
            <div className="w-7 h-7 rounded-xl bg-sunken flex items-center justify-center shrink-0 border border-subtle overflow-hidden">
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

            {/* Category Pill with cute dot or icon */}
            <span 
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 border border-subtle"
              style={{ 
                color: catToken.textVar,
                backgroundColor: catToken.softVar,
              }}
            >
              <span>{category?.icon || '•'}</span>
              <span>{link.category}</span>
            </span>

            {/* Clean Domain */}
            <span className="text-[11px] text-faint truncate">
              {domain}
            </span>
          </div>

          {/* Star Button */}
          <button
            onClick={handlePin}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              link.pinned 
                ? 'text-accent hover:scale-110' 
                : 'text-faint hover:text-muted'
            }`}
            title={link.pinned ? 'Starred' : 'Star link'}
          >
            <Star size={18} className={link.pinned ? 'fill-accent text-accent' : ''} />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm sm:text-base text-main leading-snug group-hover:text-accent transition-colors mb-2 line-clamp-2">
          {link.title || link.url}
        </h3>

        {/* Uses & Notes Preview */}
        {link.notes && (
          <div className="bg-sunken rounded-2xl p-3 mb-3 border border-subtle">
            <p className="text-xs text-muted leading-relaxed line-clamp-3 whitespace-pre-line font-normal">
              {link.notes}
            </p>
          </div>
        )}

        {/* Attachments preview */}
        {link.attachments && link.attachments.length > 0 && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            {imageAttachments.length > 0 && (
              <div className="flex gap-1.5">
                {imageAttachments.slice(0, 2).map((img) => (
                  <div key={img.id} className="w-12 h-10 rounded-xl overflow-hidden border border-subtle bg-sunken">
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {otherAttachments.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-accent-soft text-accent-text text-[10px] font-medium border border-subtle">
                <Paperclip size={11} />
                <span>{otherAttachments.length} file(s) attached</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Clear Actions */}
      <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-faint">
        <span className="text-[11px] font-medium">
          {formatRelativeTime(link.createdAt)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Quick Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(link);
            }}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Edit link"
          >
            <Edit3 size={14} />
          </button>

          {/* Quick Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(link.id);
            }}
            className="p-1.5 text-faint hover:text-danger rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Delete link"
          >
            <Trash2 size={14} />
          </button>

          {/* Copy URL */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Copy URL"
          >
            {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
          </button>

          {/* Visit Pill Button */}
          <button
            onClick={handleVisit}
            className="flex items-center gap-1 px-3 py-1 bg-accent-soft hover:bg-accent text-accent-text hover:text-on-accent rounded-xl text-xs font-bold transition active:scale-95 border border-subtle cursor-pointer"
          >
            <span>Open</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

    </div>
  );
};
