import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
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
  Folder,
  MoreHorizontal,
  FolderInput,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';
import type { ReelItem, CategoryInfo, WorkspaceView } from '../../types';
import { ReelFolderModal } from './ReelFolderModal';
import { EditReelCategoryModal } from './EditReelCategoryModal';
import { ReelSequencePlayer } from './ReelSequencePlayer';
import { ReelModal } from './ReelModal';
import { playPopSound, triggerPartyPop } from '../../utils/delight';
import avatarImg from '../../assets/avatar.jpg';
import './reels.css';

export interface ReelsAreaProps {
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
  onNavigate?: (view: WorkspaceView) => void;
  onLock?: () => void;
}

type ReelLayoutMode = 'grid' | 'list';
type ReelFilterMode = 'all' | 'starred';

const DEFAULT_DEMO_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cat-highlights',
    name: 'Highlights',
    color: 'lavender',
    icon: 'folder',
    description: 'Special saved reels',
    order: 0,
  },
  {
    id: 'cat-coding-tech',
    name: 'Coding & Tech',
    color: 'rose',
    icon: 'code',
    description: 'Dev and tech tutorials',
    order: 1,
  },
];

const DEFAULT_DEMO_REELS: ReelItem[] = [
  {
    id: 'reel-demo-1',
    url: 'https://www.instagram.com/reel/DfY6UsmnHz7/',
    shortcode: 'DfY6UsmnHz7',
    headline: '10 Prompts I Reuse on Every Project',
    author: '@designcoder',
    tags: ['AI', 'Design'],
    collection: '',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIcR7ucluFBsqO4H84JTSBROAeqVyENGtPd59DfcjSAV5Iggnr1wbV7wsH80DGK2Et6LMVMOfn1sukH7-9Rrsmq4xWWIDkP1rtjZpg2wHUsM31DAQszgCP4eANsF7lNiE3Xf_gHO2MHFtOxKRksNlAJ4DUUR1y95N7fCainHJZ9sLlC2IJ9IhJHrPteyvn41uArATt7k10FXulzIYPNGLZ9JBRqVDwaVDjF0v1xl0I',
    createdAt: new Date().toISOString(),
    favorite: false,
  },
  {
    id: 'reel-demo-2',
    url: 'https://www.instagram.com/reel/Df4KRuLxMF7/',
    shortcode: 'Df4KRuLxMF7',
    headline: 'Matcha Latte Art Tutorial 🍵',
    author: '@cozycoffee',
    tags: ['Cafe', 'Morning'],
    collection: '',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4SLtNaD7tZsBD_w67n5zLCRIFUTDUkj_-_y7D4am01QWBkw4bPdS4zVC3AxTFU2FlKO64UBZ3Zu2fJVYTsIQF4EbNSKwTK_jjM1BroZOVNHQOsDoK3UkitnKWSV580rqByNYaHxDvcRVSNEu9_LSTRVoD_qyziJEd5MLVjrACMZvSj5zIk3wGkjWXd6WSUqKQYQx5nktn_Ehc4mKAPGkj2lhHxWtZ7vNShBpcEVUY',
    createdAt: new Date().toISOString(),
    favorite: false,
  },
  {
    id: 'reel-demo-3',
    url: 'https://www.instagram.com/reel/DfY6UsnnHz7/',
    shortcode: 'DfY6UsnnHz7',
    headline: 'Vibe Coding with Claude & Tailwind',
    author: '@vibecoder',
    tags: ['Claude3', 'Frontend'],
    collection: '',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUI83FDpmzpG-nr84b0NS-mXTVB75I05nFOtZRErgwLeGTcCFhPHM9lZCH_q2-wB3v_Tbi9fEMT0QjqNspTSMGdPg3URj-bWIWrZdMznW4guw8Idi8EtEeiCFOZkmcLxf9dZWJzZep0IRQOGqy-nNpXkLyXG4RuB73q1GGeY9ZW9vgPoqVsztBQr2BRx5kMXcMnVs6t7vH_j_wAJTbuLX9Hzb8h212F094ieNWeclS',
    createdAt: new Date().toISOString(),
    favorite: false,
  },
  {
    id: 'reel-demo-highlight',
    url: 'https://www.instagram.com/reel/Df6PC2vlBHS/',
    shortcode: 'Df6PC2vlBHS',
    headline: 'Tech reel thumbnail',
    author: '@techcreator',
    tags: ['Tech'],
    collection: 'Highlights',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_89TauBQKx1uxZKK89ymAcDoG8-TqD5EDnGT25Lx1Qc3Q-0Uwd_bNTOrtNULDODCcWk6E-8vFWUWn2euDpoupYDnG5NEJscJe0xL0JQOjLdsDnPWk-gcCaW9L3wYy-FLX0NJx1D0fLVyh16VG39SZESTExoOBzmV8tUyGj_H-Ltf3SdPezO1sOQ8klOOJ4c6M3B_MbDu4-YDvYPmg2vb1sJ1ZSLArMLvK8Fz1SsCs',
    createdAt: new Date().toISOString(),
    favorite: false,
  },
  {
    id: 'reel-demo-coding',
    url: 'https://www.instagram.com/reel/Df6PC2v1BHS/',
    shortcode: 'Df6PC2v1BHS',
    headline: 'Elephant Encounter on Scooter (Reporter Live)',
    author: '@reporterlivemalayalam',
    tags: ['ReporterLive'],
    collection: 'Coding & Tech',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoUlII3oUcI_PAaJMaGEUU3LlCC225D4S_IMfZHyvpL8a39Oi2NR_h1BhMVGUPe8Vr-Gh2wAaMbhVQrbm4fjMfLVpowNNd71JXaEaVfxlvFowA14Up4v9M3K9XgNaFyj-DCNtE748ZLJxT-uUNHX_7Mm8iTXww4VkSPOcpftr7Wb1n59LkOLmwDms9sXJ1OzmqI-nT0sCzyUFE31JD5dC0oXCmp6E1nvuuX_ppjGr9',
    createdAt: new Date().toISOString(),
    favorite: true,
  },
];

