import React, { useState } from 'react';
import { Sparkles, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { normalizeUrl, generateSuggestedTitle } from '../utils/urlHelper';

interface QuickAddBarProps {
  onQuickAdd: (url: string, title?: string) => void;
  onOpenDetailedModal: (initialUrl?: string) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onQuickAdd,
  onOpenDetailedModal,
}) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const normalized = normalizeUrl(url);
    const suggestedTitle = generateSuggestedTitle(normalized);
    onQuickAdd(normalized, suggestedTitle);
    setUrl('');
  };

  return (
    <div className="bg-surface p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-soft border border-subtle transition-all hover:border-strong focus-within:ring-2 focus-within:ring-ring text-main">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="pl-2 sm:pl-3 text-accent">
          <LinkIcon size={18} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any link to save instantly (e.g. github.com)..."
          className="flex-1 bg-transparent py-2 px-1 text-xs sm:text-sm text-main placeholder-faint focus:outline-none"
        />

        {url.trim() ? (
          <button
            type="button"
            onClick={() => {
              onOpenDetailedModal(url);
              setUrl('');
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:bg-accent-soft px-2 sm:px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
            title="Add headline, description, folder and files"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Add notes & details</span>
            <span className="sm:hidden">+ Details</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenDetailedModal()}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent hover:bg-accent-soft px-2 sm:px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
            title="Open full dialog to add link with headline and description"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Detailed</span>
          </button>
        )}

        <button
          type="submit"
          disabled={!url.trim()}
          className="flex items-center gap-1 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-on-accent font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl shadow-soft transition active:scale-95 shrink-0 cursor-pointer"
        >
          <span>Save</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
};
