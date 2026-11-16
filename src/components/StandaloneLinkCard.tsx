import React, { useState } from 'react';
import { 
  GripVertical, 
  ExternalLink, 
  Star, 
  Paperclip, 
  Copy, 
  Check 
} from 'lucide-react';
import type { LinkItem, Attachment } from '../types';
import { extractDomain } from '../utils/urlHelper';

interface StandaloneLinkCardProps {
  link: LinkItem;
  onSelect: (link: LinkItem) => void;
  onTogglePin: (id: string) => void;
  onVisit: (link: LinkItem) => void;
  onOpenAttachment: (attachment: Attachment) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

export const StandaloneLinkCard: React.FC<StandaloneLinkCardProps> = ({
  link,
  onSelect,
  onTogglePin,
  onVisit,
  onOpenAttachment,
  onDragStart,
  onDragEnd,
}) => {
  const [copied, setCopied] = useState(false);
  const domain = extractDomain(link.url);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, link.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(link)}
      className="group relative flex flex-col justify-between p-3.5 sm:p-4.5 rounded-3xl cursor-grab active:cursor-grabbing transition-all duration-300 ease-out select-none border border-cream-200/90 dark:border-espresso-750 bg-white/95 dark:bg-espresso-850/95 backdrop-blur-md shadow-soft hover:shadow-soft-hover hover:border-sage-300 dark:hover:border-sage-600 hover:-translate-y-1 h-[210px] sm:h-[215px] overflow-hidden"
    >
      {/* 1. Header: Symmetrical Height & Alignment with Folder Squares */}
      <div className="flex items-center justify-between gap-1.5 h-8 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span 
            className="text-espresso-800/30 dark:text-cream-100/30 group-hover:text-espresso-800/70 transition-colors"
            title="Drag into any folder above"
          >
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

          {link.category && link.category.toLowerCase() !== 'uncategorized' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cream-200/80 dark:bg-espresso-750 text-espresso-800/70 dark:text-cream-100/70 truncate max-w-[80px]">
              {link.category}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(link.id);
          }}
          className={`p-1 rounded-lg transition ${
            link.pinned ? 'text-amber-500' : 'text-espresso-800/20 hover:text-amber-400'
          }`}
          title={link.pinned ? 'Pinned bookmark' : 'Pin bookmark'}
        >
          <Star size={15} className={link.pinned ? 'fill-amber-400 text-amber-500' : ''} />
        </button>
      </div>

      {/* 2. Middle Body: Symmetrical 92px height, identical to 2x2 folder previews */}
      <div className="my-auto h-[92px] flex flex-col justify-between overflow-hidden">
        {/* Title */}
        <h4 className="font-extrabold text-xs sm:text-sm text-espresso-900 dark:text-cream-50 leading-tight line-clamp-2 group-hover:text-sage-600 transition-colors">
          {link.title || link.url}
        </h4>

        {/* Content Box (Notes or Attachments or Meta Chip) */}
        {link.notes ? (
          <p className="text-[11px] text-espresso-800/70 dark:text-cream-100/70 line-clamp-2 leading-relaxed bg-cream-50 dark:bg-espresso-900 px-2.5 py-1.5 rounded-xl border border-cream-200/70 dark:border-espresso-800 font-normal">
            {link.notes}
          </p>
        ) : link.attachments && link.attachments.length > 0 ? (
          <div className="flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAttachment(link.attachments[0]);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-peach-600 dark:text-peach-300 bg-peach-50 dark:bg-peach-950 px-2.5 py-1 rounded-full border border-peach-200 dark:border-peach-900 hover:bg-peach-100 transition active:scale-95"
            >
              <Paperclip size={10} />
              <span>{link.attachments.length} attachment(s) • View</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-espresso-800/40 dark:text-cream-100/40 bg-cream-50/50 dark:bg-espresso-900/40 px-2.5 py-1.5 rounded-xl border border-cream-200/50 dark:border-espresso-800/50">
            <span>📎</span>
            <span className="truncate">Loose on canvas • ready to sort</span>
          </div>
        )}
      </div>

      {/* 3. Footer: Symmetrical Bottom Row */}
      <div className="pt-2 mt-auto border-t border-cream-200/80 dark:border-espresso-800/80 flex items-center justify-between text-xs h-7 shrink-0">
        <span className="text-[10px] text-sage-600 dark:text-sage-400 font-bold flex items-center gap-1">
          <span>✋</span>
          <span className="hidden sm:inline">Drag to folder</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-lg transition"
            title="Copy URL"
          >
            {copied ? <Check size={12} className="text-sage-600" /> : <Copy size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVisit(link);
              window.open(link.url, '_blank', 'noopener,noreferrer');
            }}
            className="px-2.5 py-0.5 text-[10px] font-bold text-sage-700 bg-sage-50 dark:bg-sage-950/60 dark:text-sage-300 rounded-lg border border-sage-200/80 hover:bg-sage-100 transition active:scale-95"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};