export const ReelsArea: React.FC<ReelsAreaProps> = ({
  reels = [],
  categories = [],
  onSaveReel,
  onDeleteReel,
  onToggleFavoriteReel,
  onReorderReels,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategories,
  onMoveReelCategory,
  onNavigate,
  onLock,
}) => {
  // Merged effective categories & reels
  const effectiveCategories = useMemo(() => {
    const list = [...(categories || [])];
    DEFAULT_DEMO_CATEGORIES.forEach((demoCat) => {
      if (!list.some((c) => c.name.toLowerCase().trim() === demoCat.name.toLowerCase().trim())) {
        list.push(demoCat);
      }
    });
    return list;
  }, [categories]);

  const effectiveReels = useMemo(() => {
    const list = [...(reels || [])];
    // Map any reel that mentions elephant to Coding & Tech
    const mapped = list.map((r) => {
      const h = (r.headline || '').toLowerCase();
      if (h.includes('elephant') && (!r.collection || r.collection.trim() === '')) {
        return { ...r, collection: 'Coding & Tech' };
      }
      return r;
    });

    const result = [...mapped];
    DEFAULT_DEMO_REELS.forEach((demo) => {
      const demoHeadline = (demo.headline || '').toLowerCase().trim();
      const exists = result.some(
        (r) =>
          (r.shortcode && r.shortcode === demo.shortcode) ||
          (r.headline && r.headline.toLowerCase().trim() === demoHeadline)
      );
      if (!exists) {
        result.push(demo);
      }
    });
    return result;
  }, [reels]);

  // View toggles
  const [layoutMode, setLayoutMode] = useState<ReelLayoutMode>('grid');
  const [filterMode, setFilterMode] = useState<ReelFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [modalInitialUrl, setModalInitialUrl] = useState('');
  const [prefilledCategory, setPrefilledCategory] = useState<string | undefined>(undefined);
  const [folderModalCategory, setFolderModalCategory] = useState<CategoryInfo | null>(null);
  const [editingCategoryTarget, setEditingCategoryTarget] = useState<CategoryInfo | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFeedFullscreen, setIsFeedFullscreen] = useState(false);
  const [feedInitialId, setFeedInitialId] = useState<string | undefined>(undefined);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Move to Folder modal state
  const [reelToMove, setReelToMove] = useState<ReelItem | null>(null);
  const [activeMenuReelId, setActiveMenuReelId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Drag and drop state
  const [draggedReelId, setDraggedReelId] = useState<string | null>(null);

  // Sound and confetti celebration
  const triggerCelebration = () => {
    try {
      playPopSound();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#DE3B78', '#6B38D4', '#F59E0B', '#006C49']
      });
    } catch {}
  };

  // Group reels by folder
  const reelsByFolder = useMemo(() => {
    const map: Record<string, ReelItem[]> = {};
    effectiveCategories.forEach((cat) => {
      map[cat.name.toLowerCase().trim()] = [];
    });

    effectiveReels.forEach((reel) => {
      const col = (reel.collection || '').toLowerCase().trim();
      if (col && map[col]) {
        map[col].push(reel);
      }
    });

    return map;
  }, [effectiveCategories, effectiveReels]);

  // Independent (unfiled) reels
  const independentReels = useMemo(() => {
    const catNamesLower = new Set(effectiveCategories.map((c) => c.name.toLowerCase().trim()));
    let list = effectiveReels.filter((r) => {
      const col = (r.collection || '').toLowerCase().trim();
      return !col || col === 'general' || col === 'uncategorized' || !catNamesLower.has(col);
    });

    if (filterMode === 'starred') {
      list = list.filter((r) => r.favorite);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.headline && r.headline.toLowerCase().includes(q)) ||
          (r.caption && r.caption.toLowerCase().includes(q)) ||
          (r.author && r.author.toLowerCase().includes(q)) ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [effectiveReels, effectiveCategories, filterMode, searchQuery]);

  // Action: Open Add Reel Modal
  const handleOpenAdd = (categoryName?: string) => {
    playPopSound();
    setEditingReel(null);
    setModalInitialUrl('');
    setPrefilledCategory(categoryName);
    setIsModalOpen(true);
  };

  // Action: Paste Reel from Clipboard
  const handlePasteClipboardAndAdd = async () => {
    playPopSound();
    setEditingReel(null);
    setPrefilledCategory(undefined);
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

  // Action: Watch Fullscreen Reels Feed
  const handleOpenReelFeed = (reelId?: string) => {
    playPopSound();
    setFeedInitialId(reelId || effectiveReels[0]?.id);
    setIsFeedFullscreen(true);
  };

  // Action: Edit Reel
  const handleOpenEdit = (reel: ReelItem) => {
    playPopSound();
    setEditingReel(reel);
    setModalInitialUrl(reel.url);
    setIsModalOpen(true);
    setActiveMenuReelId(null);
  };

  // Action: Copy Reel Link
  const handleCopyLink = async (url: string) => {
    playPopSound();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedNotification('Link copied to clipboard! ✨');
      setTimeout(() => setCopiedNotification(null), 2000);
    } catch {}
    setActiveMenuReelId(null);
  };

  // Action: Move Reel to target Category
  const handleConfirmMove = (categoryName: string) => {
    if (!reelToMove) return;
    if (onMoveReelCategory) {
      onMoveReelCategory(reelToMove.id, categoryName);
    } else {
      onSaveReel({ ...reelToMove, collection: categoryName });
    }
    triggerCelebration();
    setReelToMove(null);
  };

  // Drag and drop handlers
  const handleDragStart = (_e: React.DragEvent, id: string) => {
    setDraggedReelId(id);
  };

  const handleDragEnd = () => {
    setDraggedReelId(null);
  };

  const handleDropOnFolder = (targetCategoryName: string) => {
    if (!draggedReelId) return;
    playPopSound();
    if (onMoveReelCategory) {
      onMoveReelCategory(draggedReelId, targetCategoryName);
    } else {
      const found = effectiveReels.find((r) => r.id === draggedReelId);
      if (found) {
        onSaveReel({ ...found, collection: targetCategoryName });
      }
    }
    setDraggedReelId(null);
    triggerCelebration();
  };

  return (
    <div className="text-vault-dark min-h-screen flex flex-col font-sans pb-32 antialiased selection:bg-pink-200 bg-[#F4F3F8]">
      
      {/* ======================================================== */}
      {/* 1. TOP APP HEADER (STITCH 1:1)                           */}
      {/* ======================================================== */}
      <header className="pt-5 px-4 pb-3 max-w-md mx-auto w-full" data-purpose="profile-and-status-bar">
        {/* Top Bar with User Avatar, Mood Pill & Actions */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            {/* Avatar with Emerald Online Dot */}
            <div className="relative">
              <img 
                src={avatarImg} 
                alt="Sreeshnav" 
                className="rounded-full w-10 h-10 object-cover border-2 border-white shadow-sm ring-2 ring-primary/20"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm tracking-tight text-vault-dark font-sans">
                  Sreeshnav's Space
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/80 text-amber-800 border border-amber-200/50">
                  ✨ Creative
                </span>
              </div>
              <p className="text-[11px] text-vault-subtle font-medium">Personal cozy corner</p>
            </div>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            <button 
              aria-label="Privacy lock" 
              onClick={() => {
                playPopSound();
                if (onLock) onLock();
              }}
              className="w-8 h-8 rounded-full bg-white/80 shadow-sm border border-stone-200/50 flex items-center justify-center text-vault-subtle hover:text-vault-dark cursor-pointer active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
            <button 
              aria-label="Notifications" 
              onClick={() => {
                playPopSound();
                setIsNotificationOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-white/80 shadow-sm border border-stone-200/50 flex items-center justify-center text-vault-subtle hover:text-vault-dark relative cursor-pointer active:scale-95 transition-all"
            >
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Screen Title Banner with Film Badge & Subtitle */}
        <div className="bg-white rounded-3xl p-4 shadow-soft border border-stone-100 flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            {/* Film Roll Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">movie</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-vault-dark leading-snug font-sans">
                Reels Vault
              </h2>
              <p className="text-xs text-vault-subtle">Your saved moments, tidy and cozy</p>
            </div>
          </div>

          {/* Quick Action Pill Buttons (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5">
            <button 
              onClick={() => {
                playPopSound();
                setEditingCategoryTarget(null);
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF2F0] hover:bg-red-50 text-[#D84949] border border-red-100 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
              <span>New Folder</span>
            </button>

            <button 
              onClick={handlePasteClipboardAndAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender-subtle hover:bg-purple-100 text-primary border border-purple-200/60 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_paste</span>
              <span>Paste Reel</span>
            </button>

            <button 
              onClick={() => handleOpenReelFeed()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-peach-subtle hover:bg-pink-100 text-tertiary border border-pink-200/60 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">video_library</span>
              <span>Reel Feed</span>
            </button>

            <button 
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-xs font-semibold whitespace-nowrap shadow-sm shadow-purple-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Save Reel</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 space-y-4">
        
        {/* BEGIN: FilterAndSearch */}
        <section className="space-y-2.5" data-purpose="filtering-and-search-controls">
          {/* Top filter pill navigation */}
          <div className="flex items-center justify-between gap-1.5">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-white rounded-full border border-stone-200/60 shadow-sm text-xs font-semibold">
              <button 
                onClick={() => { playPopSound(); setLayoutMode('grid'); }}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  layoutMode === 'grid' ? 'text-primary bg-lavender-subtle' : 'text-vault-subtle hover:text-vault-dark'
                }`}
              >
                Grid
              </button>
              <button 
                onClick={() => { playPopSound(); setLayoutMode('list'); }}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  layoutMode === 'list' ? 'text-primary bg-lavender-subtle' : 'text-vault-subtle hover:text-vault-dark'
                }`}
              >
                List
              </button>
            </div>

            {/* All / Starred Toggles */}
            <div className="inline-flex p-1 bg-white rounded-full border border-stone-200/60 shadow-sm text-xs font-semibold">
              <button 
                onClick={() => { playPopSound(); setFilterMode('all'); }}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  filterMode === 'all' ? 'text-primary bg-lavender-subtle' : 'text-vault-subtle hover:text-vault-dark'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => { playPopSound(); setFilterMode('starred'); }}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  filterMode === 'starred' ? 'text-primary bg-lavender-subtle' : 'text-vault-subtle hover:text-vault-dark'
                }`}
              >
                Starred
              </button>
            </div>
          </div>

          {/* Search Input Bar with Cozy Cream Tone */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-vault-cream/80 border border-stone-200/80 rounded-full placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all shadow-inner" 
              placeholder="Search by headline, creator, tags..." 
              type="text"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>
        {/* END: FilterAndSearch */}

        {/* ======================================================== */}
        {/* 3. CATEGORIZED FOLDERS ROW (CAROUSEL)                    */}
        {/* ======================================================== */}
        <section className="space-y-2.5" data-purpose="reels-folder-carousel">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-vault-subtle flex items-center gap-1.5">
              <span>📁 Categorized Folders</span>
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-full font-bold">
                {effectiveCategories.length}
              </span>
            </h3>
            <span className="text-[11px] text-primary font-semibold">Swipe to browse →</span>
          </div>

          {/* Horizontal Carousel of Folders matching screenshot */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 pt-0.5 -mx-4 px-4 snap-x snap-mandatory">
            
            {/* Folder 1: Highlights (2x2 preview slot card) */}
            {effectiveCategories.length > 0 && (() => {
              const cat1 = effectiveCategories[0];
              const catReels = reelsByFolder[cat1.name.toLowerCase().trim()] || [];
              const firstReel = catReels[0] || DEFAULT_DEMO_REELS[3];

              return (
                <article 
                  key={cat1.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnFolder(cat1.name)}
                  className="min-w-[270px] w-[270px] bg-white rounded-3xl p-4 shadow-soft border border-stone-100 flex flex-col justify-between snap-start"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-vault-dark leading-tight">{cat1.name}</h4>
                          <p className="text-[11px] text-vault-subtle">{catReels.length || 1} reel{catReels.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <button 
                        aria-label="Edit folder" 
                        onClick={() => {
                          playPopSound();
                          setEditingCategoryTarget(cat1);
                          setIsCategoryModalOpen(true);
                        }}
                        className="w-7 h-7 rounded-full bg-stone-50 border border-stone-200/50 flex items-center justify-center text-vault-subtle hover:text-vault-dark cursor-pointer active:scale-95 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </button>
                    </div>

                    {/* 2x2 Slots Grid */}
                    <div className="grid grid-cols-2 gap-2 my-1">
                      {/* Slot 1: Active Reel Thumbnail */}
                      <div 
                        onClick={() => handleOpenReelFeed(firstReel.id)}
                        className="relative aspect-video rounded-xl overflow-hidden bg-stone-800 border border-stone-100 group cursor-pointer"
                      >
                        <img 
                          alt={firstReel.headline || "Tech reel thumbnail"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          src={firstReel.thumbnailUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD_89TauBQKx1uxZKK89ymAcDoG8-TqD5EDnGT25Lx1Qc3Q-0Uwd_bNTOrtNULDODCcWk6E-8vFWUWn2euDpoupYDnG5NEJscJe0xL0JQOjLdsDnPWk-gcCaW9L3wYy-FLX0NJx1D0fLVyh16VG39SZESTExoOBzmV8tUyGj_H-Ltf3SdPezO1sOQ8klOOJ4c6M3B_MbDu4-YDvYPmg2vb1sJ1ZSLArMLvK8Fz1SsCs"} 
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                          0:45
                        </span>
                      </div>

                      {/* Slot 2: Add Reel */}
                      <div 
                        onClick={() => handleOpenAdd(cat1.name)}
                        className="aspect-video rounded-xl bg-gradient-to-br from-lavender-subtle/80 to-purple-50/50 border border-purple-200/60 flex flex-col items-center justify-center text-primary group cursor-pointer hover:bg-lavender-subtle transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:scale-110 transition-transform">add_circle</span>
                        <span className="text-[9px] font-semibold tracking-tight text-primary/80 mt-0.5">Add Reel</span>
                      </div>

                      {/* Slot 3: Drafts */}
                      <div 
                        onClick={() => handleOpenAdd(cat1.name)}
                        className="aspect-video rounded-xl bg-gradient-to-br from-peach-subtle/70 to-pink-50/40 border border-pink-200/60 flex flex-col items-center justify-center text-tertiary/70 group cursor-pointer hover:bg-peach-subtle transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:scale-110 transition-transform">movie_edit</span>
                        <span className="text-[9px] font-medium tracking-tight text-vault-sub mt-0.5">Drafts</span>
                      </div>

                      {/* Slot 4: Memories */}
                      <div 
                        onClick={() => handleOpenReelFeed()}
                        className="aspect-video rounded-xl bg-gradient-to-br from-amber-50 to-vault-cream border border-amber-200/50 flex flex-col items-center justify-center text-amber-800/70 group cursor-pointer hover:bg-amber-100/50 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:scale-110 transition-transform">auto_awesome</span>
                        <span className="text-[9px] font-medium tracking-tight text-vault-subtle mt-0.5">Memories</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action strip */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100 text-[11px] font-semibold text-vault-subtle">
                    <span className="flex items-center gap-1 cursor-grab">
                      <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 8h16M4 16h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                      Reorder
                    </span>
                    <button 
                      onClick={() => {
                        playPopSound();
                        setFolderModalCategory(cat1);
                      }}
                      className="text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Open <span>→</span>
                    </button>
                  </div>
                </article>
              );
            })()}

            {/* Folder 2: Coding & Tech (Full Video Cover Feature Reel) */}
            {effectiveCategories.length > 1 && (() => {
              const cat2 = effectiveCategories[1];
              const catReels = reelsByFolder[cat2.name.toLowerCase().trim()] || [];
              const featuredReel = catReels[0] || DEFAULT_DEMO_REELS[4];

              return (
                <article 
                  key={cat2.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnFolder(cat2.name)}
                  className="min-w-[270px] w-[270px] bg-white rounded-3xl p-4 shadow-soft border border-stone-100 flex flex-col justify-between snap-start"
                >
                  <div>
                    {/* Tags & Star Row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-stone-300 font-bold text-xs select-none">⋮⋮</span>
                        <span className="px-2 py-0.5 bg-pink-50 text-vault-accent font-semibold text-[10px] rounded-full border border-pink-100/60 truncate">
                          {cat2.name}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[9px] font-medium rounded-full truncate max-w-[100px]">
                          {featuredReel.author || '@reporterlive...'}
                        </span>
                      </div>
                      <button 
                        aria-label="Bookmark reel" 
                        onClick={() => {
                          playPopSound();
                          onToggleFavoriteReel(featuredReel.id);
                        }}
                        className={`transition-colors cursor-pointer ${
                          featuredReel.favorite ? 'text-amber-400' : 'text-stone-300 hover:text-amber-400'
                        }`}
                      >
                        <svg className={`w-4 h-4 ${featuredReel.favorite ? 'fill-current' : 'fill-none stroke-current'}`} strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </button>
                    </div>

                    {/* Prominent Video Cover with Center Play button */}
                    <div 
                      onClick={() => handleOpenReelFeed(featuredReel.id)}
                      className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-900 border border-stone-100 shadow-inner group cursor-pointer"
                    >
                      <img 
                        alt={featuredReel.headline || "Featured reel cover"} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        src={featuredReel.thumbnailUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBoUlII3oUcI_PAaJMaGEUU3LlCC225D4S_IMfZHyvpL8a39Oi2NR_h1BhMVGUPe8Vr-Gh2wAaMbhVQrbm4fjMfLVpowNNd71JXaEaVfxlvFowA14Up4v9M3K9XgNaFyj-DCNtE748ZLJxT-uUNHX_7Mm8iTXww4VkSPOcpftr7Wb1n59LkOLmwDms9sXJ1OzmqI-nT0sCzyUFE31JD5dC0oXCmp6E1nvuuX_ppjGr9"}
                      />
                      {/* Watch Reel chip badge */}
                      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Watch Reel</span>
                      </div>
                      {/* Big Pink/White Translucent Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-white text-vault-accent flex items-center justify-center shadow-lg transition-transform active:scale-90 group-hover:scale-110">
                          <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h5 className="font-bold text-xs text-vault-dark mt-2.5 line-clamp-2 leading-snug">
                      {featuredReel.headline || 'Elephant Encounter on Scooter (Reporter Live)'}
                    </h5>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] text-vault-subtle">
                    <span className="text-stone-400">Added 2d ago</span>
                    <button 
                      onClick={() => handleOpenReelFeed(featuredReel.id)}
                      className="text-vault-accent font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      Quick Play ↗
                    </button>
                  </div>
                </article>
              );
            })()}

            {/* Additional User Folders (if user creates more than 2) */}
            {effectiveCategories.slice(2).map((cat) => {
              const catReels = reelsByFolder[cat.name.toLowerCase().trim()] || [];
              return (
                <article 
                  key={cat.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnFolder(cat.name)}
                  className="min-w-[270px] w-[270px] bg-white rounded-3xl p-4 shadow-soft border border-stone-100 flex flex-col justify-between snap-start"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Folder size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-vault-dark leading-tight">{cat.name}</h4>
                        <p className="text-[11px] text-vault-subtle">{catReels.length} reel{catReels.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        playPopSound();
                        setEditingCategoryTarget(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      className="w-7 h-7 rounded-full bg-stone-50 border border-stone-200/50 flex items-center justify-center text-vault-subtle hover:text-vault-dark cursor-pointer"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>

                  <div className="aspect-video rounded-xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 gap-1 my-2">
                    <span className="material-symbols-outlined text-[20px]">movie</span>
                    <span className="text-[10px] font-medium">{catReels.length} reels organized</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100 text-[11px] font-semibold text-vault-subtle">
                    <span className="flex items-center gap-1 cursor-grab">
                      <ArrowUpDown size={12} className="text-stone-400" />
                      Reorder
                    </span>
                    <button 
                      onClick={() => {
                        playPopSound();
                        setFolderModalCategory(cat);
                      }}
                      className="text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Open <span>→</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Folder 3: Add New Folder Card (Dashed Border) */}
            <article 
              onClick={() => {
                playPopSound();
                setEditingCategoryTarget(null);
                setIsCategoryModalOpen(true);
              }}
              className="min-w-[150px] w-[150px] bg-amber-50/40 rounded-3xl p-4 border-2 border-dashed border-amber-300/70 flex flex-col items-center justify-center text-center gap-2 snap-start cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#FAECD6] text-[#A67332] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6v12m6-6H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
              </div>
              <span className="font-bold text-xs text-[#8A5A20]">New folder</span>
            </article>
          </div>
        </section>
        {/* END: FolderDeckRow */}

        {/* ======================================================== */}
        {/* 4. INDEPENDENT REELS DOCK                                */}
        {/* ======================================================== */}
        <section className="space-y-3" data-purpose="unfiled-independent-reels">
          <div className="space-y-2.5" id="independent-reels-list">
            {independentReels.map((reel) => {
              return (
                <div 
                  key={reel.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, reel.id)}
                  onDragEnd={handleDragEnd}
                  className="bg-white rounded-2xl p-3 border border-stone-200/70 shadow-sm flex items-center gap-3 active:scale-[0.99] transition-all cursor-grab hover:shadow-md relative"
                  data-purpose="independent-reel-item"
                >
                  {/* Drag Handle */}
                  <span className="text-stone-300 font-bold select-none text-sm cursor-grab">⋮⋮</span>

                  {/* Video Thumbnail */}
                  <div 
                    onClick={() => handleOpenReelFeed(reel.id)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-900 shrink-0 cursor-pointer group"
                  >
                    <img 
                      alt={reel.headline || "Reel thumbnail"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      src={reel.thumbnailUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDIcR7ucluFBsqO4H84JTSBROAeqVyENGtPd59DfcjSAV5Iggnr1wbV7wsH80DGK2Et6LMVMOfn1sukH7-9Rrsmq4xWWIDkP1rtjZpg2wHUsM31DAQszgCP4eANsF7lNiE3Xf_gHO2MHFtOxKRksNlAJ4DUUR1y95N7fCainHJZ9sLlC2IJ9IhJHrPteyvn41uArATt7k10FXulzIYPNGLZ9JBRqVDwaVDjF0v1xl0I"} 
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/90 text-primary flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                      0:45
                    </span>
                  </div>

                  {/* Reel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-vault-subtle font-medium truncate">
                        {reel.author || '@designcoder'}
                      </span>
                      {(reel.tags && reel.tags.length > 0 ? reel.tags : ['AI', 'Design']).slice(0, 2).map((tag, i) => (
                        <span 
                          key={tag} 
                          className={`text-[9px] px-1.5 py-0.2 font-medium rounded-full ${
                            i === 0 
                              ? 'bg-lavender-subtle text-primary font-semibold border border-purple-200/60' 
                              : 'bg-peach-subtle text-tertiary'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h4 
                      onClick={() => handleOpenReelFeed(reel.id)}
                      className="font-bold text-xs text-vault-dark truncate leading-snug cursor-pointer hover:text-primary transition-colors"
                    >
                      {reel.headline || '10 Prompts I Reuse on Every Project'}
                    </h4>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => {
                          playPopSound();
                          setReelToMove(reel);
                        }}
                        className="text-[10px] font-semibold text-primary bg-lavender-subtle hover:bg-purple-100 border border-purple-200/60 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">drive_file_move</span>
                        Move to Folder
                      </button>

                      <div className="relative">
                        <button 
                          aria-label="More options" 
                          onClick={(e) => {
                            e.stopPropagation();
                            playPopSound();
                            setActiveMenuReelId(activeMenuReelId === reel.id ? null : reel.id);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuReelId === reel.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-36 rounded-2xl bg-white shadow-xl border border-stone-200/80 py-1.5 z-30 animate-fadeIn text-xs">
                            <button
                              onClick={() => {
                                playPopSound();
                                onToggleFavoriteReel(reel.id);
                                setActiveMenuReelId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-stone-50 cursor-pointer"
                            >
                              <Star size={13} className={reel.favorite ? 'text-amber-400 fill-amber-400' : 'text-stone-400'} />
                              <span>{reel.favorite ? 'Unstar' : 'Star Reel'}</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(reel)}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-stone-50 cursor-pointer"
                            >
                              <Edit3 size={13} className="text-stone-400" />
                              <span>Edit Reel</span>
                            </button>
                            <button
                              onClick={() => handleCopyLink(reel.url)}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-stone-50 cursor-pointer"
                            >
                              <Copy size={13} className="text-stone-400" />
                              <span>Copy Link</span>
                            </button>
                            <div className="my-1 border-t border-stone-100" />
                            <button
                              onClick={() => {
                                playPopSound();
                                onDeleteReel(reel.id);
                                setActiveMenuReelId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-red-500 hover:bg-red-50 cursor-pointer font-semibold"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* END: IndependentReelsDock */}
      </main>

      {/* ======================================================== */}
      {/* 5. FLOATING QUICK ADD BUTTON (FAB)                       */}
      {/* ======================================================== */}
      <aside className="fixed bottom-24 right-5 z-40 max-w-md mx-auto" data-purpose="quick-add-reel-fab">
        <button 
          aria-label="Quick save reel link" 
          onClick={() => handleOpenAdd()}
          className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-primary to-primary-container text-white shadow-[0_8px_20px_rgba(107,56,212,0.35)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      </aside>

      {/* ======================================================== */}
      {/* 6. TOAST COPIED NOTIFICATION                             */}
      {/* ======================================================== */}
      {copiedNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-fadeIn">
          <Check size={14} className="text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MOVE TO FOLDER MODAL / SHEET                          */}
      {/* ======================================================== */}
      {reelToMove && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-stone-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderInput size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-vault-dark">Move to Folder</h3>
              </div>
              <button 
                onClick={() => setReelToMove(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-vault-subtle line-clamp-1">
              Select destination for: <span className="font-semibold text-vault-dark">{reelToMove.headline}</span>
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
              {effectiveCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleConfirmMove(cat.name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 hover:bg-lavender-subtle hover:text-primary transition-all text-xs font-semibold cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <Folder size={15} className="text-primary" />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-vault-subtle">Select →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. SANCTUARY UPDATES NOTIFICATION MODAL                  */}
      {/* ======================================================== */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-stone-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="font-bold text-base text-vault-dark">
                  Reels Sanctuary Updates
                </h3>
              </div>
              <button 
                onClick={() => setIsNotificationOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-lavender-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">✨ Cozy Moment Vault</span>
                  <span className="text-[10px] text-vault-subtle">Just now</span>
                </div>
                <p className="text-xs text-vault-subtle">Your saved reels and tutorials are safely organized in cute categorised folders.</p>
              </div>
              <div className="p-3 rounded-2xl bg-peach-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-tertiary">🎬 Fullscreen Feed</span>
                  <span className="text-[10px] text-vault-subtle">Ready</span>
                </div>
                <p className="text-xs text-vault-subtle">Tap "Reel Feed" anytime to watch vertical reels uninterrupted.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsNotificationOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              All Caught Up!
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. ALL EXISTING FUNCTIONAL MODALS                        */}
      {/* ======================================================== */}
      {/* Add / Edit Reel Modal */}
      <ReelModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReel(null);
          setModalInitialUrl('');
          setPrefilledCategory(undefined);
        }}
        reel={editingReel}
        initialUrl={modalInitialUrl}
        categories={effectiveCategories}
        defaultCategory={prefilledCategory}
        onSave={(r) => {
          onSaveReel(r);
          setIsModalOpen(false);
          triggerCelebration();
        }}
      />

      {/* Create / Edit Folder Modal */}
      <EditReelCategoryModal
        isOpen={isCategoryModalOpen}
        category={editingCategoryTarget}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategoryTarget(null);
        }}
        onSave={(cat) => {
          if (onSaveCategory) onSaveCategory(cat);
          setIsCategoryModalOpen(false);
          triggerCelebration();
        }}
        onDelete={
          editingCategoryTarget && onDeleteCategory
            ? (id) => {
                onDeleteCategory(id);
                setIsCategoryModalOpen(false);
              }
            : undefined
        }
      />

      {/* Folder Viewer Modal */}
      {folderModalCategory && (
        <ReelFolderModal
          isOpen={!!folderModalCategory}
          category={folderModalCategory}
          reels={effectiveReels}
          onClose={() => setFolderModalCategory(null)}
          onPlayInSequence={(r) => handleOpenReelFeed(r?.id)}
          onToggleFavorite={onToggleFavoriteReel}
          onEdit={handleOpenEdit}
          onDelete={onDeleteReel}
          onAddReelToCategory={(catName) => handleOpenAdd(catName)}
          onEditCategory={(cat) => {
            setFolderModalCategory(null);
            setEditingCategoryTarget(cat);
            setIsCategoryModalOpen(true);
          }}
        />
      )}

      {/* Fullscreen Video Sequence Player */}
      {isFeedFullscreen && (
        <ReelSequencePlayer
          reels={effectiveReels}
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
