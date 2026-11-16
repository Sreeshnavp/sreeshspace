import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  Calendar, 
  Edit3, 
  Trash2, 
  Download, 
  Paperclip, 
  FileText,
  Eye
} from 'lucide-react';
import type { LinkItem, CategoryInfo, Attachment } from '../types';
import { extractDomain, formatDate, formatFileSize } from '../utils/urlHelper';

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
  const categoryColor = category?.color || '#4e876c';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-espresso-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-espresso-900 rounded-3xl shadow-2xl border border-cream-300 dark:border-espresso-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-3 border-b border-cream-200 dark:border-espresso-800">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                style={{ 
                  color: categoryColor,
                  backgroundColor: `${categoryColor}15`,
                  borderColor: `${categoryColor}30`
                }}
              >
                {category?.icon || '•'} {link.category}
              </span>
              <span className="text-xs text-espresso-800/40 dark:text-cream-100/40">
                {domain}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-espresso-900 dark:text-cream-50 leading-snug">
              {link.title || link.url}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(link.id)}
              className={`p-2 rounded-xl transition ${
                link.pinned ? 'text-amber-500' : 'text-espresso-800/30 hover:text-amber-400'
              }`}
            >
              <Star size={18} className={link.pinned ? 'fill-amber-400' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Quick URL Box */}
          <div className="p-3 bg-cream-50 dark:bg-espresso-850 rounded-2xl border border-cream-200 dark:border-espresso-800 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs text-sage-700 dark:text-sage-400">
              {link.url}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-100 hover:bg-cream-100 transition"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleVisit}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-sage-600 hover:bg-sage-500 text-white rounded-xl shadow-pill transition"
              >
                <span>Open</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Uses & Notes */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-espresso-800/40 dark:text-cream-100/40 mb-1.5">
              Uses & Context Notes
            </h4>
            <div className="p-4 rounded-2xl bg-cream-50/70 dark:bg-espresso-850/70 border border-cream-200 dark:border-espresso-800 text-espresso-800/90 dark:text-cream-100/90 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-normal">
              {link.notes || <span className="text-espresso-800/40 italic">No notes added.</span>}
            </div>
          </div>

          {/* Attachments Section: Open directly in top-level viewer */}
          {link.attachments && link.attachments.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-espresso-800/40 dark:text-cream-100/40 mb-2 flex items-center gap-1">
                <Paperclip size={12} className="text-peach-500" />
                Attachments ({link.attachments.length}) • Click to view above
              </h4>
              <div className="space-y-2">
                {link.attachments.map((file) => {
                  const isImg = file.type?.startsWith('image/');
                  return (
                    <div
                      key={file.id}
                      onClick={() => onOpenAttachment(file)}
                      className="group flex items-center justify-between p-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 hover:border-sage-400 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isImg ? (
                          <img src={file.dataUrl} alt="" className="w-10 h-10 object-cover rounded-xl shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-cream-200 dark:bg-espresso-750 flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-peach-500" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-xs text-espresso-900 dark:text-cream-50 truncate group-hover:text-sage-600 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-espresso-800/40 font-mono">
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
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sage-700 bg-sage-50 hover:bg-sage-100 dark:bg-sage-950/60 dark:text-sage-300 rounded-xl border border-sage-200/80"
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
          <div className="text-[11px] text-espresso-800/40 dark:text-cream-100/40 flex items-center gap-1.5 pt-2 border-t border-cream-200 dark:border-espresso-800">
            <Calendar size={12} />
            <span>Saved on {formatDate(link.createdAt)}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-950/50">
          <button
            onClick={() => {
              onDelete(link.id);
              onClose();
            }}
            className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-800 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit(link);
                onClose();
              }}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-sage-600 hover:bg-sage-500 rounded-xl shadow-pill transition"
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
