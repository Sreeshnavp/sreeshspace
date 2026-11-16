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
    downloadJsonFile(jsonStr, `orbit-vault-${dateStr}.json`);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-surface rounded-3xl shadow-raised border border-subtle flex flex-col overflow-hidden text-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <DownloadCloud size={17} />
            </div>
            <h2 className="text-base font-bold text-main">
              Backup & Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          
          {importStatus && (
            <div className="p-3 bg-success-soft border border-subtle rounded-2xl text-success-text flex items-center gap-2">
              <Check size={16} />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-danger-soft border border-subtle rounded-2xl text-danger-text flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{importError}</span>
            </div>
          )}

          {/* Export Box */}
          <div className="p-4 rounded-2xl border border-subtle bg-sunken flex items-center justify-between">
            <div>
              <h4 className="font-bold text-main text-xs sm:text-sm">
                Save Backup File
              </h4>
              <p className="text-[11px] text-muted">
                Download all {links.length} links, notes, and files
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-xl text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer"
            >
              <DownloadCloud size={13} />
              <span>Export</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl border border-subtle bg-sunken flex items-center justify-between">
            <div>
              <h4 className="font-bold text-main text-xs sm:text-sm">
                Restore from Backup
              </h4>
              <p className="text-[11px] text-muted">
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface border border-input text-main hover:bg-sunken rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                <UploadCloud size={13} />
                <span>Upload</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-sunken rounded-2xl text-muted text-xs border border-subtle">
            <ShieldCheck size={16} className="text-accent shrink-0" />
            <span>100% Private: All data stays in your browser on this device.</span>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-faint">
            <span>Clear workspace?</span>
            <button
              onClick={() => {
                if (window.confirm('Clear all items and reset to a clean empty canvas?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-xs text-faint hover:text-danger flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw size={12} /> Clear to clean canvas
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-subtle bg-sunken flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-muted hover:text-main rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
