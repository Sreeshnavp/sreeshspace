import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Star, 
  Paperclip, 
  Sparkles, 
  Download, 
  FileText, 
  Image as ImageIcon,
  Check,
  Copy,
  Plus,
  BookOpen,
  Edit3,
  Eye,
  Calendar,
  Clock,
  Lightbulb
} from 'lucide-react';
import type { NoteItem, Attachment } from '../types';
import { formatFileSize, formatDate } from '../utils/urlHelper';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { getConcentratedNoteTheme, NOTE_THEMES } from '../utils/themeColors';

interface NoteModalProps {
  isOpen: boolean;
  note: NoteItem | null;
  onClose: () => void;
  onSave: (noteData: Partial<NoteItem>) => void;
  onDelete?: (id: string) => void;
  onOpenAttachment?: (attachment: Attachment) => void;
}

const PASTEL_THEMES = [
  { key: 'sage', name: 'Matcha Sage', color: '#f0f7f3', border: '#cde4d6' },
  { key: 'peach', name: 'Apricot Peach', color: '#fff4ef', border: '#fddbcf' },
  { key: 'honey', name: 'Warm Honey', color: '#fff9ec', border: '#fde8b8' },
  { key: 'lavender', name: 'Lavender Wisteria', color: '#f6f2fa', border: '#e2d6ef' },
  { key: 'sky', name: 'Sky Ice Blue', color: '#f1f8fc', border: '#cce7f7' },
  { key: 'rose', name: 'Rose Quartz', color: '#fdf2f6', border: '#fcd3e1' },
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  note,
  onClose,
  onSave,
  onDelete,
  onOpenAttachment,
}) => {
  // Mode: 'read' for distraction-free reading, 'edit' for editing
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');
  const [headline, setHeadline] = useState('');
  const [highlight, setHighlight] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [color, setColor] = useState('#f0f7f3');
  const [pinned, setPinned] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setHeadline(note.title || '');
      setHighlight(note.highlight || '');
      setParagraph(note.content || '');
      setColor(note.color || '#f0f7f3');
      setPinned(Boolean(note.pinned));
      setAttachments(note.attachments || []);
      setViewMode('read'); // Open existing notes in Reader View!
    } else {
      setHeadline('');
      setHighlight('');
      setParagraph('');
      setColor('#f0f7f3');
      setPinned(false);
      setAttachments([]);
      setViewMode('edit'); // Open new notes in Edit View directly!
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          createdAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
        triggerPartyPop('single');
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const insertFormatting = (prefix: string, suffix = '') => {
    setParagraph((prev) => `${prev}\n${prefix}Text${suffix}`);
    playPopSound();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() && !paragraph.trim()) return;

    onSave({
      title: headline.trim() || 'Untitled Note',
      highlight: highlight.trim(),
      content: paragraph.trim(),
      color,
      pinned,
      attachments,
      updatedAt: new Date().toISOString(),
    });

    triggerPartyPop('single');
    onClose();
  };

  const handleCopyNote = () => {
    const text = `${headline}\n${highlight ? `[Highlight]: ${highlight}\n` : ''}\n${paragraph}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    playPopSound();
    setTimeout(() => setCopied(false), 1800);
  };

  // Word count & reading time helper
  const wordCount = paragraph.trim() ? paragraph.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-espresso-950/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Solid, clean porcelain card (NO MUDDY GRADIENT EFFECT!) */}
      <div 
        className="w-full max-w-2xl bg-white dark:bg-espresso-900 rounded-3xl shadow-2xl border border-cream-200 dark:border-espresso-750 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Solid Pastel Accent Ribbon */}
        {(() => {
          const currentTheme = getConcentratedNoteTheme(color);
          return (
            <div 
              className="h-1.5 w-full shrink-0" 
              style={{ backgroundColor: currentTheme.accent }} 
            />
          );
        })()}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-cream-200 dark:border-espresso-800">
          
          {/* Reader vs Edit Mode Toggle Tabs */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-1 rounded-2xl bg-cream-100 dark:bg-espresso-800 border border-cream-200/80 dark:border-espresso-750 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setViewMode('read');
                  playPopSound();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  viewMode === 'read'
                    ? 'bg-white dark:bg-espresso-700 text-espresso-900 dark:text-cream-50 shadow-2xs font-extrabold'
                    : 'text-espresso-800/50 dark:text-cream-100/50 hover:text-espresso-800'
                }`}
              >
                <Eye size={13} />
                <span>Read View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('edit');
                  playPopSound();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  viewMode === 'edit'
                    ? 'bg-white dark:bg-espresso-700 text-espresso-900 dark:text-cream-50 shadow-2xs font-extrabold'
                    : 'text-espresso-800/50 dark:text-cream-100/50 hover:text-espresso-800'
                }`}
              >
                <Edit3 size={13} />
                <span>Edit Note</span>
              </button>
            </div>
          </div>

          {/* Action icons: Star, Copy, Close */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPinned(!pinned);
                playPopSound();
              }}
              className={`p-2 rounded-xl transition ${
                pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' : 'text-espresso-800/30 hover:text-amber-400'
              }`}
              title={pinned ? 'Pinned to top' : 'Pin note'}
            >
              <Star size={17} className={pinned ? 'fill-amber-400' : ''} />
            </button>

            <button
              type="button"
              onClick={handleCopyNote}
              className="p-2 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
              title="Copy note text"
            >
              {copied ? <Check size={16} className="text-sage-600" /> : <Copy size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================
            VIEW MODE 1: DEDICATED READER VIEW (CALM, CLEAN, EDITORIAL)
            ======================================================== */}
        {viewMode === 'read' ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
            
            {/* Headline */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-espresso-900 dark:text-cream-50 leading-tight tracking-tight">
                {headline || 'Untitled Note'}
              </h2>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-espresso-800/45 dark:text-cream-100/45 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{note ? formatDate(note.updatedAt) : 'Today'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{wordCount} words (~{readTimeMin} min read)</span>
                </span>
              </div>
            </div>

            {/* Key Highlight Banner (if present) */}
            {highlight && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lightbulb size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-800/70 dark:text-amber-300/70 mb-0.5">
                    Key Highlight
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-espresso-900 dark:text-cream-50 leading-snug">
                    {highlight}
                  </p>
                </div>
              </div>
            )}

            {/* Paragraph / Body Content */}
            <div className="prose prose-sm max-w-none text-xs sm:text-sm text-espresso-900/90 dark:text-cream-50/90 leading-relaxed font-normal whitespace-pre-line py-1">
              {paragraph || <span className="italic text-espresso-800/40">No content written yet. Click "Edit Note" to add thoughts.</span>}
            </div>

            {/* Attachments Section in Reader Mode */}
            {attachments.length > 0 && (
              <div className="pt-4 border-t border-cream-200 dark:border-espresso-800">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-espresso-800/50 dark:text-cream-100/50 mb-2.5 flex items-center gap-1.5">
                  <Paperclip size={12} />
                  <span>Attached Files & Screenshots ({attachments.length})</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {attachments.map((att) => {
                    const isImg = att.type.startsWith('image/');

                    return (
                      <div
                        key={att.id}
                        onClick={() => onOpenAttachment && onOpenAttachment(att)}
                        className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-cream-50/70 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 hover:border-sage-400 dark:hover:border-sage-600 transition cursor-pointer shadow-2xs"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-espresso-750 flex items-center justify-center shrink-0 overflow-hidden border border-cream-200 dark:border-espresso-700">
                          {isImg ? (
                            <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <FileText size={18} className="text-espresso-800/50" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-espresso-900 dark:text-cream-50 truncate group-hover:text-sage-600 transition-colors">
                            {att.name}
                          </p>
                          <span className="text-[10px] text-espresso-800/40 dark:text-cream-100/40 font-mono">
                            {formatFileSize(att.size)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reader Mode Footer */}
            <div className="pt-4 border-t border-cream-200 dark:border-espresso-800 flex items-center justify-between">
              <span className="text-xs text-espresso-800/40 dark:text-cream-100/40 font-medium">
                SreeshSpace Reader Mode
              </span>

              <button
                type="button"
                onClick={() => {
                  setViewMode('edit');
                  playPopSound();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-500 text-white rounded-2xl text-xs font-bold shadow-pill transition active:scale-95"
              >
                <Edit3 size={13} />
                <span>Edit Note</span>
              </button>
            </div>

          </div>
        ) : (
          /* ========================================================
              VIEW MODE 2: SOLID CLEAN EDIT MODE (NO GRADIENT EFFECT!)
              ======================================================== */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            
            {/* 1. Headline */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-espresso-800/50 dark:text-cream-100/50 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Give your note a bold headline..."
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50/70 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 text-sm sm:text-base font-extrabold text-espresso-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-400/40"
              />
            </div>

            {/* 2. Key Highlight Banner */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-espresso-800/50 dark:text-cream-100/50 mb-1">
                Key Highlight / Takeaway (Optional)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
                <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.2]" />
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  placeholder="Core takeaway or highlight banner..."
                  className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-espresso-900 dark:text-cream-50 focus:outline-none placeholder-amber-800/40 dark:placeholder-amber-200/40"
                />
              </div>
            </div>

            {/* 3. Paragraph / Body with Quick Formatting Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-espresso-800/50 dark:text-cream-100/50">
                  Paragraph / Body Notes
                </label>

                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => insertFormatting('• ')}
                    className="px-2 py-0.5 rounded-lg bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 text-espresso-800 dark:text-cream-100"
                  >
                    Bullet
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('[ ] ')}
                    className="px-2 py-0.5 rounded-lg bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 text-espresso-800 dark:text-cream-100"
                  >
                    Task [ ]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="px-2 py-0.5 rounded-lg bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 text-espresso-800 dark:text-cream-100"
                  >
                    Bold
                  </button>
                </div>
              </div>

              <textarea
                value={paragraph}
                onChange={(e) => setParagraph(e.target.value)}
                placeholder="Write your detailed thoughts, study points, or instructions here..."
                rows={6}
                className="w-full px-4 py-3 rounded-2xl bg-cream-50/70 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 text-xs sm:text-sm text-espresso-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-400/40 resize-none font-normal leading-relaxed"
              />
            </div>

            {/* 4. Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-espresso-800/50 dark:text-cream-100/50">
                  Attachments ({attachments.length})
                </label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-sage-50 dark:bg-sage-950/60 hover:bg-sage-100 text-sage-700 dark:text-sage-300 rounded-xl text-xs font-bold border border-sage-200/80 dark:border-sage-800 transition active:scale-95"
                >
                  <Paperclip size={12} />
                  <span>Attach Image / File</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-2xl bg-cream-50/60 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800">
                  {attachments.map((att) => {
                    const isImg = att.type.startsWith('image/');

                    return (
                      <div
                        key={att.id}
                        className="group relative flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-200/80 dark:border-espresso-750 shadow-2xs overflow-hidden"
                      >
                        <div 
                          onClick={() => onOpenAttachment && onOpenAttachment(att)}
                          className="w-8 h-8 rounded-lg bg-cream-100 dark:bg-espresso-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition"
                        >
                          {isImg ? (
                            <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={15} className="text-espresso-800/40" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p 
                            onClick={() => onOpenAttachment && onOpenAttachment(att)}
                            className="text-[11px] font-bold text-espresso-900 dark:text-cream-50 truncate cursor-pointer hover:underline"
                          >
                            {att.name}
                          </p>
                          <span className="text-[9px] text-espresso-800/40 dark:text-cream-100/40 font-mono">
                            {formatFileSize(att.size)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-espresso-800/30 hover:text-red-500 rounded-lg transition"
                          title="Remove attachment"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-2xl border border-dashed border-cream-300 dark:border-espresso-750 text-center cursor-pointer hover:border-sage-400 dark:hover:border-sage-600 transition bg-cream-50/30 dark:bg-espresso-900/30"
                >
                  <Paperclip size={15} className="mx-auto text-espresso-800/30 dark:text-cream-100/30 mb-1" />
                  <p className="text-xs font-semibold text-espresso-800/60 dark:text-cream-100/60">
                    Click to attach images, screenshots, PDFs, or documents
                  </p>
                </div>
              )}
            </div>

            {/* 5. Solid Pastel Card Theme */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-espresso-800/50 dark:text-cream-100/50 mb-1.5">
                Note Color Theme
              </label>
              <div className="flex items-center gap-2.5">
                {PASTEL_THEMES.map((theme) => {
                  const themeDetails = NOTE_THEMES[theme.key] || NOTE_THEMES.sage;
                  return (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => {
                        setColor(theme.color);
                        playPopSound();
                      }}
                      className={`relative w-8 h-8 rounded-xl border-2 transition-all cursor-pointer ${
                        color === theme.color
                          ? 'scale-120 shadow-md ring-2 ring-sage-500/60 dark:ring-emerald-400'
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: themeDetails.lightBg,
                        borderColor: themeDetails.lightBorder,
                      }}
                      title={theme.name}
                    >
                      {/* Dark mode jewel indicator */}
                      <span 
                        className="absolute inset-1 rounded-lg hidden dark:block"
                        style={{
                          backgroundColor: themeDetails.darkBg,
                          border: `1.5px solid ${themeDetails.darkBorder}`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="pt-3 border-t border-cream-200 dark:border-espresso-800 flex items-center justify-between">
              {note && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(note.id);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (note) setViewMode('read');
                    else onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso-800/60 dark:text-cream-100/60 hover:bg-cream-100 dark:hover:bg-espresso-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold shadow-pill transition active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Save Note</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
