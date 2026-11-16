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

  const imageAttachments = (link.attachments || []).filter((a) => a.type?.startsWith('image/'));
  const otherAttachments = (link.attachments || []).filter((a) => !a.type?.startsWith('image/'));

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetail(link)}
      className="group relative flex flex-col justify-between bg-white dark:bg-espresso-850 rounded-3xl p-5 border border-cream-300/80 dark:border-espresso-800 shadow-soft hover:shadow-soft-hover hover:border-sage-300 dark:hover:border-sage-700 transition-all duration-200 cursor-pointer active:cursor-grabbing"
    >
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag Handle Indicator */}
            <span 
              className="text-espresso-800/20 hover:text-espresso-800/50 cursor-grab active:cursor-grabbing -ml-1" 
              title="Drag to move into a category square"
            >
              <GripVertical size={14} />
            </span>

            {/* Favicon */}
            <div className="w-7 h-7 rounded-xl bg-cream-100 dark:bg-espresso-900 flex items-center justify-center shrink-0 border border-cream-200 dark:border-espresso-800 overflow-hidden">
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

            {/* Category Pill with cute dot or icon */}
            <span 
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 border"
              style={{ 
                color: categoryColor,
                backgroundColor: `${categoryColor}15`,
                borderColor: `${categoryColor}30`
              }}
            >
              <span>{category?.icon || '•'}</span>
              <span>{link.category}</span>
            </span>

            {/* Clean Domain */}
            <span className="text-[11px] text-espresso-800/40 dark:text-cream-100/40 truncate">
              {domain}
            </span>
          </div>

          {/* Star Button */}
          <button
            onClick={handlePin}
            className={`p-1.5 rounded-xl transition ${
              link.pinned 
                ? 'text-amber-500 hover:scale-110' 
                : 'text-espresso-800/20 dark:text-cream-100/20 hover:text-amber-400'
            }`}
            title={link.pinned ? 'Starred' : 'Star link'}
          >
            <Star size={18} className={link.pinned ? 'fill-amber-400 text-amber-500' : ''} />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm sm:text-base text-espresso-900 dark:text-cream-50 leading-snug group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors mb-2 line-clamp-2">
          {link.title || link.url}
        </h3>

        {/* Uses & Notes Preview */}
        {link.notes && (
          <div className="bg-cream-50 dark:bg-espresso-900/60 rounded-2xl p-3 mb-3 border border-cream-200/80 dark:border-espresso-800/80">
            <p className="text-xs text-espresso-800/75 dark:text-cream-100/75 leading-relaxed line-clamp-3 whitespace-pre-line font-normal">
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
                  <div key={img.id} className="w-12 h-10 rounded-xl overflow-hidden border border-cream-300 dark:border-espresso-700 bg-cream-200">
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {otherAttachments.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sage-50 dark:bg-espresso-900 text-sage-700 dark:text-sage-300 text-[10px] font-medium border border-sage-200 dark:border-sage-800">
                <Paperclip size={11} />
                <span>{otherAttachments.length} file(s) attached</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Clear Actions */}
      <div className="pt-3 border-t border-cream-200 dark:border-espresso-800 flex items-center justify-between text-xs text-espresso-800/40 dark:text-cream-100/40">
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
            className="p-1.5 text-espresso-800/50 hover:text-espresso-800 dark:text-cream-100/50 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
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
            className="p-1.5 text-espresso-800/50 hover:text-red-500 dark:text-cream-100/50 dark:hover:text-red-400 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
            title="Delete link"
          >
            <Trash2 size={14} />
          </button>

          {/* Copy URL */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-espresso-800/50 hover:text-espresso-800 dark:text-cream-100/50 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
            title="Copy URL"
          >
            {copied ? <Check size={14} className="text-sage-600" /> : <Copy size={14} />}
          </button>

          {/* Visit Pill Button */}
          <button
            onClick={handleVisit}
            className="flex items-center gap-1 px-3 py-1 bg-sage-50 hover:bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:hover:bg-sage-900 dark:text-sage-300 rounded-xl text-xs font-bold transition active:scale-95 border border-sage-200/80 dark:border-sage-800"
          >
            <span>Open</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

    </div>
  );
};
