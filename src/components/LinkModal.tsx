import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Paperclip, 
  Star, 
  Sparkles, 
  Trash2, 
  UploadCloud,
  Plus
} from 'lucide-react';
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

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url);
      setTitle(initialData.title);
      setCategory(initialData.category || categories[0]?.name || 'Uncategorized');
      setNotes(initialData.notes || '');
      setPinned(initialData.pinned || false);
      setAttachments(initialData.attachments || []);
    } else {
      setUrl(defaultUrl || '');
      setTitle(defaultUrl ? generateSuggestedTitle(defaultUrl) : '');
      setCategory(defaultCategory || categories[0]?.name || 'Uncategorized');
      setNotes('');
      setPinned(false);
      setAttachments([]);
    }
  }, [initialData, isOpen, categories, defaultUrl, defaultCategory]);

  if (!isOpen) return null;

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!title && val.trim().length > 3) {
      const suggested = generateSuggestedTitle(val);
      if (suggested && suggested !== 'New Link') {
        setTitle(suggested);
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const normalized = normalizeUrl(url);
    const finalTitle = title.trim() || generateSuggestedTitle(normalized);

    onSave({
      url: normalized,
      title: finalTitle,
      category: category || categories[0]?.name || 'Uncategorized',
      notes: notes.trim(),
      pinned,
      attachments,
    });

    onClose();
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent-text flex items-center justify-center">
              <LinkIcon size={17} />
            </div>
            <h2 className="text-base font-bold text-main">
              {initialData ? 'Edit Link' : 'Save New Link'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          
          {/* URL Input with Star Button */}
          <div>
            <label className="block text-xs font-bold text-main mb-1.5">
              Link URL <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com or github.com"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-input bg-sunken text-main focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                  pinned 
                    ? 'border-accent bg-accent-soft text-accent' 
                    : 'border-input text-faint hover:text-muted'
                }`}
                title="Star / Favorite"
              >
                <Star size={18} className={pinned ? 'fill-accent' : ''} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-main">
                Title / Name
              </label>
              {url && !title && (
                <button
                  type="button"
                  onClick={() => setTitle(generateSuggestedTitle(url))}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} /> Auto-fill
                </button>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tailwind CSS or Cool Design Resource"
              className="w-full px-4 py-2.5 rounded-2xl border border-input bg-sunken text-main focus:outline-none focus:ring-2 focus:ring-ring text-xs sm:text-sm"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-main mb-1.5">
              Folder / Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const isSelected = category === c.name;
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 border cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-on-accent border-accent shadow-soft'
                        : 'bg-surface text-main border-subtle hover:bg-sunken'
                    }`}
                  >
                    {c.icon || '📁'} {c.name}
                  </button>
                );
              })}

              {isAddingCategory ? (
                <div className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-full border border-input">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New folder..."
                    className="text-xs bg-transparent text-main focus:outline-none w-24"
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateCategory} className="text-[10px] bg-accent text-on-accent px-2 py-0.5 rounded-full font-bold cursor-pointer">
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-2.5 py-1.5 rounded-full text-xs font-medium text-accent hover:bg-accent-soft transition cursor-pointer"
                >
                  + New
                </button>
              )}
            </div>
          </div>

          {/* Uses & Context Notes */}
          <div>
            <label className="block text-xs font-bold text-main mb-1.5">
              Uses & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What do you use this for? Add instructions, steps, reminders, or tips..."
              className="w-full px-4 py-2.5 rounded-2xl border border-input bg-sunken text-main focus:outline-none focus:ring-2 focus:ring-ring text-xs sm:text-sm leading-relaxed"
            />
          </div>

          {/* File Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-main flex items-center gap-1">
                <Paperclip size={13} className="text-accent" />
                Attachments & Screenshots
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
              >
                <Plus size={12} /> Add File
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

            {attachments.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl border border-dashed border-input hover:border-accent text-center cursor-pointer transition bg-sunken/40"
              >
                <UploadCloud size={20} className="mx-auto text-faint mb-1" />
                <p className="text-xs text-muted">
                  Tap to attach screenshot, image, or PDF
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-sunken border border-subtle text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type?.startsWith('image/') ? (
                        <img src={file.dataUrl} alt="" className="w-6 h-6 object-cover rounded-lg shrink-0" />
                      ) : (
                        <Paperclip size={14} className="text-accent shrink-0" />
                      )}
                      <span className="truncate font-medium text-main">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-faint">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((a) => a.id !== file.id))}
                      className="p-1 text-faint hover:text-danger rounded cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-subtle bg-sunken">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted hover:text-main rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-on-accent bg-accent hover:bg-accent-hover rounded-2xl shadow-soft transition active:scale-95 cursor-pointer"
          >
            {initialData ? 'Save Changes' : 'Save to Vault'}
          </button>
        </div>

      </div>
    </div>
  );
};
