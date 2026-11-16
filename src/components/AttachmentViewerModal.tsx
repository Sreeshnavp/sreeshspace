import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import type { Attachment } from '../types';
import { formatFileSize } from '../utils/urlHelper';

interface AttachmentViewerModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  attachment,
  onClose,
}) => {
  if (!attachment) return null;

  const isImage = attachment.type?.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf' || attachment.name?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = attachment.dataUrl;
    a.download = attachment.name || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-3 sm:p-6 bg-main/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Floating Control Bar */}
      <div 
        className="w-full max-w-4xl flex items-center justify-between px-5 py-3 mb-3 bg-raised text-main rounded-2xl border border-subtle shadow-raised backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 truncate pr-3">
          <div className="w-8 h-8 rounded-xl bg-sunken flex items-center justify-center shrink-0">
            {isImage ? '🖼️' : isPdf ? '📄' : <FileText size={16} />}
          </div>
          <div className="truncate">
            <h3 className="font-bold text-xs sm:text-sm text-main truncate">
              {attachment.name}
            </h3>
            <span className="text-[10px] text-faint font-mono">
              {formatFileSize(attachment.size)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-xl text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            title="Close viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Viewer Body */}
      <div 
        className="relative w-full max-w-4xl max-h-[82vh] flex items-center justify-center overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          <img 
            src={attachment.dataUrl} 
            alt={attachment.name} 
            className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-raised animate-in zoom-in-95 duration-150 select-none"
          />
        ) : isPdf ? (
          <div className="w-full h-[78vh] bg-surface rounded-2xl overflow-hidden shadow-raised flex flex-col">
            <iframe 
              src={attachment.dataUrl} 
              title={attachment.name} 
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-raised border border-subtle text-center max-w-md shadow-raised text-main">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-sunken text-accent flex items-center justify-center mb-3">
              <FileText size={32} />
            </div>
            <h4 className="font-bold text-base text-main mb-1 truncate">
              {attachment.name}
            </h4>
            <p className="text-xs text-muted mb-5">
              This document type can be saved and opened on your device.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold rounded-2xl shadow-soft transition active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
