import React, { useState } from 'react';
import { Copy, Check, Paperclip } from 'lucide-react';
import type { LinkItem, Attachment } from '../types';
import { extractDomain } from '../utils/urlHelper';
import './links.css';

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
    <article
      draggable
      onDragStart={(e) => onDragStart(e, link.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(link)}
      className="orbit-card"
      style={{ cursor: 'pointer' }}
    >
      {/* 1. Header: Icon / Favicon, Domain / URL, Star Button */}
      <div className="fh">
        <div 
          className="fi" 
          style={{ background: 'var(--orbit-green-soft)' }}
        >
          {link.favicon ? (
            <img src={link.favicon} alt="" className="w-5 h-5 object-contain" />
          ) : (
            '🌐'
          )}
        </div>
        
        <small 
          style={{ 
            flex: 1, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            fontWeight: 500
          }}
          title={link.url}
        >
          {domain || link.url.replace(/^https?:\/\//, '')}
        </small>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(link.id);
          }}
          className={`star-btn ${link.pinned ? 'on' : ''}`}
          aria-label={link.pinned ? 'Remove from starred' : 'Star bookmark'}
          title={link.pinned ? 'Starred bookmark' : 'Star bookmark'}
        >
          {link.pinned ? '★' : '☆'}
        </button>
      </div>

      {/* 2. Middle Body: Title and Note Box */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 className="link-card-title">
          {link.title || link.url}
        </h3>

        {link.notes ? (
          <div className="link-note">
            {link.notes}
          </div>
        ) : link.attachments && link.attachments.length > 0 ? (
          <div className="link-note" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Paperclip size={13} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAttachment(link.attachments![0]);
              }}
              style={{ border: 0, background: 'none', color: 'var(--orbit-green)', fontWeight: 600, padding: 0, cursor: 'pointer' }}
            >
              {link.attachments.length} attachment(s) · View
            </button>
          </div>
        ) : (
          <div className="link-note" style={{ fontStyle: 'italic', opacity: 0.8 }}>
            Ready to file into folder.
          </div>
        )}
      </div>

      {/* 3. Footer: Interaction Cues */}
      <div className="ff">
        <span style={{ userSelect: 'none', cursor: 'grab' }} title="Drag into any folder">
          ✋ Drag to folder
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopy}
            className="ib"
            style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '13px' }}
            title="Copy URL"
          >
            {copied ? <Check size={13} style={{ color: 'var(--orbit-green)' }} /> : <Copy size={13} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVisit(link);
              window.open(link.url, '_blank', 'noopener,noreferrer');
            }}
            className="open-action"
          >
            Open →
          </button>
        </div>
      </div>
    </article>
  );
};
