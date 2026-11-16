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
      className="group relative flex flex-col justify-between p-3.5 sm:p-4.5 rounded-3xl cursor-grab active:cursor-grabbing transition-all duration-300 ease-out select-none border border-subtle bg-surface shadow-soft hover:shadow-soft-hover hover:border-strong hover:-translate-y-1 h-[210px] sm:h-[215px] overflow-hidden text-main"
    >
      {/* 1. Header: Symmetrical Height & Alignment with Folder Squares */}
      <div className="flex items-center justify-between gap-1.5 h-8 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span 
            className="text-faint group-hover:text-muted transition-colors cursor-grab"
            title="Drag into any folder above"
          >
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

          {link.category && link.category.toLowerCase() !== 'uncategorized' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sunken text-muted border border-subtle truncate max-w-[80px]">
              {link.category}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(link.id);
          }}
          className={`p-1 rounded-lg transition cursor-pointer ${
            link.pinned ? 'text-accent' : 'text-faint hover:text-muted'
          }`}
          title={link.pinned ? 'Pinned bookmark' : 'Pin bookmark'}
        >
          <Star size={15} className={link.pinned ? 'fill-accent text-accent' : ''} />
        </button>
      </div>

      {/* 2. Middle Body: Symmetrical 92px height */}
      <div className="my-auto h-[92px] flex flex-col justify-between overflow-hidden">
        {/* Title */}
        <h4 className="font-extrabold text-xs sm:text-sm text-main leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {link.title || link.url}
        </h4>

        {/* Content Box */}
        {link.notes ? (
          <p className="text-[11px] text-muted line-clamp-2 leading-relaxed bg-sunken px-2.5 py-1.5 rounded-xl border border-subtle font-normal">
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
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-text bg-accent-soft px-2.5 py-1 rounded-full border border-subtle hover:opacity-90 transition active:scale-95 cursor-pointer"
            >
              <Paperclip size={10} />
              <span>{link.attachments.length} attachment(s) • View</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-faint bg-sunken px-2.5 py-1.5 rounded-xl border border-subtle">
            <span>📎</span>
            <span className="truncate">Loose on canvas • ready to sort</span>
          </div>
        )}
      </div>

      {/* 3. Footer: Symmetrical Bottom Row */}
      <div className="pt-2 mt-auto border-t border-subtle flex items-center justify-between text-xs h-7 shrink-0">
        <span className="text-[10px] text-accent font-bold flex items-center gap-1">
          <span>✋</span>
          <span className="hidden sm:inline">Drag to folder</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 text-faint hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
            title="Copy URL"
          >
            {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVisit(link);
              window.open(link.url, '_blank', 'noopener,noreferrer');
            }}
            className="px-2.5 py-0.5 text-[10px] font-bold text-accent-text bg-accent-soft hover:bg-accent hover:text-on-accent rounded-lg border border-subtle transition active:scale-95 cursor-pointer"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};
