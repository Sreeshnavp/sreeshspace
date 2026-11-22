import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Star, 
  Paperclip, 
  Sparkles, 
  FileText, 
  Check,
  Copy,
  Edit3,
  Eye,
  Calendar,
  Clock,
  Lightbulb
} from 'lucide-react';
import type { NoteItem, Attachment } from '../types';
import { formatFileSize, formatDate } from '../utils/urlHelper';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { CATEGORY_KEYS, CATEGORY_TOKENS, resolveCategoryKey, getCategoryToken } from '../utils/themeColors';

interface NoteModalProps {
  isOpen: boolean;
  note: NoteItem | null;
  onClose: () => void;
  onSave: (noteData: Partial<NoteItem>) => void;
  onDelete?: (id: string) => void;
  onOpenAttachment?: (attachment: Attachment) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  note,
  onClose,
  onSave,
  onDelete,
  onOpenAttachment,
}) => {
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');
  const [headline, setHeadline] = useState('');
  const [highlight, setHighlight] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [color, setColor] = useState('sage');
  const [pinned, setPinned] = useState(false);
  const [tag, setTag] = useState('💡 Idea');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setHeadline(note.title || '');
      setHighlight(note.highlight || '');
      setParagraph(note.content || '');
      setColor(resolveCategoryKey(note.color));
      setPinned(Boolean(note.pinned));
      setTag(note.tag || '💡 Idea');
      setAttachments(note.attachments || []);
      setViewMode('read');
    } else {
      setHeadline('');
      setHighlight('');
      setParagraph('');
      setColor('sage');
      setPinned(false);
      setTag('💡 Idea');
      setAttachments([]);
      setViewMode('edit');
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const currentCatToken = getCategoryToken(color);

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
      tag,
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

  const wordCount = paragraph.trim() ? paragraph.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div 
      data-modal="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-main/50 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-surface rounded-3xl shadow-raised border border-subtle flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Solid Accent Ribbon */}
        <div 
          className="h-1.5 w-full shrink-0" 
          style={{ backgroundColor: currentCatToken.solidVar }} 
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-subtle bg-surface">
          
          {/* Reader vs Edit Mode Toggle Tabs */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-1 rounded-2xl bg-sunken border border-subtle text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setViewMode('read');
                  playPopSound();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'read'
                    ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
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
              className={`p-2 rounded-xl transition cursor-pointer ${
                pinned ? 'text-accent bg-accent-soft' : 'text-faint hover:text-muted'
              }`}
              title={pinned ? 'Pinned to top' : 'Pin note'}
            >
              <Star size={17} className={pinned ? 'fill-accent' : ''} />
            </button>

            <button
              type="button"
              onClick={handleCopyNote}
              className="p-2 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
              title="Copy note text"
            >
              {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* VIEW MODE 1: DEDICATED READER VIEW */}
        {viewMode === 'read' ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 bg-surface">
            
            {/* Headline */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-main leading-tight tracking-tight">
                {headline || 'Untitled Note'}
              </h2>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-faint font-medium">
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

            {/* Key Highlight Banner */}
            {highlight && (
              <div 
                className="p-4 rounded-2xl border border-subtle flex items-start gap-3"
                style={{ backgroundColor: currentCatToken.softVar, color: currentCatToken.textVar }}
              >
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: currentCatToken.solidVar, color: 'rgb(var(--on-accent))' }}
                >
                  <Lightbulb size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider opacity-75 mb-0.5">
                    Key Highlight
                  </span>
                  <p className="text-xs sm:text-sm font-bold leading-snug">
                    {highlight}
                  </p>
                </div>
              </div>
            )}

            {/* Paragraph / Body Content */}
            <div className="text-xs sm:text-sm text-main leading-relaxed font-normal whitespace-pre-line py-1">
              {paragraph || <span className="italic text-faint">No content written yet. Click "Edit Note" to add thoughts.</span>}
            </div>

            {/* Attachments Section in Reader Mode */}
            {attachments.length > 0 && (
              <div className="pt-4 border-t border-subtle">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-faint mb-2.5 flex items-center gap-1.5">
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
                        className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-sunken border border-subtle hover:border-strong transition cursor-pointer shadow-2xs"
                      >
                        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0 overflow-hidden border border-subtle">
                          {isImg ? (
                            <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <FileText size={18} className="text-faint" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-main truncate group-hover:text-accent transition-colors">
                            {att.name}
                          </p>
                          <span className="text-[10px] text-faint font-mono">
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
            <div className="pt-4 border-t border-subtle flex items-center justify-between">
              <span className="text-xs text-faint font-medium">
                Orbit Reader Mode
              </span>

              <button
                type="button"
                onClick={() => {
                  setViewMode('edit');
                  playPopSound();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-2xl text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit Note</span>
              </button>
            </div>

          </div>
        ) : (
          /* VIEW MODE 2: EDIT MODE */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-surface">
            
            {/* 1. Headline */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-faint mb-1">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Give your note a bold headline..."
                className="w-full px-4 py-2.5 rounded-2xl bg-sunken border border-input text-sm sm:text-base font-extrabold text-main focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* 2. Key Highlight Banner */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-faint mb-1">
                Key Highlight / Takeaway (Optional)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-sunken border border-input">
                <Lightbulb size={16} className="text-accent shrink-0 stroke-[2.2]" />
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  placeholder="Core takeaway or highlight banner..."
                  className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-main focus:outline-none placeholder-faint"
                />
              </div>
            </div>

            {/* 3. Paragraph / Body with Quick Formatting Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-faint">
                  Paragraph / Body Notes
                </label>

                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => insertFormatting('• ')}
                    className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-surface border border-subtle text-muted hover:text-main cursor-pointer"
                  >
                    Bullet
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('[ ] ')}
                    className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-surface border border-subtle text-muted hover:text-main cursor-pointer"
                  >
                    Task [ ]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-surface border border-subtle text-muted hover:text-main cursor-pointer"
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
                className="w-full px-4 py-3 rounded-2xl bg-sunken border border-input text-xs sm:text-sm text-main focus:outline-none focus:ring-2 focus:ring-ring resize-none font-normal leading-relaxed"
              />
            </div>

            {/* 4. Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-faint">
                  Attachments ({attachments.length})
                </label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-accent-soft hover:bg-accent text-accent-text hover:text-on-accent rounded-xl text-xs font-bold border border-subtle transition active:scale-95 cursor-pointer"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-2xl bg-sunken border border-subtle">
                  {attachments.map((att) => {
                    const isImg = att.type.startsWith('image/');

                    return (
                      <div
                        key={att.id}
                        className="group relative flex items-center gap-2 p-2 rounded-xl bg-surface border border-subtle shadow-2xs overflow-hidden"
                      >
                        <div 
                          onClick={() => onOpenAttachment && onOpenAttachment(att)}
                          className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition"
                        >
                          {isImg ? (
                            <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={15} className="text-faint" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p 
                            onClick={() => onOpenAttachment && onOpenAttachment(att)}
                            className="text-[11px] font-bold text-main truncate cursor-pointer hover:underline"
                          >
                            {att.name}
                          </p>
                          <span className="text-[9px] text-faint font-mono">
                            {formatFileSize(att.size)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-faint hover:text-danger rounded-lg transition cursor-pointer"
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
                  className="p-3.5 rounded-2xl border border-dashed border-input text-center cursor-pointer hover:border-accent transition bg-sunken/40"
                >
                  <Paperclip size={15} className="mx-auto text-faint mb-1" />
                  <p className="text-xs font-semibold text-muted">
                    Click to attach images, screenshots, PDFs, or documents
                  </p>
                </div>
              )}
            </div>

            {/* 5. Category Hue Picker */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-faint mb-1.5">
                Note Color Palette
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {CATEGORY_KEYS.map((k) => {
                  const token = CATEGORY_TOKENS[k];
                  const isSelected = resolveCategoryKey(color) === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setColor(k);
                        playPopSound();
                      }}
                      className={`relative w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'scale-115 ring-2 ring-ring shadow-soft'
                          : 'hover:scale-105 opacity-80 hover:opacity-100 border-subtle'
                      }`}
                      style={{
                        backgroundColor: token.softVar,
                        borderColor: token.solidVar,
                      }}
                      title={token.name}
                    >
                      <span 
                        className="w-3 h-3 rounded-full mx-auto block"
                        style={{ backgroundColor: token.solidVar }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Cute Note Tag */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-faint mb-1.5">
                Note Tag
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['💡 Idea', '💖 Personal', '🚀 Project', '🎀 Cute', '📌 Urgent'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTag(t);
                      playPopSound();
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      tag === t
                        ? 'bg-main text-surface shadow-2xs'
                        : 'bg-sunken hover:bg-surface text-muted border border-subtle'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="pt-3 border-t border-subtle flex items-center justify-between">
              {note && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(note.id);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger-soft rounded-xl transition cursor-pointer"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-main hover:bg-sunken cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer"
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
