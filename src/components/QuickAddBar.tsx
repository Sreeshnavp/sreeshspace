import React, { useState } from 'react';
import { Plus, Sparkles, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { normalizeUrl, generateSuggestedTitle, getFaviconUrl } from '../utils/urlHelper';

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
    <div className="bg-white dark:bg-espresso-850 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-soft border border-cream-300 dark:border-espresso-800 transition-all hover:border-sage-400 dark:hover:border-sage-600 focus-within:ring-2 focus-within:ring-sage-400/30">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="pl-2 sm:pl-3 text-sage-600 dark:text-sage-400">
          <LinkIcon size={18} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any link to save instantly (e.g. github.com)..."
          className="flex-1 bg-transparent py-2 px-1 text-xs sm:text-sm text-espresso-800 dark:text-cream-100 placeholder-espresso-800/40 dark:placeholder-cream-100/40 focus:outline-none"
        />

        {url.trim() && (
          <button
            type="button"
            onClick={() => {
              onOpenDetailedModal(url);
              setUrl('');
            }}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-950/60 px-2.5 py-1.5 rounded-xl transition"
          >
            <Sparkles size={13} />
            <span>Add notes & files</span>
          </button>
        )}

        <button
          type="submit"
          disabled={!url.trim()}
          className="flex items-center gap-1 bg-sage-600 hover:bg-sage-500 disabled:opacity-40 disabled:hover:bg-sage-600 text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl shadow-pill transition active:scale-95 shrink-0"
        >
          <span>Save</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
};
