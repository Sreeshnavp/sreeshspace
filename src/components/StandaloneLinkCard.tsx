import React, { useState } from 'react';
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
    <article
      draggable
      onDragStart={(e) => onDragStart(e, link.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(link)}
      className="link-pill flex items-center justify-between p-3 rounded-2xl bg-surface-card text-on-surface shadow-[0_2px_8px_rgba(21,19,17,0.04)] border border-border-subtle hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all min-w-0 group"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-lavender-subtle/80 flex items-center justify-center flex-shrink-0 text-primary shadow-xs overflow-hidden">
          {link.favicon ? (
            <img src={link.favicon} alt="" className="w-4 h-4 object-contain" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">bookmark</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="truncate font-semibold block text-xs sm:text-[13px] text-on-surface">
            {link.title || link.url}
          </span>
          <span className="text-[11px] text-on-surface-variant truncate block font-mono">
            {domain || link.url.replace(/^https?:\/\//, '')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(link.id);
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
            link.pinned ? 'text-sunshine-accent' : 'text-outline hover:text-sunshine-accent'
          }`}
          title={link.pinned ? 'Starred bookmark' : 'Star bookmark'}
        >
          {link.pinned ? '★' : '☆'}
        </button>
        <button
          onClick={handleCopy}
          className="w-7 h-7 rounded-full bg-canvas-bg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors text-[13px]"
          title="Copy link"
        >
          <span className="material-symbols-outlined text-[15px]">
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVisit(link);
          }}
          className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
          title="Open in new tab"
        >
          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
        </button>
        <span className="material-symbols-outlined text-[16px] text-outline cursor-move ml-0.5 hover:text-primary hidden sm:inline-block">
          drag_indicator
        </span>
      </div>
    </article>
  );
};
