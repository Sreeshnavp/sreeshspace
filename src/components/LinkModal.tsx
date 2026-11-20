import React, { useState, useEffect, useRef } from 'react';
import type { LinkItem, CategoryInfo, Attachment } from '../types';
import { 
  normalizeUrl, 
  generateSuggestedTitle, 
  formatFileSize 
} from '../utils/urlHelper';
import { CATEGORY_KEYS } from '../utils/themeColors';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkData: Partial<LinkItem>) => void;
  initialData?: LinkItem | null;
  categories: CategoryInfo[];
  onAddCategory: (category: { name: string; color: string; icon: string }) => void;
  defaultUrl?: string;
  defaultCategory?: string;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  onAddCategory,
  defaultUrl,
  defaultCategory,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [pinned, setPinned] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);
  const prevIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    const itemChanged = isOpen && initialData?.id !== prevIdRef.current;

    if (justOpened || itemChanged) {
      if (initialData) {
        setUrl(initialData.url || '');
        setTitle(initialData.title || '');
        setCategory(initialData.category || 'Uncategorized');
        setNotes(initialData.notes || '');
        setPinned(initialData.pinned || false);
        setAttachments(initialData.attachments || []);
      } else {
        setUrl(defaultUrl || '');
        setTitle(defaultUrl ? generateSuggestedTitle(defaultUrl) : '');
        setCategory(defaultCategory || 'Uncategorized');
        setNotes('');
        setPinned(false);
        setAttachments([]);
      }
      setIsAddingCategory(false);
      setNewCatName('');
    }

    prevOpenRef.current = isOpen;
    prevIdRef.current = initialData?.id;
  }, [isOpen, initialData?.id, defaultUrl, defaultCategory]);

  if (!isOpen) return null;

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!title.trim() && val.trim().length > 4 && val.includes('.') && !val.endsWith('.')) {
      const suggested = generateSuggestedTitle(val);
      if (
        suggested && 
        suggested !== 'New Link' && 
        suggested.toLowerCase() !== 'http' && 
        suggested.toLowerCase() !== 'https'
      ) {
        setTitle(suggested);
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text.trim());
      }
    } catch {
      // Ignore if permission denied
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          createdAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const icons = ['🌸', '💡', '📌', '🎯', '🚀', '☕', '🌿', '💻'];
    onAddCategory({
      name: newCatName.trim(),
      color: CATEGORY_KEYS[Math.floor(Math.random() * CATEGORY_KEYS.length)],
      icon: icons[Math.floor(Math.random() * icons.length)],
    });
    setCategory(newCatName.trim());
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    const normalized = normalizeUrl(url);
    const finalTitle = title.trim() || generateSuggestedTitle(normalized);

    onSave({
      url: normalized,
      title: finalTitle,
      category: category || 'Uncategorized',
      notes: notes.trim(),
      pinned,
      attachments,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-200 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-3xl p-5 pb-6 shadow-2xl border border-border-subtle flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto z-50 text-on-surface animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle for mobile */}
        <div className="w-10 h-1.5 rounded-full bg-surface-variant mx-auto mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center font-bold text-[20px] shadow-sm">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight font-fraunces">
                  {initialData ? 'Edit Link' : 'Add New Link'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-peach-subtle text-tertiary-container font-label-sm text-[10px] font-bold">
                  WHIMSY
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Organize into your curated space
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-canvas-bg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-lavender-subtle transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-3">
          {/* Link Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
              <span className="text-primary">✦</span> Link Name
            </label>
            <input 
              className="w-full px-3.5 py-2.5 rounded-2xl bg-canvas-bg border border-border-subtle font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm shadow-xs" 
              placeholder="e.g. Notion Workspace" 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Link URL */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
              <span className="text-sky-accent">✦</span> Link URL
            </label>
            <div className="flex items-center rounded-2xl bg-canvas-bg border border-border-subtle overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary shadow-xs">
              <input 
                className="flex-1 px-3.5 py-2.5 bg-transparent font-body-md text-on-surface focus:outline-none text-sm font-mono" 
                placeholder="https://example.com" 
                type="text" 
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
              />
              <button 
                className="px-2.5 py-1 mr-1.5 rounded-xl bg-surface-card border border-border-subtle text-on-surface-variant text-label-sm font-label-sm hover:text-primary transition-all flex items-center gap-0.5 active:scale-95" 
                type="button"
                onClick={handlePasteClipboard}
              >
                <span className="material-symbols-outlined text-[14px]">content_paste</span>
                <span>Paste</span>
              </button>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
              <span className="text-outline">✦</span> Description &amp; Notes
            </label>
            <input 
              className="w-full px-3.5 py-2 rounded-2xl bg-canvas-bg border border-border-subtle font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm shadow-xs" 
              placeholder="Brief notes or tags..." 
              type="text" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Category Select & Starred Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
                  <span className="text-primary">✦</span> Category / Folder
                </label>
                <button 
                  type="button" 
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-primary hover:underline font-label-sm text-[11px] font-bold flex items-center gap-0.5"
                >
                  + New Folder
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1 bg-canvas-bg p-1 rounded-2xl border border-border-subtle">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Folder name..."
                    className="flex-1 px-2 py-1 text-xs bg-transparent text-on-surface focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select 
                  className="w-full px-3 py-2.5 rounded-2xl bg-canvas-bg border border-border-subtle font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm shadow-xs cursor-pointer"
                  value={category || 'Uncategorized'}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Uncategorized">📌 Canvas (Independent / Unfiled)</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.icon || '📁'} {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Starred Priority Toggle */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                Starred Priority
              </label>
              <div 
                onClick={() => setPinned(!pinned)}
                className="flex items-center justify-between px-3 py-2 rounded-2xl bg-canvas-bg border border-border-subtle shadow-xs cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sunshine-accent text-[15px]">★</span>
                  <span className="font-label-md text-label-md text-on-surface font-medium">Add to Starred</span>
                </div>
                <div className={`w-9 h-5 rounded-full relative p-0.5 transition-colors flex items-center ${pinned ? 'bg-primary' : 'bg-surface-variant'}`}>
                  <div className={`w-4 h-4 rounded-full bg-surface-card shadow-xs transition-transform ${pinned ? 'ml-auto' : 'ml-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments & Files */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">attachment</span>
                <span>Attachments &amp; Screenshots</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline font-label-sm text-[11px] font-bold"
              >
                + Add File
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-canvas-bg border border-border-subtle text-[11px]"
                  >
                    <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter(a => a.id !== file.id))}
                      className="text-tertiary hover:opacity-80 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border-subtle mt-1">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-surface-card border border-border-subtle text-on-surface font-label-md text-label-md hover:bg-canvas-bg active:scale-95 transition-all text-center font-semibold shadow-xs"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => handleSubmit()}
            className="flex-[2] py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-[0_4px_16px_rgba(107,56,212,0.4)] hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>{initialData ? 'Save Changes' : 'Save Link ✨'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
