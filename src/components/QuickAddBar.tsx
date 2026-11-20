import React, { useState, useMemo } from 'react';
import { normalizeUrl, generateSuggestedTitle } from '../utils/urlHelper';
import './links.css';

interface QuickAddBarProps {
  onQuickAdd: (url: string, title?: string) => void;
  onOpenDetailedModal: (initialUrl?: string) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onQuickAdd,
  onOpenDetailedModal,
}) => {
  const [url, setUrl] = useState('');

  const { greeting, dateText } = useMemo(() => {
    const now = new Date();
    const hr = now.getHours();
    const greetingText = (hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') + ', Sreeshnav';
    const formattedDate = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return {
      greeting: greetingText,
      dateText: `${formattedDate} · everything you saved, one calm place.`
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const normalized = normalizeUrl(url);
    const suggestedTitle = generateSuggestedTitle(normalized);
    onQuickAdd(normalized, suggestedTitle);
    setUrl('');
  };

  return (
    <section className="orbit-hero-greet">
      <div className="sun">🌤️</div>
      <h1>{greeting}</h1>
      <p>{dateText}</p>
      
      <form onSubmit={handleSubmit} className="capture">
        <span style={{ fontSize: '16px', userSelect: 'none' }}>🔗</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any link to save instantly (e.g. github.com)…"
          aria-label="Link to save"
        />

        {url.trim() ? (
          <button
            type="button"
            onClick={() => {
              onOpenDetailedModal(url);
              setUrl('');
            }}
            className="btn-details"
            title="Add headline, description, folder and files"
          >
            + Details
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenDetailedModal()}
            className="btn-details"
            title="Open full dialog to add link with headline and description"
          >
            + Details
          </button>
        )}

        <button
          type="submit"
          disabled={!url.trim()}
          className="btn-save"
        >
          Save
        </button>
      </form>
    </section>
  );
};
