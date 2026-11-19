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
  FolderPlus,
  Folder
} from 'lucide-react';
import { InstagramIcon as Instagram } from './InstagramIcon';
import type { ReelItem, CategoryInfo } from '../../types';
import { ReelCard } from './ReelCard';
import { ReelListItem } from './ReelListItem';
import { ReelCategoryBundleSquare } from './ReelCategoryBundleSquare';
import { ReelFolderModal } from './ReelFolderModal';
import { EditReelCategoryModal } from './EditReelCategoryModal';
import { ReelSequencePlayer } from './ReelSequencePlayer';
import { ReelModal } from './ReelModal';
import { DEFAULT_REEL_CATEGORIES } from '../../services/storage';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface ReelsAreaProps {
  reels: ReelItem[];
  categories?: CategoryInfo[];
  onSaveReel: (reel: ReelItem) => void;
  onDeleteReel: (id: string) => void;
  onToggleFavoriteReel: (id: string) => void;
  onReorderReels?: (reels: ReelItem[]) => void;
  onSaveCategory?: (category: CategoryInfo) => void;
  onDeleteCategory?: (id: string) => void;
  onReorderCategories?: (fromIndex: number, toIndex: number) => void;
  onMoveReelCategory?: (reelId: string, newCategoryName: string) => void;
}

type ReelViewTab = 'folders' | 'all' | 'starred';
type ReelLayoutMode = 'grid' | 'list';
type ReelSortMode = 'manual' | 'newest' | 'favorites' | 'collection';

const STARTER_SAMPLE_REELS: Omit<ReelItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    url: 'https://www.instagram.com/reel/C-xyz123/',
    shortcode: 'C-xyz123',
    headline: '5-Minute Morning Mobility Routine 🧘',
    author: '@movewithalec',
    takeaway: 'Key exercises:\n1. Cat-cow stretches (10 reps)\n2. Deep squat hold (60s)\n3. Thoracic rotations',
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
    tags: ['css', 'webdev', 'frontend'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    order: 2,
    favorite: true,
  },
];

