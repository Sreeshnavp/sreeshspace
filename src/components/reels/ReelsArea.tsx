import React, { useState, useMemo } from 'react';
import {
  Film,
  Plus,
  Play,
  Search,
  Star,
  Sparkles,
  LayoutGrid,
  Smartphone,
  Share2,
  Filter,
  X
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem, ReelViewMode } from '../../types/reels';
import { ReelCard } from './ReelCard';
import { ReelSequencePlayer } from './ReelSequencePlayer';
import { ReelModal } from './ReelModal';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface ReelsAreaProps {
  reels: ReelItem[];
  onSaveReel: (reel: ReelItem) => void;
  onDeleteReel: (id: string) => void;
  onToggleFavoriteReel: (id: string) => void;
}

const STARTER_SAMPLE_REELS: Omit<ReelItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    url: 'https://www.instagram.com/reel/C-xyz123/',
    shortcode: 'C-xyz123',
    headline: '5-Minute Morning Mobility Routine 🧘',
    author: '@movewithalec',
    takeaway: 'Key exercises:\n1. Cat-cow stretches (10 reps)\n2. Deep squat hold (60s)\n3. Thoracic rotations',
    collection: 'Fitness & Gym 💪',
    tags: ['morning', 'mobility', 'stretch'],
    favorite: true,
  },
  {
    url: 'https://www.instagram.com/reel/C-abc456/',
    shortcode: 'C-abc456',
    headline: 'Creamy Iced Matcha Cloud Latte 🍵',
    author: '@cafe_aesthetic',
    takeaway: 'Ingredients:\n- 2 tsp ceremonial matcha\n- 60ml warm water (whisk 80°C)\n- Cold oat milk\n- Sweet vanilla cloud foam on top',
    collection: 'Recipes 🍳',
    tags: ['matcha', 'recipe', 'aesthetic'],
    favorite: false,
  },
  {
    url: 'https://www.instagram.com/reel/C-def789/',
    shortcode: 'C-def789',
    headline: 'Top 3 Modern CSS Tricks for 2026 💻',
    author: '@frontend_ninja',
    takeaway: '1. `text-wrap: balance` for gorgeous headings\n2. `@container` queries for card grids\n3. `:has()` relational selector',
    collection: 'Coding & Tech 💻',
    tags: ['css', 'webdev', 'frontend'],
    favorite: true,
  },
];

