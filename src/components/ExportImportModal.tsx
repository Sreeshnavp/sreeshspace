import React, { useState, useRef } from 'react';
import { 
  X, 
  DownloadCloud, 
  UploadCloud, 
  Check, 
  AlertTriangle, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import type { LinkItem, CategoryInfo, TodoItem, NoteItem } from '../types';
import { exportBackup, downloadJsonFile } from '../services/storage';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  categories: CategoryInfo[];
  todos?: TodoItem[];
  notes?: NoteItem[];
  onImportData: (data: { links: LinkItem[]; categories: CategoryInfo[]; todos?: TodoItem[]; notes?: NoteItem[] }, mode: 'merge' | 'replace') => void;
  onResetData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  links,
  categories,
  todos,
  notes,
  onImportData,
  onResetData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportBackup(links, categories, todos, notes);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJsonFile(jsonStr, `sreeshspace-vault-${dateStr}.json`);
    setImportStatus('Backup downloaded successfully!');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.links || !Array.isArray(parsed.links)) {
          throw new Error('Invalid file format: missing "links" list.');
        }

        const validLinks = parsed.links;
        const validCategories = Array.isArray(parsed.categories) ? parsed.categories : categories;
        const validTodos = Array.isArray(parsed.todos) ? parsed.todos : undefined;
        const validNotes = Array.isArray(parsed.notes) ? parsed.notes : undefined;

        onImportData({ 
          links: validLinks, 
          categories: validCategories,
          todos: validTodos,
          notes: validNotes,
        }, 'merge');
        setImportStatus(`Imported ${validLinks.length} links, tasks & notes!`);
        setImportError(null);
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } catch (err: any) {
        setImportError(err.message || 'Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-espresso-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-espresso-900 rounded-3xl shadow-2xl border border-cream-300 dark:border-espresso-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-espresso-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-100 dark:bg-sage-950 text-sage-700 dark:text-sage-300 flex items-center justify-center">
              <DownloadCloud size={17} />
            </div>
            <h2 className="text-base font-bold text-espresso-900 dark:text-cream-50">
              Backup & Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          
          {importStatus && (
            <div className="p-3 bg-sage-50 dark:bg-sage-950 border border-sage-200 dark:border-sage-800 rounded-2xl text-sage-700 dark:text-sage-300 flex items-center gap-2">
              <Check size={16} />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-peach-50 dark:bg-peach-950 border border-peach-200 dark:border-peach-800 rounded-2xl text-peach-600 dark:text-peach-300 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{importError}</span>
            </div>
          )}

          {/* Export Box */}
          <div className="p-4 rounded-2xl border border-cream-200 dark:border-espresso-800 bg-cream-50/70 dark:bg-espresso-850 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-espresso-900 dark:text-cream-50 text-xs sm:text-sm">
                Save Backup File
              </h4>
              <p className="text-[11px] text-espresso-800/50 dark:text-cream-100/50">
                Download all {links.length} links, notes, and files
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sage-600 hover:bg-sage-500 text-white rounded-xl text-xs font-bold shadow-pill transition active:scale-95"
            >
              <DownloadCloud size={13} />
              <span>Export</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl border border-cream-200 dark:border-espresso-800 bg-cream-50/70 dark:bg-espresso-850 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-espresso-900 dark:text-cream-50 text-xs sm:text-sm">
                Restore from Backup
              </h4>
              <p className="text-[11px] text-espresso-800/50 dark:text-cream-100/50">
                Import JSON backup onto any device
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-100 hover:bg-cream-100 rounded-xl text-xs font-semibold transition active:scale-95"
              >
                <UploadCloud size={13} />
                <span>Upload</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-sage-50/60 dark:bg-sage-950/40 rounded-2xl text-sage-800 dark:text-sage-300 text-xs">
            <ShieldCheck size={16} className="text-sage-600 shrink-0" />
            <span>100% Private: All data stays in your browser on this device.</span>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-espresso-800/40">
            <span>Reset sample items?</span>
            <button
              onClick={() => {
                if (window.confirm('Reset bookmarks back to sample data?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-xs text-espresso-800/50 hover:text-red-500 flex items-center gap-1 transition"
            >
              <RotateCcw size={12} /> Reset to defaults
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-800 rounded-xl"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