export const ReelsArea: React.FC<ReelsAreaProps> = ({
  reels,
  categories = [],
  onSaveReel,
  onDeleteReel,
  onToggleFavoriteReel,
  onReorderReels,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategories,
  onMoveReelCategory,
}) => {
  const [viewTab, setViewTab] = useState<ReelViewTab>('folders');
  const [layoutMode, setLayoutMode] = useState<ReelLayoutMode>('grid');
  const [sortMode, setSortMode] = useState<ReelSortMode>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [modalInitialUrl, setModalInitialUrl] = useState('');
  const [folderModalCategory, setFolderModalCategory] = useState<CategoryInfo | null>(null);
  const [editingCategoryTarget, setEditingCategoryTarget] = useState<CategoryInfo | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  
  // Player state
  const [feedInitialId, setFeedInitialId] = useState<string | undefined>(undefined);
  const [isFeedFullscreen, setIsFeedFullscreen] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // User-created categories only (0 defaults)
  const effectiveCategories = useMemo(() => {
    return categories || [];
  }, [categories]);

  // Standalone / Loose Reels on canvas in Folders view
  const standaloneReels = useMemo(() => {
    const catNamesLower = new Set(effectiveCategories.map((c) => c.name.toLowerCase().trim()));
    return reels.filter((r) => {
      const col = (r.collection || '').toLowerCase().trim();
      return !col || col === 'general' || col === 'uncategorized' || !catNamesLower.has(col);
    });
  }, [reels, effectiveCategories]);

  // Filtered Reels for All / Starred views
  const filteredReels = useMemo(() => {
    let result = [...reels];

    if (viewTab === 'starred') {
      result = result.filter((r) => r.favorite);
    } else if (selectedFilterCategory !== 'all') {
      result = result.filter(
        (r) => (r.collection || '').toLowerCase().trim() === selectedFilterCategory.toLowerCase().trim()
      );
    }

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
  }, [reels, viewTab, selectedFilterCategory, searchQuery, sortMode]);

  // Modal handlers
  const handleOpenAdd = (categoryName?: string) => {
    playPopSound();
    setEditingReel(null);
    setModalInitialUrl('');
    setIsModalOpen(true);
    if (categoryName) {
      // prefilled category will be saved with reel
    }
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

  // Drag and drop reel reordering / categorization
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
    if (onReorderReels) onReorderReels(reordered);
    setDraggedId(null);
  };

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

  const handleDropReelOnCategory = (reelId: string, categoryName: string) => {
    if (onMoveReelCategory) {
      onMoveReelCategory(reelId, categoryName);
    } else {
      const updated = reels.map((r) =>
        r.id === reelId ? { ...r, collection: categoryName } : r
      );
      const target = updated.find((r) => r.id === reelId);
      if (target) onSaveReel(target);
    }
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
      
      {/* Top Banner Card: Links-Style Header with Folders / All / Starred Tabs */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-subtle shadow-soft space-y-4">
        
        {/* Row 1: Title, View Switcher & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
          
          {/* Left: Icon, Title & View Tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-soft shrink-0">
              <Film size={20} className="stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-main leading-tight">
                  Reels Vault
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-extrabold font-mono border border-rose-500/20">
                  {reels.length} {reels.length === 1 ? 'Reel' : 'Reels'}
                </span>
              </div>
            </div>

            {/* Segmented Control like Links Menu: [Folders] [All] [⭐ Starred] */}
            <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-subtle ml-1 sm:ml-2">
              <button
                type="button"
                onClick={() => {
                  setViewTab('folders');
                  playPopSound();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'folders'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
                title="Categorized Collection Bundles (Drag & drop reels into folders)"
              >
                <Folder size={13} className="text-rose-500" />
                <span>Folders</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewTab('all');
                  playPopSound();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'all'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
                title="All Reels as individual cards"
              >
                <span>All</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    viewTab === 'all' ? 'bg-rose-500 text-white' : 'bg-surface text-muted'
                  }`}
                >
                  {reels.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewTab('starred');
                  playPopSound();
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'starred'
                    ? 'bg-surface text-amber-500 shadow-2xs font-extrabold'
                    : 'text-muted hover:text-amber-500'
                }`}
                title="Favorite Reels"
              >
                <Star
                  size={13}
                  className={
                    viewTab === 'starred' ? 'fill-amber-400 text-amber-500' : 'text-faint hover:text-amber-500'
                  }
                />
                <span className="hidden sm:inline">Starred</span>
                {reels.filter((r) => r.favorite).length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {reels.filter((r) => r.favorite).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* New Folder Button (like Links tab) */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setEditingCategoryTarget(null);
                setIsNewCategoryModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-main shadow-2xs transition active:scale-95 cursor-pointer"
              title="Create a new collection folder"
            >
              <FolderPlus size={13} className="text-rose-500 stroke-[2.2]" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            {/* Quick Paste from Clipboard */}
            <button
              type="button"
              onClick={handlePasteClipboardAndAdd}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-main shadow-2xs transition active:scale-95 cursor-pointer"
              title="Paste copied Instagram link from clipboard"
            >
              <Clipboard size={13} className="text-rose-500" />
              <span>Paste Reel</span>
            </button>

            {/* Reel Feed Fullscreen Sequence */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                handlePlayInSequence();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-rose-600 transition active:scale-95 cursor-pointer shadow-2xs"
              title="Watch reels in vertical swiper feed"
            >
              <Smartphone size={13} className="stroke-[2.5]" />
              <span>Reel Feed</span>
            </button>

            {/* How to Share guide toggle */}
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setShowMobileGuide((prev) => !prev);
              }}
              className={`flex items-center gap-1 p-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                showMobileGuide
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600'
                  : 'bg-sunken hover:bg-surface border-subtle text-muted hover:text-main'
              }`}
              title="How to share directly from Instagram mobile app"
            >
              <Instagram size={14} />
            </button>

            {/* + Save Reel Button */}
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft hover:opacity-95 transition active:scale-95 cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
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

        {/* Row 2: Search Bar, Layout Mode & Sort Order */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-sunken border border-subtle rounded-2xl px-3 py-1.5">
              <ArrowUpDown size={13} className="text-muted" />
              <select
                value={sortMode}
                onChange={(e) => {
                  playPopSound();
                  setSortMode(e.target.value as ReelSortMode);
                }}
                className="bg-transparent text-xs font-bold text-main focus:outline-hidden cursor-pointer"
              >
                <option value="manual">Custom Order (Drag to Arrange)</option>
                <option value="newest">Newest First</option>
                <option value="favorites">Favorites First</option>
                <option value="collection">By Collection</option>
              </select>
            </div>

            {/* Layout Mode (Grid vs List) */}
            <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-subtle">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setLayoutMode('grid');
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-surface text-main shadow-2xs'
                    : 'text-muted hover:text-main'
                }`}
                title="Grid View (Compact cards with cover photos)"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setLayoutMode('list');
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  layoutMode === 'list'
                    ? 'bg-surface text-main shadow-2xs'
                    : 'text-muted hover:text-main'
                }`}
                title="List View (Compact horizontal rows)"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Drop Target Chips in 'all' view */}
        {viewTab === 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-subtle/50 pt-3">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider shrink-0 mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setSelectedFilterCategory('all');
              }}
              className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                selectedFilterCategory === 'all'
                  ? 'bg-main text-page font-extrabold shadow-2xs'
                  : 'bg-sunken text-muted hover:text-main border border-subtle'
              }`}
            >
              All ({reels.length})
            </button>

            {effectiveCategories.map((cat) => {
              const count = reels.filter(
                (r) => (r.collection || '').toLowerCase().trim() === cat.name.toLowerCase().trim()
              ).length;
              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const reelId =
                      e.dataTransfer.getData('text/plain') ||
                      e.dataTransfer.getData('application/reel-id') ||
                      draggedId;
                    if (reelId) handleDropReelOnCategory(reelId, cat.name);
                  }}
                  onClick={() => {
                    playPopSound();
                    setSelectedFilterCategory(cat.name);
                  }}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedFilterCategory === cat.name
                      ? 'bg-rose-500 text-white font-extrabold shadow-2xs'
                      : 'bg-sunken text-muted hover:text-main border border-subtle'
                  }`}
                  title={`Drop reel here to file into ${cat.name}`}
                >
                  <span>{cat.icon || '📁'}</span>
                  <span>{cat.name}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area based on View Tab */}
      {viewTab === 'folders' ? (
        /* 1. CATEGORIZED FOLDERS VIEW (Like Links Menu: Bundles + Canvas Reels) */
        <div className="space-y-4 sm:space-y-6">
          {effectiveCategories.length === 0 && reels.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-sunken border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted">
                <FolderPlus size={15} className="text-rose-500 shrink-0" />
                <span>No custom folders created yet. All reels appear directly below. Tap <strong>+ New Folder</strong> to bundle reels!</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setEditingCategoryTarget(null);
                  setIsNewCategoryModalOpen(true);
                }}
                className="self-start sm:self-auto px-3 py-1 rounded-xl bg-surface border border-subtle text-main font-bold text-xs hover:bg-sunken shadow-2xs transition active:scale-95 cursor-pointer"
              >
                + New Folder
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4.5">
            {/* Category Bundle Squares with Symmetrical 2x2 Cover Photos */}
            {effectiveCategories.map((category, index) => (
              <ReelCategoryBundleSquare
                key={category.id || category.name}
                category={category}
                reels={reels}
                index={index}
                activeDraggingReelId={draggedId}
                onOpenFolder={(cat) => setFolderModalCategory(cat)}
                onEditCategory={(cat) => setEditingCategoryTarget(cat)}
                onDropReel={handleDropReelOnCategory}
                onReorderCategory={(from, to) => {
                  if (onReorderCategories) onReorderCategories(from, to);
                }}
              />
            ))}

            {/* Standalone / Unfiled Reels on canvas */}
            {standaloneReels.map((reel, idx) => (
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
                canMoveDown={idx < standaloneReels.length - 1}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {reels.length === 0 && (
            <div className="bg-surface rounded-3xl p-8 text-center space-y-3 border border-subtle max-w-md mx-auto shadow-soft">
              <Film size={28} className="mx-auto text-rose-500 opacity-60" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-main">Your Reels Vault is empty</h4>
                <p className="text-xs text-muted">
                  Load starter inspiration reels to see categories, cover photos, and sequence playback in action!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  STARTER_SAMPLE_REELS.forEach((s) => handleAddSample(s));
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-soft transition active:scale-95 cursor-pointer"
              >
                Load Starter Inspiration (3 Reels)
              </button>
            </div>
          )}
        </div>
      ) : filteredReels.length === 0 ? (
        /* Empty Filter State */
        <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-subtle shadow-soft text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-soft">
            <Film size={28} />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-main">
              {viewTab === 'starred'
                ? 'No Favorite Reels Yet'
                : 'No matching reels found'}
            </h3>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {viewTab === 'starred'
                ? 'Tap the star ⭐ on any reel card to pin your favorites here for quick access!'
                : 'Try adjusting your search query or collection filter.'}
            </p>
          </div>
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

      {/* Reel Folder Modal: Displays all reels in selected category */}
      <ReelFolderModal
        category={folderModalCategory}
        reels={reels}
        isOpen={Boolean(folderModalCategory)}
        onClose={() => setFolderModalCategory(null)}
        onPlayInSequence={handlePlayInSequence}
        onToggleFavorite={onToggleFavoriteReel}
        onEdit={handleOpenEdit}
        onDelete={onDeleteReel}
        onAddReelToCategory={(catName) => {
          setFolderModalCategory(null);
          handleOpenAdd(catName);
        }}
        onEditCategory={(cat) => {
          setEditingCategoryTarget(cat);
          setFolderModalCategory(null);
        }}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />

      {/* Edit / New Reel Collection Modal */}
      <EditReelCategoryModal
        isOpen={Boolean(editingCategoryTarget) || isNewCategoryModalOpen}
        category={editingCategoryTarget}
        onClose={() => {
          setEditingCategoryTarget(null);
          setIsNewCategoryModalOpen(false);
        }}
        onSave={(cat) => {
          if (onSaveCategory) onSaveCategory(cat);
        }}
        onDelete={(id) => {
          if (onDeleteCategory) onDeleteCategory(id);
        }}
      />

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
        categories={effectiveCategories}
        onSave={onSaveReel}
      />

    </div>
  );
};
