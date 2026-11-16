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
  extractDomain, 
  getFaviconUrl, 
  generateSuggestedTitle, 
  formatFileSize 
} from '../utils/urlHelper';

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
      setCategory(initialData.category || categories[0]?.name || 'Work & Projects');
      setNotes(initialData.notes || '');
      setPinned(initialData.pinned || false);
      setAttachments(initialData.attachments || []);
    } else {
      setUrl(defaultUrl || '');
      setTitle(defaultUrl ? generateSuggestedTitle(defaultUrl) : '');
      setCategory(defaultCategory || categories[0]?.name || 'Work & Projects');
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
    const colors = ['#4e876c', '#f7885e', '#38bdf8', '#aa73d7', '#f59e0b', '#ec4899'];
    const icons = ['🌸', '💡', '📌', '🎯', '🚀', '☕', '🌿', '💻'];
    onAddCategory({
      name: newCatName.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
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
    const finalFavicon = getFaviconUrl(normalized);

    onSave({
      url: normalized,
      title: finalTitle,
      category: category || categories[0]?.name || 'Work & Projects',
      notes: notes.trim(),
      pinned,
      attachments,
      favicon: finalFavicon,
    });

    onClose();
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-espresso-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-100 dark:bg-sage-950 text-sage-700 dark:text-sage-300 flex items-center justify-center">
              <LinkIcon size={17} />
            </div>
            <h2 className="text-base font-bold text-espresso-900 dark:text-cream-50">
              {initialData ? 'Edit Link' : 'Save New Link'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          
          {/* URL Input with Star Button */}
          <div>
            <label className="block text-xs font-bold text-espresso-800 dark:text-cream-100 mb-1.5">
              Link URL <span className="text-peach-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com or github.com"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-cream-300 dark:border-espresso-750 bg-cream-50/50 dark:bg-espresso-850 text-espresso-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-400 font-mono text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`p-2.5 rounded-2xl border transition ${
                  pinned 
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-500' 
                    : 'border-cream-300 dark:border-espresso-750 text-espresso-800/30 dark:text-cream-100/30 hover:text-amber-400'
                }`}
                title="Star / Favorite"
              >
                <Star size={18} className={pinned ? 'fill-amber-400' : ''} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-espresso-800 dark:text-cream-100">
                Title / Name
              </label>
              {url && !title && (
                <button
                  type="button"
                  onClick={() => setTitle(generateSuggestedTitle(url))}
                  className="text-[11px] text-sage-600 dark:text-sage-400 hover:underline flex items-center gap-1"
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
              className="w-full px-4 py-2.5 rounded-2xl border border-cream-300 dark:border-espresso-750 bg-cream-50/50 dark:bg-espresso-850 text-espresso-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-400 text-xs sm:text-sm"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-espresso-800 dark:text-cream-100 mb-1.5">
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 border ${
                      isSelected
                        ? 'bg-sage-600 text-white border-sage-600 shadow-pill'
                        : 'bg-white dark:bg-espresso-850 text-espresso-800/80 dark:text-cream-100/80 border-cream-300 dark:border-espresso-750 hover:bg-cream-100 dark:hover:bg-espresso-800'
                    }`}
                  >
                    {c.icon || '📁'} {c.name}
                  </button>
                );
              })}

              {isAddingCategory ? (
                <div className="inline-flex items-center gap-1 bg-white dark:bg-espresso-850 px-2.5 py-1 rounded-full border border-sage-400">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New folder..."
                    className="text-xs bg-transparent text-espresso-800 dark:text-cream-100 focus:outline-none w-24"
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateCategory} className="text-[10px] bg-sage-600 text-white px-2 py-0.5 rounded-full font-bold">
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-2.5 py-1.5 rounded-full text-xs font-medium text-sage-600 dark:text-sage-400 hover:bg-sage-100 dark:hover:bg-espresso-800 transition"
                >
                  + New
                </button>
              )}
            </div>
          </div>

          {/* Uses & Context Notes */}
          <div>
            <label className="block text-xs font-bold text-espresso-800 dark:text-cream-100 mb-1.5">
              Uses & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What do you use this for? Add instructions, steps, reminders, or tips..."
              className="w-full px-4 py-2.5 rounded-2xl border border-cream-300 dark:border-espresso-750 bg-cream-50/50 dark:bg-espresso-850 text-espresso-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-400 text-xs sm:text-sm leading-relaxed"
            />
          </div>

          {/* File Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-espresso-800 dark:text-cream-100 flex items-center gap-1">
                <Paperclip size={13} className="text-peach-500" />
                Attachments & Screenshots
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-sage-600 dark:text-sage-400 hover:underline flex items-center gap-0.5 font-semibold"
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
                className="p-3.5 rounded-2xl border border-dashed border-cream-300 dark:border-espresso-750 hover:border-sage-400 text-center cursor-pointer transition bg-cream-50/30 dark:bg-espresso-850/30"
              >
                <UploadCloud size={20} className="mx-auto text-espresso-800/30 dark:text-cream-100/30 mb-1" />
                <p className="text-xs text-espresso-800/60 dark:text-cream-100/60">
                  Tap to attach screenshot, image, or PDF
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-cream-100 dark:bg-espresso-850 border border-cream-200 dark:border-espresso-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type?.startsWith('image/') ? (
                        <img src={file.dataUrl} alt="" className="w-6 h-6 object-cover rounded-lg shrink-0" />
                      ) : (
                        <Paperclip size={14} className="text-peach-500 shrink-0" />
                      )}
                      <span className="truncate font-medium text-espresso-800 dark:text-cream-100">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-espresso-800/40">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((a) => a.id !== file.id))}
                      className="p-1 text-espresso-800/40 hover:text-red-500 rounded"
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
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-sage-600 hover:bg-sage-500 rounded-2xl shadow-pill transition active:scale-95"
          >
            {initialData ? 'Save Changes' : 'Save to Vault'}
          </button>
        </div>

      </div>
    </div>
  );
};
