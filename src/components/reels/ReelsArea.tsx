import React, { useState, useMemo } from 'react';
import {
  Film,
  Plus,
  Play,
  Search,
  Star,
  Sparkles,
  LayoutGrid,
  List,
  Smartphone,
  Share2,
  Filter,
  X,
  Clipboard,
  Info,
  ArrowUpDown,
  GripVertical
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem } from '../../types/reels';
import { ReelCard } from './ReelCard';
import { ReelListItem } from './ReelListItem';
import { ReelSequencePlayer } from './ReelSequencePlayer';
import { ReelModal } from './ReelModal';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface ReelsAreaProps {
  reels: ReelItem[];
  onSaveReel: (reel: ReelItem) => void;
  onDeleteReel: (id: string) => void;
  onToggleFavoriteReel: (id: string) => void;
  onReorderReels?: (reels: ReelItem[]) => void;
}

type ReelLayoutMode = 'grid' | 'list';
type ReelSortMode = 'manual' | 'newest' | 'favorites' | 'collection';

const STARTER_SAMPLE_REELS: Omit<ReelItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    url: 'https://www.instagram.com/reel/C-xyz123/',
    shortcode: 'C-xyz123',
    headline: '5-Minute Morning Mobility Routine 🧘',
    author: '@movewithalec',
    takeaway: 'Key exercises:\n1. Cat-cow stretches (10 reps)\n2. Deep squat hold (60s)\n3. Thoracic rotations',
    collection: 'Fitness & Gym 💪',
    tags: ['morning', 'mobility', 'stretch'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    order: 0,
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
    thumbnailUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    order: 1,
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
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    order: 2,
    favorite: true,
  },
];

