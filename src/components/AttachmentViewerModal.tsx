import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
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
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Floating Control Bar */}
      <div 
        className="w-full max-w-4xl flex items-center justify-between px-5 py-3 mb-3 bg-espresso-900/90 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 truncate pr-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            {isImage ? '🖼️' : isPdf ? '📄' : <FileText size={16} />}
          </div>
          <div className="truncate">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              {attachment.name}
            </h3>
            <span className="text-[10px] text-white/50 font-mono">
              {formatFileSize(attachment.size)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-600 hover:bg-sage-500 text-white rounded-xl text-xs font-bold shadow-pill transition active:scale-95"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition"
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
            className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl animate-in zoom-in-95 duration-150 select-none"
          />
        ) : isPdf ? (
          <div className="w-full h-[78vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <iframe 
              src={attachment.dataUrl} 
              title={attachment.name} 
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-espresso-900 border border-white/10 text-center max-w-md shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 text-sage-400 flex items-center justify-center mb-3">
              <FileText size={32} />
            </div>
            <h4 className="font-bold text-base text-white mb-1 truncate">
              {attachment.name}
            </h4>
            <p className="text-xs text-white/60 mb-5">
              This document type can be saved and opened on your device.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-500 text-white rounded-2xl text-xs font-bold shadow-pill transition active:scale-95"
            >
              <Download size={15} />
              <span>Download File ({formatFileSize(attachment.size)})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
