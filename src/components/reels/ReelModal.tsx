import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Check,
  Star,
  Tag,
  Bookmark,
  FileText,
  Clipboard,
  ExternalLink,
  Play,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem, CategoryInfo } from '../../types';
import {
  extractInstagramReelInfo,
  resolveInstagramCover,
  isValidCoverUrl,
  getInstagramThumbnailUrl,
  getSafeCoverPhotoUrl,
} from '../../utils/instagramHelper';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface ReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel?: ReelItem | null;
  initialUrl?: string;
  categories?: CategoryInfo[];
  defaultCategory?: string;
  onSave: (reel: ReelItem) => void;
}

export const ReelModal: React.FC<ReelModalProps> = ({
  isOpen,
  onClose,
  reel,
  initialUrl = '',
  categories,
  defaultCategory,
  onSave,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [headline, setHeadline] = useState('');
  const [caption, setCaption] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [author, setAuthor] = useState('');
  const [collection, setCollection] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [parsedShortcode, setParsedShortcode] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isResolvingCover, setIsResolvingCover] = useState(false);
  const [showCustomCoverInput, setShowCustomCoverInput] = useState(false);
  const [urlError, setUrlError] = useState('');

  const autoFetchCover = (code: string) => {
    if (!code) return;
    setIsResolvingCover(true);
    resolveInstagramCover(code).then((meta) => {
      setIsResolvingCover(false);
      if (meta && isValidCoverUrl(meta.thumbnailUrl)) {
        setThumbnailUrl(meta.thumbnailUrl);
        setHeadline((prev) => (!prev || prev.startsWith('Instagram Reel') ? meta.title?.slice(0, 50) || prev : prev));
        setAuthor((prev) => (!prev && meta.author ? meta.author : prev));
      }
    }).catch(() => {
      setIsResolvingCover(false);
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    if (reel) {
      setUrlInput(reel.url);
      setHeadline(reel.headline || '');
      setCaption(reel.caption || '');
      setTakeaway(reel.takeaway || '');
      setAuthor(reel.author || '');
      setCollection(reel.collection || '');
      setTagInput(reel.tags ? reel.tags.join(', ') : '');
      setFavorite(Boolean(reel.favorite));
      setParsedShortcode(reel.shortcode);
      const existingThumb = isValidCoverUrl(reel.thumbnailUrl)
        ? reel.thumbnailUrl!
        : getInstagramThumbnailUrl(reel.shortcode, 'l');
      setThumbnailUrl(existingThumb);
      setUrlError('');
      if (!isValidCoverUrl(reel.thumbnailUrl)) {
        autoFetchCover(reel.shortcode);
      }
    } else {
      const startUrl = initialUrl.trim();
      const initialCat = defaultCategory || '';
      setUrlInput(startUrl);
      setHeadline('');
      setCaption('');
      setTakeaway('');
      setAuthor('');
      setCollection(initialCat);
      setTagInput('');
      setFavorite(false);
      setUrlError('');
      setShowCustomCoverInput(false);

      if (startUrl) {
        const parsed = extractInstagramReelInfo(startUrl);
        if (parsed) {
          setParsedShortcode(parsed.shortcode);
          setThumbnailUrl(parsed.thumbnailUrl);
          if (parsed.author) setAuthor(parsed.author);
          if (parsed.suggestedCaption) setCaption(parsed.suggestedCaption);
          if (parsed.suggestedHeadline) setHeadline(parsed.suggestedHeadline);
          autoFetchCover(parsed.shortcode);
        }
      } else {
        setParsedShortcode('');
        setThumbnailUrl('');
      }
    }
  }, [isOpen, reel, initialUrl]);

  if (!isOpen) return null;

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setUrlError('');

    const parsed = extractInstagramReelInfo(val);
    if (parsed) {
      setParsedShortcode(parsed.shortcode);
      setThumbnailUrl(parsed.thumbnailUrl);
      if (!author && parsed.author) setAuthor(parsed.author);
      if (!caption && parsed.suggestedCaption) setCaption(parsed.suggestedCaption);
      if (!headline && parsed.suggestedHeadline) setHeadline(parsed.suggestedHeadline);
      autoFetchCover(parsed.shortcode);
    } else if (val.trim().length > 0) {
      setParsedShortcode('');
      setThumbnailUrl('');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      playPopSound();
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text);
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = extractInstagramReelInfo(urlInput);

    if (!parsed) {
      setUrlError('Please enter a valid Instagram Reel or Post link (e.g. instagram.com/reel/...)');
      return;
    }

    playPopSound();
    triggerPartyPop('single');

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const nowIso = new Date().toISOString();
    const reelToSave: ReelItem = {
      id: reel ? reel.id : `reel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url: parsed.canonicalUrl,
      shortcode: parsed.shortcode,
      headline: headline.trim() || parsed.suggestedHeadline || 'Saved Reel',
      caption: caption.trim() || undefined,
      takeaway: takeaway.trim() || undefined,
      author: author.trim() || parsed.author || undefined,
      collection: collection.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      favorite,
      thumbnailUrl: thumbnailUrl || (parsed ? parsed.thumbnailUrl : undefined),
      order: reel?.order,
      createdAt: reel ? reel.createdAt : nowIso,
      updatedAt: nowIso,
    };

    onSave(reelToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface text-main rounded-3xl border border-subtle shadow-raised p-4 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-2xs select-none">
              <Instagram size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-main leading-tight flex items-center gap-1.5">
                <span>{reel ? 'Edit Saved Reel' : 'Save Instagram Reel'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold font-mono">
                  Reels Vault
                </span>
              </h2>
              <p className="text-[11px] text-muted font-medium">
                Save & curate reels with your custom headlines and key takeaways
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-sunken text-muted hover:text-main cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} id="reel-form" className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none text-xs">
          
          {/* Instagram URL Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Instagram Reel Link <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Clipboard size={11} />
                <span>Paste Link</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.instagram.com/reel/C8xyz123/ or paste shared text"
                autoFocus={!reel}
                required
                className={`w-full bg-sunken border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs ${
                  urlError ? 'border-danger/60' : 'border-subtle'
                }`}
              />
            </div>

            {urlError && (
              <p className="text-[11px] font-bold text-danger animate-in fade-in">
                {urlError}
              </p>
            )}

            {parsedShortcode && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check size={12} className="stroke-[3]" />
                  <span>Detected Instagram Reel:</span>
                  <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                    {parsedShortcode}
                  </span>
                </div>

                {/* Default Reel Cover Photo in Modal */}
                <div className="p-3 rounded-2xl bg-surface border border-subtle flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border border-subtle bg-sunken shrink-0 relative group/preview">
                    {isValidCoverUrl(thumbnailUrl) ? (
                      <img
                        src={getSafeCoverPhotoUrl(thumbnailUrl) || thumbnailUrl}
                        alt="Reel Cover"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-rose-500/10 text-rose-500 p-1 text-center">
                        <Instagram size={18} />
                        <span className="text-[8px] font-mono mt-1">Reel</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play size={14} className="fill-white text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-main">
                        <Sparkles size={12} className="text-rose-500" />
                        <span>Reel Cover Photo</span>
                        {isResolvingCover ? (
                          <span className="text-[10px] text-accent font-medium flex items-center gap-1 animate-pulse">
                            <RefreshCw size={10} className="animate-spin" /> Fetching cover...
                          </span>
                        ) : isValidCoverUrl(thumbnailUrl) ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                            <Check size={10} className="stroke-[3]" /> Original cover ready
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => autoFetchCover(parsedShortcode)}
                        className="p-1 rounded-lg hover:bg-sunken text-muted hover:text-main text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                        title="Re-fetch cover photo"
                      >
                        <RefreshCw size={11} className={isResolvingCover ? 'animate-spin' : ''} />
                        <span>Re-fetch</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted leading-tight">
                      This cover photo is shown on cards and in your reels feed.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowCustomCoverInput(!showCustomCoverInput)}
                      className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                    >
                      <ImageIcon size={10} />
                      <span>{showCustomCoverInput ? 'Hide Cover URL' : 'Custom Cover Image URL...'}</span>
                    </button>

                    {showCustomCoverInput && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          placeholder="https://... cover image URL"
                          className="w-full bg-sunken border border-subtle rounded-xl px-2.5 py-1 text-[11px] font-mono text-main placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-ring/40"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Headline / Key Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Highlight Headline / Title
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. 5-Min Matcha Cloud Latte 🍵, Core Workout Routine 💪"
              className="w-full bg-sunken border border-subtle rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
            />
          </div>

          {/* Key Takeaway / Highlight Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Key Takeaways & Highlights
            </label>
            <textarea
              rows={3}
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              placeholder="What made this reel worth saving? (e.g. Ingredients: Oat milk, matcha powder, honey; Key tip: whisk in W shape)"
              className="w-full bg-sunken border border-subtle rounded-xl px-3.5 py-2 text-xs font-medium text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs resize-none"
            />
          </div>

          {/* Author & Collection in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Creator / Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="@username"
                className="w-full bg-sunken border border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full bg-sunken border border-subtle rounded-xl px-3 py-2 text-xs font-bold text-main focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs cursor-pointer"
              >
                <option value="">No Collection (Loose Reel)</option>
                {categories && categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name} {c.icon || ''}
                    </option>
                  ))
                ) : null}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Tags (comma separated)
            </label>
            <div className="flex items-center gap-1.5">
              <Tag size={13} className="text-muted" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="recipe, matcha, morning, healthy"
                className="w-full bg-sunken border border-subtle rounded-xl px-3 py-2 text-xs font-medium text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
              />
            </div>
          </div>

          {/* Caption (Collapsible / optional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Full Caption / Shared Text
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Original reel caption or post description..."
              className="w-full bg-sunken border border-subtle rounded-xl px-3 py-2 text-xs font-medium text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs resize-none"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="pt-1 flex items-center justify-between bg-sunken/50 p-2.5 rounded-2xl border border-subtle">
            <span className="text-xs font-bold text-main flex items-center gap-1.5">
              <Star size={13} className={favorite ? 'text-amber-500 fill-amber-500' : 'text-muted'} />
              <span>Mark as Favorite Reel ⭐</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setFavorite(!favorite);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                favorite
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-surface border border-subtle text-muted'
              }`}
            >
              {favorite ? 'Starred' : 'Off'}
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-subtle flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-muted cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="reel-form"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft hover:opacity-95 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} className="stroke-[3]" />
            <span>{reel ? 'Update Reel' : 'Save to Vault'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