export const ReelsArea: React.FC<ReelsAreaProps> = ({
  reels,
  onSaveReel,
  onDeleteReel,
  onToggleFavoriteReel,
}) => {
  const [viewMode, setViewMode] = useState<ReelViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [feedInitialId, setFeedInitialId] = useState<string | undefined>(undefined);
  const [isFeedFullscreen, setIsFeedFullscreen] = useState(false);

  // Available collections from saved reels
  const collections = useMemo(() => {
    const set = new Set<string>();
    reels.forEach((r) => {
      if (r.collection) set.add(r.collection);
    });
    return Array.from(set);
  }, [reels]);

  // Filtered Reels
  const filteredReels = useMemo(() => {
    let result = [...reels];

    // Collection filter
    if (selectedCollection === 'favorites') {
      result = result.filter((r) => r.favorite);
    } else if (selectedCollection !== 'all') {
      result = result.filter((r) => r.collection === selectedCollection);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.headline && r.headline.toLowerCase().includes(q)) ||
          (r.caption && r.caption.toLowerCase().includes(q)) ||
          (r.takeaway && r.takeaway.toLowerCase().includes(q)) ||
          (r.author && r.author.toLowerCase().includes(q)) ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sort: favorites first, then newest
    return result.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reels, selectedCollection, searchQuery]);

  const handleOpenAdd = () => {
    playPopSound();
    setEditingReel(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reel: ReelItem) => {
    playPopSound();
    setEditingReel(reel);
    setIsModalOpen(true);
  };

  const handlePlayInSequence = (reel?: ReelItem) => {
    playPopSound();
    setFeedInitialId(reel?.id || (filteredReels[0]?.id ?? undefined));
    setIsFeedFullscreen(true);
  };

  const handleAddSample = (sample: Omit<ReelItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    playPopSound();
    triggerPartyPop('single');
    const nowIso = new Date().toISOString();
    const newReel: ReelItem = {
      ...sample,
      id: `reel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    onSaveReel(newReel);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-surface rounded-3xl p-4 sm:p-6 border border-subtle shadow-soft space-y-4">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-soft shrink-0">
              <Film size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl text-main leading-tight">
                  Instagram Reels Vault
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-extrabold font-mono border border-rose-500/20">
                  {reels.length} {reels.length === 1 ? 'Reel' : 'Reels'}
                </span>
              </div>
              <p className="text-xs text-muted font-medium mt-0.5">
                Save reels directly from Instagram mobile share button • Curate key takeaways & watch in sequence
              </p>
            </div>
          </div>

          {/* Action Buttons: View Switcher & + Save Reel */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* View Mode Switcher: Grid vs Feed Sequence */}
            <div className="flex items-center p-1 rounded-2xl bg-sunken border border-subtle">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setViewMode('grid');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  handlePlayInSequence();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'feed'
                    ? 'bg-surface text-rose-600 shadow-2xs font-extrabold'
                    : 'text-muted hover:text-rose-500'
                }`}
                title="Watch Reels in Vertical Swipe Sequence"
              >
                <Smartphone size={13} className="stroke-[2.5]" />
                <span>Reel Feed</span>
              </button>
            </div>

            {/* Play All Sequence Button (if reels exist) */}
            {reels.length > 0 && (
              <button
                type="button"
                onClick={() => handlePlayInSequence()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sunken hover:bg-surface border border-subtle text-main font-bold text-xs transition active:scale-95 shadow-2xs cursor-pointer"
                title="Play in Fullscreen Sequence"
              >
                <Play size={13} className="fill-current text-rose-500" />
                <span className="hidden sm:inline">Play Sequence</span>
              </button>
            )}

            {/* Add Reel Button */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft hover:opacity-95 transition active:scale-95 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>+ Save Reel</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Collection Filter Chips */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reels by headline, creator, takeaways, tags..."
                className="w-full bg-sunken border border-subtle rounded-2xl pl-9 pr-8 py-2 text-xs font-medium text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-main"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Collection Filter Dropdown or Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setSelectedCollection('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                  selectedCollection === 'all'
                    ? 'bg-accent text-on-accent border-accent shadow-2xs'
                    : 'bg-sunken hover:bg-surface border-subtle text-muted'
                }`}
              >
                All ({reels.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setSelectedCollection('favorites');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer border ${
                  selectedCollection === 'favorites'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-sunken hover:bg-surface border-subtle text-muted'
                }`}
              >
                <Star size={11} className={selectedCollection === 'favorites' ? 'fill-current' : ''} />
                <span>Favorites ({reels.filter((r) => r.favorite).length})</span>
              </button>

              {collections.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setSelectedCollection(col);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    selectedCollection === col
                      ? 'bg-accent text-on-accent border-accent shadow-2xs'
                      : 'bg-sunken hover:bg-surface border-subtle text-muted'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Share Target Tip Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 border border-rose-500/20 flex items-start gap-3 text-xs">
        <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
          <Share2 size={14} className="stroke-[2.5]" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="font-extrabold text-main">
            📱 Mobile Tip: Direct Instagram Share Button!
          </p>
          <p className="text-muted leading-relaxed text-[11px]">
            When you install this PWA on your phone, you can tap the <strong>Send / Share</strong> icon on any Instagram reel, select <strong>Orbit</strong>, and it will automatically save right here with your highlights!
          </p>
        </div>
      </div>

      {/* Main Reels Grid Content */}
      {filteredReels.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-3xl bg-surface border border-subtle shadow-soft space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-raised text-2xl">
            🎬
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-extrabold text-main">
              {searchQuery || selectedCollection !== 'all'
                ? 'No matching reels found'
                : 'Your Instagram Reels Vault is empty'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {searchQuery || selectedCollection !== 'all'
                ? 'Try clearing your search query or collection filter.'
                : 'Save educational reels, fitness exercises, cooking recipes, or aesthetic inspiration to view in sequence!'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft hover:opacity-95 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>+ Save First Reel</span>
            </button>
          </div>

          {/* Quick Starter Inspiration Reels */}
          {reels.length === 0 && (
            <div className="pt-6 border-t border-subtle/60 max-w-lg mx-auto space-y-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Quick 1-Tap Starters to Try:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {STARTER_SAMPLE_REELS.map((sample) => (
                  <button
                    key={sample.headline}
                    type="button"
                    onClick={() => handleAddSample(sample)}
                    className="px-3 py-1.5 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-semibold text-main transition active:scale-95 shadow-2xs cursor-pointer text-left"
                  >
                    + {sample.headline}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredReels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              onPlayInSequence={handlePlayInSequence}
              onToggleFavorite={onToggleFavoriteReel}
              onEdit={handleOpenEdit}
              onDelete={onDeleteReel}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Vertical Sequence Player (Feed Mode) */}
      {isFeedFullscreen && filteredReels.length > 0 && (
        <ReelSequencePlayer
          reels={filteredReels}
          initialReelId={feedInitialId}
          onClose={() => setIsFeedFullscreen(false)}
          onToggleFavorite={onToggleFavoriteReel}
          onEdit={handleOpenEdit}
          onDelete={onDeleteReel}
        />
      )}

      {/* Add / Edit Reel Modal */}
      <ReelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reel={editingReel}
        onSave={onSaveReel}
      />

    </div>
  );
};
