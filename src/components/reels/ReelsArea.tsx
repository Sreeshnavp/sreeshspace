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
import { playPopSound, triggerPartyPop } from '../../utils/delight';
import './reels.css';

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

  // User-created categories only
  const effectiveCategories = useMemo(() => {
    return categories || [];
  }, [categories]);

  // Today key for "Saved today" metric
  const todayKey = new Date().toLocaleDateString('en-CA');
  const savedTodayCount = useMemo(() => {
    return reels.filter((r) => (r.createdAt || '').slice(0, 10) === todayKey).length;
  }, [reels, todayKey]);

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
      // prefilled category
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

  return (
    <div className="reels-container">
      <div className="wrap space-y-6">
        
        {/* ======================================================== */}
        {/* 1. TOP HEADER CARD (EXACT MATCH TO DESIGN IMAGE)         */}
        {/* ======================================================== */}
        <div className="header-card space-y-5">
          
          {/* Row 1: Logo & Title + 4 Action Pill Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left: Gradient squircle icon + Title + Subtitle */}
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #DE3B78, #8F2296)' }}
              >
                <Film size={22} className="stroke-[2.2]" />
              </div>

              <div>
                <h1 className="font-['Fredoka',sans-serif] font-bold text-2xl text-[#1F2A24] leading-tight">
                  Reels Vault
                </h1>
                <p className="text-xs sm:text-[13px] text-[#6E7A72] mt-0.5">
                  Your saved moments, tidy and cozy
                </p>
              </div>
            </div>

            {/* Right: 4 Pill Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* New Folder Pill */}
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setEditingCategoryTarget(null);
                  setIsNewCategoryModalOpen(true);
                }}
                className="btn-pill"
                title="Create a new folder"
              >
                <FolderPlus size={14} className="text-[#DE3B78]" />
                <span>New Folder</span>
              </button>

              {/* Paste Reel Pill */}
              <button
                type="button"
                onClick={handlePasteClipboardAndAdd}
                className="btn-pill"
                title="Paste copied Instagram link from clipboard"
              >
                <Clipboard size={14} className="text-[#DE3B78]" />
                <span>Paste Reel</span>
              </button>

              {/* Reel Feed Pill */}
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  handlePlayInSequence();
                }}
                className="btn-pill btn-pill-rose"
                title="Watch reels in vertical swiper feed"
              >
                <Smartphone size={14} className="stroke-[2.2]" />
                <span>Reel Feed</span>
              </button>

              {/* + Save Reel Primary Pill */}
              <button
                type="button"
                onClick={() => handleOpenAdd()}
                className="btn-pill btn-pill-primary"
              >
                <Plus size={15} className="stroke-[2.8]" />
                <span>Save Reel</span>
              </button>
            </div>
          </div>

          {/* Row 2: 4 Pastel Stats Cards (Pink, Purple, Yellow, Green) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Reels */}
            <div 
              className="stat-card"
              style={{ background: '#FFE4EC', borderColor: '#F7D1DC' }}
            >
              <b className="block text-2xl sm:text-3xl font-['Fredoka',sans-serif] text-[#1F2A24] leading-none mb-1">
                {reels.length}
              </b>
              <span className="text-xs font-semibold text-[#6E7A72]">Total reels</span>
            </div>

            {/* Folders */}
            <div 
              className="stat-card"
              style={{ background: '#EDE7FD', borderColor: '#DFD5FA' }}
            >
              <b className="block text-2xl sm:text-3xl font-['Fredoka',sans-serif] text-[#1F2A24] leading-none mb-1">
                {effectiveCategories.length}
              </b>
              <span className="text-xs font-semibold text-[#6E7A72]">Folders</span>
            </div>

            {/* Starred */}
            <div 
              className="stat-card"
              style={{ background: '#FFF2CE', borderColor: '#F5E2B0' }}
            >
              <b className="block text-2xl sm:text-3xl font-['Fredoka',sans-serif] text-[#1F2A24] leading-none mb-1">
                {reels.filter((r) => r.favorite).length}
              </b>
              <span className="text-xs font-semibold text-[#6E7A72]">Starred</span>
            </div>

            {/* Saved Today */}
            <div 
              className="stat-card"
              style={{ background: '#E2F0E7', borderColor: '#CFE6D8' }}
            >
              <b className="block text-2xl sm:text-3xl font-['Fredoka',sans-serif] text-[#1F2A24] leading-none mb-1">
                {savedTodayCount}
              </b>
              <span className="text-xs font-semibold text-[#6E7A72]">Saved today</span>
            </div>
          </div>

          {/* Row 3: Segmented Filters + Search Bar + Sort Dropdown + Grid/List Switch */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            
            {/* View Tabs: Folders / All / Starred */}
            <div className="flex items-center p-1 rounded-full bg-[#FFF8ED] border border-[#EFE5CC] shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setViewTab('folders');
                  playPopSound();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'folders'
                    ? 'bg-white text-[#DE3B78] shadow-xs'
                    : 'text-[#6E7A72] hover:text-[#1F2A24]'
                }`}
              >
                Folders
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewTab('all');
                  playPopSound();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'all'
                    ? 'bg-white text-[#DE3B78] shadow-xs'
                    : 'text-[#6E7A72] hover:text-[#1F2A24]'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewTab('starred');
                  playPopSound();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'starred'
                    ? 'bg-white text-[#DE3B78] shadow-xs'
                    : 'text-[#6E7A72] hover:text-[#1F2A24]'
                }`}
              >
                Starred
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA39C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by headline, creator, tags..."
                className="w-full bg-[#FFF5E5] border border-[#EFE5CC] rounded-full pl-9 pr-8 py-2 text-xs font-medium text-[#1F2A24] placeholder:text-[#9AA39C] focus:outline-none focus:ring-2 focus:ring-[#DE3B78]/30 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9AA39C] hover:text-[#1F2A24]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right Controls: Sort Dropdown + Grid/List Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as any)}
                  className="appearance-none bg-[#FFF5E5] border border-[#EFE5CC] rounded-full pl-4 pr-8 py-2 text-xs font-bold text-[#1F2A24] cursor-pointer focus:outline-none"
                >
                  <option value="manual">Custom order ⌄</option>
                  <option value="newest">Newest first</option>
                  <option value="favorites">Favorites top</option>
                  <option value="collection">By Folder</option>
                </select>
                <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7A72] pointer-events-none" />
              </div>

              {/* Grid / List Layout Switcher */}
              <div className="flex items-center p-1 rounded-full bg-[#FFF8ED] border border-[#EFE5CC]">
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    layoutMode === 'grid'
                      ? 'bg-white text-[#DE3B78] shadow-xs'
                      : 'text-[#6E7A72] hover:text-[#1F2A24]'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('list')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    layoutMode === 'list'
                      ? 'bg-white text-[#DE3B78] shadow-xs'
                      : 'text-[#6E7A72] hover:text-[#1F2A24]'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. MAIN CONTENT: FOLDERS VIEW / ALL / STARRED            */}
        {/* ======================================================== */}
        {viewTab === 'folders' && (
          <div className="space-y-6">
            {/* Symmetrical Folders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Folder Cards */}
              {effectiveCategories.map((category, index) => (
                <ReelCategoryBundleSquare
                  key={category.id || category.name}
                  category={category}
                  reels={reels}
                  index={index}
                  activeDraggingReelId={draggedId}
                  onOpenFolder={(cat) => setFolderModalCategory(cat)}
                  onEditCategory={(cat) => {
                    setEditingCategoryTarget(cat);
                    setIsNewCategoryModalOpen(true);
                  }}
                  onDropReel={handleDropReelOnCategory}
                  onReorderCategory={(from, to) => {
                    if (onReorderCategories) onReorderCategories(from, to);
                  }}
                />
              ))}

              {/* Loose / Standalone Reels */}
              {standaloneReels.map((reel) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  onPlayInSequence={handlePlayInSequence}
                  onToggleFavorite={onToggleFavoriteReel}
                  onEdit={handleOpenEdit}
                  onDelete={onDeleteReel}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                />
              ))}

              {/* Inline "+ New folder" Dashed Card matching Image 1 */}
              <div
                onClick={() => {
                  playPopSound();
                  setEditingCategoryTarget(null);
                  setIsNewCategoryModalOpen(true);
                }}
                className="new-folder-dashed group"
                title="Create a new collection folder"
              >
                <div className="w-12 h-12 rounded-full bg-[#F3E2CF] text-[#A06132] flex items-center justify-center text-2xl font-bold mb-3 group-hover:scale-110 transition-transform">
                  +
                </div>
                <span className="font-['Fredoka',sans-serif] font-bold text-base text-[#A06132]">
                  New folder
                </span>
              </div>
            </div>
          </div>
        )}

        {/* All & Starred Views */}
        {(viewTab === 'all' || viewTab === 'starred') && (
          <div>
            {filteredReels.length === 0 ? (
              <div className="bg-white rounded-[28px] border border-[#EFE5CC] p-12 text-center shadow-xs">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="font-['Fredoka',sans-serif] font-bold text-lg text-[#1F2A24] mb-1">
                  {searchQuery ? 'No matching reels found' : viewTab === 'starred' ? 'No starred reels yet' : 'Your vault is empty'}
                </h3>
                <p className="text-xs text-[#6E7A72] max-w-sm mx-auto mb-4">
                  {viewTab === 'starred'
                    ? 'Tap the star on any reel to save it here for quick access!'
                    : 'Save Instagram reels to keep inspirations, workout routines, and recipes organized.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAdd()}
                  className="btn-pill btn-pill-primary"
                >
                  <Plus size={14} />
                  <span>Save First Reel</span>
                </button>
              </div>
            ) : layoutMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredReels.map((reel) => (
                  <ReelCard
                    key={reel.id}
                    reel={reel}
                    onPlayInSequence={handlePlayInSequence}
                    onToggleFavorite={onToggleFavoriteReel}
                    onEdit={handleOpenEdit}
                    onDelete={onDeleteReel}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReels.map((reel) => (
                  <ReelListItem
                    key={reel.id}
                    reel={reel}
                    onPlayInSequence={handlePlayInSequence}
                    onToggleFavorite={onToggleFavoriteReel}
                    onEdit={handleOpenEdit}
                    onDelete={onDeleteReel}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-22 right-4 sm:hidden z-40">
        <button
          type="button"
          onClick={() => handleOpenAdd()}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#DE3B78] to-[#9B2896] text-white shadow-[0_8px_20px_rgba(222,59,120,0.35)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          title="Save new reel"
        >
          <Plus size={24} className="stroke-[2.5]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. MODALS (FOLDER, EDIT CATEGORY, REEL MODAL, PLAYER)   */}
      {/* ======================================================== */}

      {/* Folder Detail View Modal */}
      <ReelFolderModal
        category={folderModalCategory}
        reels={reels}
        isOpen={!!folderModalCategory}
        onClose={() => setFolderModalCategory(null)}
        onPlayInSequence={handlePlayInSequence}
        onToggleFavorite={onToggleFavoriteReel}
        onEdit={handleOpenEdit}
        onDelete={onDeleteReel}
        onAddReelToCategory={(catName) => handleOpenAdd(catName)}
        onEditCategory={(cat) => {
          setEditingCategoryTarget(cat);
          setIsNewCategoryModalOpen(true);
        }}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      {/* Category Creation / Edit Modal */}
      <EditReelCategoryModal
        isOpen={isNewCategoryModalOpen}
        category={editingCategoryTarget}
        onClose={() => {
          setIsNewCategoryModalOpen(false);
          setEditingCategoryTarget(null);
        }}
        onSave={(cat: CategoryInfo) => {
          if (onSaveCategory) onSaveCategory(cat);
          setIsNewCategoryModalOpen(false);
          setEditingCategoryTarget(null);
        }}
        onDelete={(catId: string) => {
          if (onDeleteCategory) onDeleteCategory(catId);
          setIsNewCategoryModalOpen(false);
          setEditingCategoryTarget(null);
          setFolderModalCategory(null);
        }}
      />

      {/* Save / Edit Reel Modal */}
      <ReelModal
        isOpen={isModalOpen}
        reel={editingReel}
        categories={effectiveCategories}
        initialUrl={modalInitialUrl}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReel(null);
          setModalInitialUrl('');
        }}
        onSave={(savedReel: ReelItem) => {
          onSaveReel(savedReel);
          setIsModalOpen(false);
          setEditingReel(null);
          setModalInitialUrl('');
        }}
      />

      {/* Fullscreen Sequence Feed Player */}
      {isFeedFullscreen && (
        <ReelSequencePlayer
          reels={filteredReels.length > 0 ? filteredReels : reels}
          initialReelId={feedInitialId}
          onClose={() => setIsFeedFullscreen(false)}
          onToggleFavorite={onToggleFavoriteReel}
          onEdit={handleOpenEdit}
          onDelete={onDeleteReel}
        />
      )}
    </div>
  );
};