export const ReelsArea: React.FC<ReelsAreaProps> = ({
  reels,
  onSaveReel,
  onDeleteReel,
  onToggleFavoriteReel,
  onReorderReels,
}) => {
  const [layoutMode, setLayoutMode] = useState<ReelLayoutMode>('grid');
  const [sortMode, setSortMode] = useState<ReelSortMode>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [feedInitialId, setFeedInitialId] = useState<string | undefined>(undefined);
  const [isFeedFullscreen, setIsFeedFullscreen] = useState(false);
  const [modalInitialUrl, setModalInitialUrl] = useState('');
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Available collections from saved reels
  const collections = useMemo(() => {
    const set = new Set<string>();
    reels.forEach((r) => {
      if (r.collection) set.add(r.collection);
    });
    return Array.from(set);
  }, [reels]);

  // Filtered & Sorted Reels
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

    // Sort order
    return result.sort((a, b) => {
      if (sortMode === 'manual') {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortMode === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortMode === 'favorites') {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortMode === 'collection') {
        const colA = a.collection || '';
        const colB = b.collection || '';
        if (colA !== colB) return colA.localeCompare(colB);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return 0;
    });
  }, [reels, selectedCollection, searchQuery, sortMode]);

  const handleOpenAdd = () => {
    playPopSound();
    setEditingReel(null);
    setModalInitialUrl('');
    setIsModalOpen(true);
  };

  const handlePasteClipboardAndAdd = async () => {
    playPopSound();
    setEditingReel(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setModalInitialUrl(text || '');
      } else {
        setModalInitialUrl('');
      }
    } catch {
      setModalInitialUrl('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reel: ReelItem) => {
    playPopSound();
    setEditingReel(reel);
    setModalInitialUrl(reel.url);
    setIsModalOpen(true);
  };

  const handlePlayInSequence = (reel?: ReelItem) => {
    playPopSound();
    setFeedInitialId(reel?.id || (filteredReels[0]?.id ?? undefined));
    setIsFeedFullscreen(true);
  };

  // Drag and drop reordering
  const handleDragStart = (_e: React.DragEvent, id: string) => {
    setDraggedId(id);
  };

  const handleDrop = (_e: React.DragEvent, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    playPopSound();

    const currentList = [...reels];
    const fromIdx = currentList.findIndex((r) => r.id === draggedId);
    const toIdx = currentList.findIndex((r) => r.id === targetId);

    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    const reordered = currentList.map((item, index) => ({
      ...item,
      order: index,
    }));

    setSortMode('manual');
    if (onReorderReels) {
      onReorderReels(reordered);
    }
    setDraggedId(null);
  };

  // Move Up / Move Down arranging
  const handleMoveUp = (id: string) => {
    const idx = reels.findIndex((r) => r.id === id);
    if (idx <= 0) return;

    const currentList = [...reels];
    const temp = currentList[idx - 1];
    currentList[idx - 1] = currentList[idx];
    currentList[idx] = temp;

    const reordered = currentList.map((item, index) => ({
      ...item,
      order: index,
    }));

    setSortMode('manual');
    if (onReorderReels) onReorderReels(reordered);
  };

  const handleMoveDown = (id: string) => {
    const idx = reels.findIndex((r) => r.id === id);
    if (idx === -1 || idx >= reels.length - 1) return;

    const currentList = [...reels];
    const temp = currentList[idx + 1];
    currentList[idx + 1] = currentList[idx];
    currentList[idx] = temp;

    const reordered = currentList.map((item, index) => ({
      ...item,
      order: index,
    }));

    setSortMode('manual');
    if (onReorderReels) onReorderReels(reordered);
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
                Compact view with default cover photo & custom drag arrangement • Watch in vertical sequence
              </p>
            </div>
          </div>

          {/* Action Buttons: View Switcher, Reorder & Save */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* View Mode Switcher: Grid vs List vs Reel Feed */}
            <div className="flex items-center p-1 rounded-2xl bg-sunken border border-subtle">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setLayoutMode('grid');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
                title="Grid View (Small cards like links tab)"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setLayoutMode('list');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  layoutMode === 'list'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
                title="List View (Compact horizontal rows)"
              >
                <List size={13} />
                <span className="hidden sm:inline">List</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  handlePlayInSequence();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-rose-600 hover:bg-surface hover:shadow-2xs"
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

            {/* Quick Paste from Clipboard */}
            <button
              type="button"
              onClick={handlePasteClipboardAndAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sunken hover:bg-surface border border-subtle text-main font-bold text-xs transition active:scale-95 shadow-2xs cursor-pointer"
              title="Paste copied Instagram link from clipboard"
            >
              <Clipboard size={13} className="text-rose-500" />
              <span>Paste Reel</span>
            </button>

            {/* How to Share guide toggle */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setShowMobileGuide((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                showMobileGuide
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600'
                  : 'bg-sunken hover:bg-surface border-subtle text-muted hover:text-main'
              }`}
              title="Show guide on sharing directly from Instagram app"
            >
              <Instagram size={13} />
              <span className="hidden sm:inline">Share Guide</span>
            </button>

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

        {/* Mobile Instagram Sharing Guide Banner */}
        {showMobileGuide && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border border-rose-500/20 text-main space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-main">
                <Instagram size={16} className="text-rose-500" />
                <span>How to send Instagram Reels directly to Orbit on Android</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileGuide(false)}
                className="p-1 text-muted hover:text-main cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted pt-1">
              <div className="p-2.5 rounded-xl bg-surface border border-subtle">
                <span className="font-extrabold text-main block mb-1">1. In Instagram App</span>
                Tap the <strong>Paper Plane / Share</strong> icon on any Reel you want to save.
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-subtle">
                <span className="font-extrabold text-main block mb-1">2. Tap "Share to..."</span>
                In the bottom row of buttons (under your friends), tap <strong>"Share to..."</strong> (or share icon).
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-subtle">
                <span className="font-extrabold text-main block mb-1">3. Select Orbit</span>
                Tap <strong>Orbit</strong> in Android's share list. It opens Orbit and auto-saves to your Vault!
              </div>
            </div>

            <p className="text-[11px] text-muted border-t border-subtle/40 pt-2">
              💡 <strong>Don't see Orbit in the share list?</strong> If Orbit was installed before this feature, uninstall Orbit once from your phone's home screen, open Chrome, and tap <strong>"Install app"</strong> so Android refreshes its share sheet! Alternatively, you can always tap <strong>"Copy link"</strong> in Instagram and tap <strong>"Paste Reel"</strong> above!
            </p>
          </div>
        )}

        {/* Search Bar, Sort Order & Collection Filter Chips */}
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

            {/* Sort Order Selector (Arranging Mode) */}
            <div className="flex items-center gap-1.5 shrink-0 bg-sunken border border-subtle rounded-2xl px-3 py-1.5">
              <ArrowUpDown size={13} className="text-muted" />
              <span className="text-[11px] font-bold text-muted hidden sm:inline">Order:</span>
              <select
                value={sortMode}
                onChange={(e) => {
                  playPopSound();
                  setSortMode(e.target.value as ReelSortMode);
                }}
                className="bg-transparent text-xs font-bold text-main focus:outline-hidden cursor-pointer"
              >
                <option value="manual">Custom Arrangement (Drag / Move)</option>
                <option value="newest">Newest First</option>
                <option value="favorites">Favorites First</option>
                <option value="collection">By Collection</option>
              </select>
            </div>
          </div>

          {/* Collection Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setSelectedCollection('all');
              }}
              className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                selectedCollection === 'all'
                  ? 'bg-main text-page font-extrabold shadow-2xs'
                  : 'bg-sunken text-muted hover:text-main border border-subtle'
              }`}
            >
              All Reels ({reels.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playPopSound();
                setSelectedCollection('favorites');
              }}
              className={`px-3 py-1 rounded-full font-bold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                selectedCollection === 'favorites'
                  ? 'bg-amber-500 text-white font-extrabold shadow-2xs'
                  : 'bg-sunken text-muted hover:text-amber-500 border border-subtle'
              }`}
            >
              <Star size={11} className="fill-current" />
              <span>Favorites ({reels.filter((r) => r.favorite).length})</span>
            </button>

            {collections.map((cat) => {
              const count = reels.filter((r) => r.collection === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setSelectedCollection(cat);
                  }}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    selectedCollection === cat
                      ? 'bg-rose-500 text-white font-extrabold shadow-2xs'
                      : 'bg-sunken text-muted hover:text-main border border-subtle'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="opacity-70 ml-1 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredReels.length === 0 ? (
        <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-subtle shadow-soft text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-600/20 text-rose-500 flex items-center justify-center mx-auto shadow-soft">
            <Film size={28} />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base sm:text-lg text-main">
              {searchQuery || selectedCollection !== 'all'
                ? 'No matching reels found'
                : 'Your Instagram Reels Vault is empty'}
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCollection !== 'all'
                ? 'Try adjusting your search query or collection filter.'
                : 'Save workout routines, recipes, coding tricks, and design inspiration directly from Instagram!'}
            </p>
          </div>

          {reels.length === 0 && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  STARTER_SAMPLE_REELS.forEach((s) => handleAddSample(s));
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-surface border border-subtle hover:bg-sunken text-main font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} className="text-rose-500" />
                <span>Load Starter Inspiration (3 Reels)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Your First Reel</span>
              </button>
            </div>
          )}
        </div>
      ) : layoutMode === 'grid' ? (
        /* Small Compact Grid like Links Tab */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredReels.map((reel, idx) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              onPlayInSequence={handlePlayInSequence}
              onToggleFavorite={onToggleFavoriteReel}
              onEdit={handleOpenEdit}
              onDelete={onDeleteReel}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              canMoveUp={idx > 0}
              canMoveDown={idx < filteredReels.length - 1}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      ) : (
        /* Compact List View like Links Tab */
        <div className="space-y-2.5">
          {filteredReels.map((reel, idx) => (
            <ReelListItem
              key={reel.id}
              reel={reel}
              onPlayInSequence={handlePlayInSequence}
              onToggleFavorite={onToggleFavoriteReel}
              onEdit={handleOpenEdit}
              onDelete={onDeleteReel}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              canMoveUp={idx > 0}
              canMoveDown={idx < filteredReels.length - 1}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
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
        initialUrl={modalInitialUrl}
        onSave={onSaveReel}
      />

    </div>
  );
};
