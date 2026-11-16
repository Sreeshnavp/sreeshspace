import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Star, 
  Calendar, 
  Edit3, 
  Trash2, 
  Paperclip, 
  FileText,
  Eye
} from 'lucide-react';
import type { LinkItem, CategoryInfo, Attachment } from '../types';
import { extractDomain, formatDate, formatFileSize } from '../utils/urlHelper';
import { getCategoryToken } from '../utils/themeColors';

interface DetailModalProps {
  link: LinkItem | null;
  onClose: () => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onVisit: (link: LinkItem) => void;
  onOpenAttachment: (attachment: Attachment) => void;
  categories: CategoryInfo[];
}

export const DetailModal: React.FC<DetailModalProps> = ({
  link,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onVisit,
  onOpenAttachment,
  categories,
}) => {
  const [copied, setCopied] = useState(false);

  if (!link) return null;

  const domain = extractDomain(link.url);
  const category = categories.find((c) => c.name === link.category);
  const catToken = getCategoryToken(category?.color || link.category);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleVisit = () => {
    onVisit(link);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-surface rounded-3xl shadow-raised border border-subtle flex flex-col max-h-[92vh] overflow-hidden text-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-3 border-b border-subtle">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-subtle"
                style={{ 
                  color: catToken.textVar,
                  backgroundColor: catToken.softVar,
                }}
              >
                {category?.icon || '•'} {link.category}
              </span>
              <span className="text-xs text-faint">
                {domain}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-main leading-snug">
              {link.title || link.url}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(link.id)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                link.pinned ? 'text-accent' : 'text-faint hover:text-muted'
              }`}
            >
              <Star size={18} className={link.pinned ? 'fill-accent' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Quick URL Box */}
          <div className="p-3 bg-sunken rounded-2xl border border-subtle flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs text-accent">
              {link.url}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-surface border border-input text-main hover:bg-sunken transition cursor-pointer"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleVisit}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-accent hover:bg-accent-hover text-on-accent rounded-xl shadow-soft transition cursor-pointer"
              >
                <span>Open</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Uses & Notes */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-faint mb-1.5">
              Uses & Context Notes
            </h4>
            <div className="p-4 rounded-2xl bg-sunken border border-subtle text-muted whitespace-pre-line leading-relaxed text-xs sm:text-sm font-normal">
              {link.notes || <span className="text-faint italic">No notes added.</span>}
            </div>
          </div>

          {/* Attachments Section */}
          {link.attachments && link.attachments.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-faint mb-2 flex items-center gap-1">
                <Paperclip size={12} className="text-accent" />
                Attachments ({link.attachments.length}) • Click to view
              </h4>
              <div className="space-y-2">
                {link.attachments.map((file) => {
                  const isImg = file.type?.startsWith('image/');
                  return (
                    <div
                      key={file.id}
                      onClick={() => onOpenAttachment(file)}
                      className="group flex items-center justify-between p-2.5 rounded-2xl bg-sunken border border-subtle hover:border-strong transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isImg ? (
                          <img src={file.dataUrl} alt="" className="w-10 h-10 object-cover rounded-xl shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-surface border border-subtle flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-accent" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-xs text-main truncate group-hover:text-accent transition-colors">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-faint font-mono">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAttachment(file);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-accent-text bg-accent-soft hover:bg-accent hover:text-on-accent rounded-xl border border-subtle cursor-pointer transition"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved date */}
          <div className="text-[11px] text-faint flex items-center gap-1.5 pt-2 border-t border-subtle">
            <Calendar size={12} />
            <span>Saved on {formatDate(link.createdAt)}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-subtle bg-sunken">
          <button
            onClick={() => {
              onDelete(link.id);
              onClose();
            }}
            className="text-xs font-semibold text-danger hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-main rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit(link);
                onClose();
              }}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-on-accent bg-accent hover:bg-accent-hover rounded-xl shadow-soft transition cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
