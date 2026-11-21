import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Palette,
  Plus,
  Search,
  Star,
  Trash2,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Tag as TagIcon,
  Undo2,
  Redo2,
  RotateCcw,
  Sparkles,
  Heart,
  GripVertical,
  CheckSquare,
  Square,
  Eye,
  Eraser,
  PenTool,
  Paperclip,
  Share2,
  AlertTriangle,
  Edit3,
  X,
  ChevronRight,
  FolderPlus,
  MoreHorizontal,
  FolderInput,
  Folder,
  Clock,
  Cloud,
  CheckCircle2,
  Lock,
  Bell
} from 'lucide-react';
import type { NoteItem, SketchItem, Attachment, WorkspaceView } from '../types';
import { formatDate } from '../utils/urlHelper';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { NoteModal } from './NoteModal';
import avatarImg from '../assets/avatar.jpg';
import './notes.css';

export interface NotesAndSketchpadAreaProps {
  notes: NoteItem[];
  sketches: SketchItem[];
  onAddNote: (note: {
    title: string;
    content: string;
    highlight?: string;
    color: string;
    pinned: boolean;
    tag?: string;
    drawing?: string;
    attachments?: Attachment[];
  }) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onReorderNotes?: (reordered: NoteItem[]) => void;
  onSaveSketch: (sketch: Omit<SketchItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteSketch: (id: string) => void;
  onOpenAttachment?: (attachment: Attachment) => void;
  onNavigate?: (view: WorkspaceView) => void;
  onLock?: () => void;
}

interface NoteTagConfig {
  id: string;
  label: string;
  emoji?: string;
  bgClass: string;
  textClass: string;
}

const TAG_CONFIGS: NoteTagConfig[] = [
  { id: 'all', label: 'All', emoji: '●', bgClass: 'bg-on-surface text-surface-bright', textClass: 'text-surface-bright' },
  { id: 'pinned', label: 'Pinned', emoji: '📌', bgClass: 'bg-sunshine-subtle text-amber-900', textClass: 'text-amber-900' },
  { id: 'idea', label: 'Idea', emoji: '💡', bgClass: 'bg-mint-subtle text-emerald-900', textClass: 'text-emerald-900' },
  { id: 'personal', label: 'Personal', emoji: '🌸', bgClass: 'bg-peach-subtle text-pink-900', textClass: 'text-pink-900' },
  { id: 'project', label: 'Project', emoji: '💻', bgClass: 'bg-lavender-subtle text-purple-900', textClass: 'text-purple-900' },
  { id: 'cute', label: 'Cute', emoji: '🧸', bgClass: 'bg-sunshine-subtle text-amber-800', textClass: 'text-amber-800' },
  { id: 'urgent', label: 'Urgent', emoji: '🚨', bgClass: 'bg-error-container text-on-error-container', textClass: 'text-on-error-container' },
];

const DEFAULT_SHOWCASE_NOTES: NoteItem[] = [
  {
    id: 'note-showcase-1',
    title: 'Design System Radii & Colors',
    content: '- [x] Rounded-full pill shapes across CTA buttons\n- [x] Pastel lavender and peach card washes\n- [ ] Export SVG iconography bundle for cute stickers',
    color: 'lavender',
    pinned: true,
    tag: '#Design',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'note-showcase-2',
    title: 'Quick Coffee Thoughts ☕',
    content: '"The secret to morning flow is a calm desk, soft warm lamp light, and gentle ambient lo-fi hum."',
    highlight: '"The secret to morning flow is a calm desk, soft warm lamp light, and gentle ambient lo-fi hum."',
    color: 'amber',
    pinned: false,
    tag: '#Mindset',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'note-showcase-3',
    title: 'Weekend Coding Ideas',
    content: 'Interactive canvas with cute doodle pads, brush stroke width selector, and floating cute stickers palette for quick markdown highlights.',
    color: 'sky',
    pinned: false,
    tag: '#Ideas',
    drawing: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

const PASTEL_PALETTE = [
  { name: 'Charcoal', hex: '#292524' },
  { name: 'Sakura Rose', hex: '#DE3B78' },
  { name: 'Warm Peach', hex: '#f97316' },
  { name: 'Honey Amber', hex: '#eab308' },
  { name: 'Matcha Sage', hex: '#2C5A45' },
  { name: 'Sky Mint', hex: '#06b6d4' },
  { name: 'Periwinkle', hex: '#6366f1' },
  { name: 'Lavender', hex: '#a855f7' },
  { name: 'Bubblegum', hex: '#ec4899' },
  { name: 'Chalk White', hex: '#ffffff' },
];

const STICKERS = ['⭐', '💖', '✨', '🌸', '🐱', '☕', '🍄', '🌈', '🧶', '🍀'];

const PAPER_STYLES = [
  { id: 'cream', name: 'Cream Paper', icon: '📜', bg: '#fdfbf7' },
  { id: 'grid', name: 'Pastel Grid', icon: '📐', bg: '#f9f9fb' },
  { id: 'dots', name: 'Bullet Dots', icon: '💠', bg: '#f8fafc' },
  { id: 'ruled', name: 'Lined Notebook', icon: '📝', bg: '#fefefe' },
  { id: 'dark', name: 'Blackboard', icon: '🌌', bg: '#18181b' },
] as const;

export const NotesAndSketchpadArea: React.FC<NotesAndSketchpadAreaProps> = ({
  notes = [],
  sketches = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes,
  onSaveSketch,
  onDeleteSketch,
  onOpenAttachment,
  onNavigate,
  onLock,
}) => {
  // Merged effective notes ensuring demo notes exist
  const effectiveNotes = useMemo(() => {
    const userNotes = [...(notes || [])];
    const result = [...userNotes];
    DEFAULT_SHOWCASE_NOTES.forEach((demo) => {
      const exists = result.some(
        (n) => n.title.toLowerCase().trim() === demo.title.toLowerCase().trim()
      );
      if (!exists) {
        result.push(demo);
      }
    });
    return result;
  }, [notes]);

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Modals & Popups
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeModalNote, setActiveModalNote] = useState<NoteItem | null>(null);
  const [isDoodleModalOpen, setIsDoodleModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [noteToMove, setNoteToMove] = useState<NoteItem | null>(null);
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);

  // Checklist item toggle state (persisted per note)
  const [checkedItemsMap, setCheckedItemsMap] = useState<Record<string, Record<number, boolean>>>({
    'note-showcase-1': { 0: true, 1: true, 2: false }
  });

  // Sketchpad state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [brushColor, setBrushColor] = useState('#6b38d4');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'stamp'>('pen');
  const [selectedSticker, setSelectedSticker] = useState('🌸');
  const [paperStyle, setPaperStyle] = useState<'cream' | 'grid' | 'dots' | 'ruled' | 'dark'>('cream');
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [sketchTitle, setSketchTitle] = useState('Cozy Doodle');

  // Drag and drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  // Celebration helper
  const triggerCelebration = () => {
    try {
      playPopSound();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6B38D4', '#DE3B78', '#F59E0B', '#006C49']
      });
    } catch {}
  };

  // Filtered notes
  const displayedNotes = useMemo(() => {
    let list = [...effectiveNotes];

    if (selectedFolder) {
      const q = selectedFolder.toLowerCase().trim();
      list = list.filter((n) => 
        (n.tag && n.tag.toLowerCase().includes(q)) ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
      );
    }

    if (selectedTagId !== 'all') {
      if (selectedTagId === 'pinned') {
        list = list.filter((n) => n.pinned);
      } else {
        const tagMatch = selectedTagId.toLowerCase();
        list = list.filter((n) => {
          const t = (n.tag || '').toLowerCase();
          return t.includes(tagMatch);
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q)) ||
          (n.tag && n.tag.toLowerCase().includes(q)) ||
          (n.highlight && n.highlight.toLowerCase().includes(q))
      );
    }

    return list;
  }, [effectiveNotes, selectedFolder, selectedTagId, searchQuery]);

  // Toggle checklist item
  const handleToggleChecklist = (noteId: string, itemIdx: number) => {
    playPopSound();
    setCheckedItemsMap((prev) => {
      const noteMap = prev[noteId] || {};
      const currentVal = noteMap[itemIdx] ?? false;
      return {
        ...prev,
        [noteId]: {
          ...noteMap,
          [itemIdx]: !currentVal,
        },
      };
    });
  };

  // Open note in modal
  const handleOpenNote = (note: NoteItem) => {
    playPopSound();
    setActiveModalNote(note);
    setIsNoteModalOpen(true);
  };

  // Open create note
  const handleOpenCreateNote = () => {
    playPopSound();
    setActiveModalNote(null);
    setIsNoteModalOpen(true);
  };

  // Open doodle modal
  const handleOpenDoodle = () => {
    playPopSound();
    setIsDoodleModalOpen(true);
    setTimeout(resizeCanvas, 60);
  };

  // Canvas resize and setup
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const width = parent.clientWidth;
    const height = 360;

    let existingDataUrl = '';
    if (canvas.width > 0 && canvas.height > 0) {
      existingDataUrl = canvas.toDataURL();
    }

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    if (existingDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = existingDataUrl;
    } else {
      fillPaperBackground(ctx, width, height, paperStyle);
      pushHistory();
    }
  }, [paperStyle]);

  const fillPaperBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    style: typeof paperStyle
  ) => {
    ctx.save();
    const styleObj = PAPER_STYLES.find((s) => s.id === style);
    ctx.fillStyle = styleObj ? styleObj.bg : '#fdfbf7';
    ctx.fillRect(0, 0, width, height);

    if (style === 'grid') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (style === 'dots') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      const step = 22;
      for (let x = 12; x < width; x += step) {
        for (let y = 12; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (style === 'ruled') {
      ctx.strokeStyle = 'rgba(0, 100, 200, 0.08)';
      ctx.lineWidth = 1;
      const step = 26;
      for (let y = 30; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL();
      setHistory((prev) => [...prev.slice(-20), dataUrl]);
      setRedoStack([]);
    } catch {}
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'stamp') {
      ctx.save();
      ctx.font = `${brushSize * 4 + 18}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedSticker, x, y);
      ctx.restore();
      pushHistory();
      playPopSound();
      triggerPartyPop('single');
      return;
    }

    isDrawingRef.current = true;
    lastPointRef.current = { x, y };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = paperStyle === 'dark' ? '#18181b' : paperStyle === 'cream' ? '#fdfbf7' : '#ffffff';
      ctx.lineWidth = brushSize * 2.5;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = brushColor + '40';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = paperStyle === 'dark' ? '#18181b' : paperStyle === 'cream' ? '#fdfbf7' : '#ffffff';
      ctx.lineWidth = brushSize * 2.5;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = brushColor + '40';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      pushHistory();
    }
  };

  const handleSaveDoodle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSketch({
      title: sketchTitle.trim() || 'Cozy Doodle',
      dataUrl,
    });
    // Also save as a note
    onAddNote({
      title: sketchTitle.trim() || 'Cozy Doodle',
      content: 'Hand-drawn sketch saved from Creative Studio',
      color: 'lavender',
      pinned: false,
      tag: '#Ideas',
      drawing: dataUrl,
    });
    setIsDoodleModalOpen(false);
    triggerCelebration();
  };

  return (
    <div className="text-on-surface min-h-screen flex flex-col font-sans pb-32 antialiased selection:bg-purple-200 bg-[#FAF8F4]">
      
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
                <h1 className="font-bold text-sm tracking-tight text-on-surface font-sans">
                  Sreeshnav's Space
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/80 text-amber-800 border border-amber-200/50">
                  ✨ Feeling Creative
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium">Personal cozy corner</p>
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
              className="w-8 h-8 rounded-full bg-white/80 shadow-sm border border-stone-200/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer active:scale-95 transition-all"
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
              className="w-8 h-8 rounded-full bg-white/80 shadow-sm border border-stone-200/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface relative cursor-pointer active:scale-95 transition-all"
            >
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Screen Title Banner with Notes & Sketchpad & Actions */}
        <div className="bg-surface-card rounded-3xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            {/* Note Icon Badge in soft peach */}
            <div className="w-12 h-12 rounded-2xl bg-peach-subtle text-[#92002A] flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">edit_note</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold tracking-tight text-on-surface leading-snug font-fraunces">
                  Notes & Sketchpad
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-mint-subtle text-emerald-900 font-label-sm text-[10px] font-semibold shrink-0">
                  Cute Studio
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate">
                Pastel notes, checklists & freehand doodles synced to cozy cloud
              </p>
            </div>
          </div>

          {/* Search Bar with Sunshine Cream Tone */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-[18px]">
              search
            </span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-sunshine-subtle/40 text-on-surface placeholder:text-on-surface-variant/70 rounded-full font-body-sm text-xs focus:outline-none focus:bg-sunshine-subtle/70 transition-colors shadow-inner border border-amber-200/40" 
              placeholder="Search notes, checklists, thoughts..." 
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

          {/* Action buttons row below search bar: Doodle & New Note */}
          <div className="flex items-center justify-end w-full gap-2 pt-0.5">
            <button 
              onClick={handleOpenDoodle}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-peach-subtle text-on-tertiary-fixed-variant font-label-md text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-[14px]">🎨</span>
              <span>Doodle</span>
            </button>
            <button 
              onClick={handleOpenCreateNote}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs font-semibold shadow-[0_4px_12px_rgba(107,56,212,0.25)] active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 space-y-4">
        
        {/* Category Filter Pills Rail (Horizontal Scrollable) */}
        <section aria-label="Note category filters">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {TAG_CONFIGS.map((tag) => {
              const isActive = selectedTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    playPopSound();
                    setSelectedTagId(tag.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs shrink-0 active:scale-95 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-on-surface text-surface-bright shadow-sm'
                      : `${tag.bgClass} hover:opacity-90`
                  }`}
                >
                  {tag.id === 'all' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                  )}
                  {tag.id !== 'all' && <span>{tag.emoji}</span>}
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. VAULT FOLDERS BENTO GRID SECTION                      */}
        {/* ======================================================== */}
        <section className="space-y-2" data-purpose="vault-folders">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-fraunces text-base font-bold text-on-surface">
                Vault Folders
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                3 Active
              </span>
            </div>
            <button 
              onClick={() => {
                playPopSound();
                setIsFolderModalOpen(true);
              }}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Folder 1: Creative Sparks (Stitch 1:1) */}
            <div 
              onClick={() => {
                playPopSound();
                setSelectedFolder(selectedFolder === 'Creative Sparks' ? null : 'Creative Sparks');
              }}
              className={`relative bg-lavender-subtle rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                selectedFolder === 'Creative Sparks' ? 'border-primary ring-2 ring-primary/20' : 'border-purple-200/50'
              }`}
            >
              <span className="material-symbols-outlined absolute -bottom-3 -right-3 text-primary/10 text-[96px] select-none pointer-events-none">
                lightbulb
              </span>
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xl">💡</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-card text-on-surface-variant text-[11px] font-semibold shadow-xs">
                    4 notes
                  </span>
                </div>
                <h3 className="font-fraunces text-lg text-on-surface font-semibold leading-snug">
                  Creative Sparks
                </h3>
                <p className="text-xs text-on-surface-variant line-clamp-1">
                  Midnight prompts, moodboard links & ideas
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-3 relative z-10">
                <span className="px-2 py-0.5 rounded-full bg-surface-card/80 text-primary text-[10px] font-semibold">
                  #frontend
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-card/80 text-primary text-[10px] font-semibold">
                  #ai-prompts
                </span>
                <span className="ml-auto w-7 h-7 rounded-full bg-surface-card flex items-center justify-center text-on-surface shadow-xs hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. INDEPENDENT / UNFILED NOTES SECTION                   */}
        {/* ======================================================== */}
        <section className="space-y-3 pt-1" data-purpose="unfiled-notes-list">
          {displayedNotes.length === 0 ? (
            <div className="bg-surface-card rounded-2xl p-8 border border-border-subtle text-center flex flex-col items-center">
              <span className="text-3xl mb-2">📝</span>
              <h4 className="font-fraunces text-base font-bold text-on-surface mb-1">No Notes Found</h4>
              <p className="text-xs text-on-surface-variant max-w-xs">
                No notes match the selected filters. Tap + New Note to capture your creative thoughts!
              </p>
            </div>
          ) : (
            displayedNotes.map((note) => {
              const isCard1Checklist = note.id === 'note-showcase-1' || note.title.toLowerCase().includes('design system');
              const isCard2Quote = note.id === 'note-showcase-2' || note.title.toLowerCase().includes('quick coffee');
              const isCard3Doodle = note.id === 'note-showcase-3' || Boolean(note.drawing) || note.title.toLowerCase().includes('weekend coding');

              // Checklist parsing
              const checklistItems = isCard1Checklist
                ? [
                    { id: 0, text: 'Rounded-full pill shapes across CTA buttons' },
                    { id: 1, text: 'Pastel lavender and peach card washes' },
                    { id: 2, text: 'Export SVG iconography bundle for cute stickers' }
                  ]
                : [];

              const currentChecklistState = checkedItemsMap[note.id] || { 0: true, 1: true, 2: false };

              return (
                <div 
                  key={note.id}
                  className="w-full bg-surface-card rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(139,92,246,0.06),0_2px_6px_-1px_rgba(21,19,17,0.03)] hover:shadow-md transition-shadow border border-stone-100 relative group"
                >
                  {/* Top row: Drag indicator, Tag pill, Move and More actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-on-surface-variant/50 cursor-grab">
                      <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isCard1Checklist 
                          ? 'bg-lavender-subtle text-primary' 
                          : isCard2Quote 
                          ? 'bg-sunshine-subtle text-sunshine-accent' 
                          : 'bg-sky-subtle text-sky-accent'
                      }`}>
                        {note.tag || '#Ideas'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <button 
                        onClick={() => {
                          playPopSound();
                          setNoteToMove(note);
                        }}
                        title="Move to Folder"
                        className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center hover:text-primary transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                      </button>
                      <button 
                        onClick={() => {
                          playPopSound();
                          setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id);
                        }}
                        title="More options"
                        className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center hover:text-primary transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                      </button>
                    </div>
                  </div>

                  {/* Context Menu Dropdown */}
                  {activeMenuNoteId === note.id && (
                    <div className="absolute top-12 right-4 z-30 bg-white rounded-2xl shadow-xl border border-stone-200/80 p-1.5 min-w-[140px] text-xs space-y-1 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={() => {
                          setActiveMenuNoteId(null);
                          handleOpenNote(note);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit3 size={12} />
                        <span>Edit Note</span>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveMenuNoteId(null);
                          navigator.clipboard.writeText(`${note.title}\n${note.content}`);
                          triggerPartyPop('single');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Copy size={12} />
                        <span>Copy Text</span>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveMenuNoteId(null);
                          onDeleteNote(note.id);
                          playPopSound();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}

                  {/* Note Title & Content */}
                  <div className="mt-2 space-y-1.5">
                    <h4 
                      onClick={() => handleOpenNote(note)}
                      className="font-fraunces text-base font-bold text-on-surface cursor-pointer hover:text-primary transition-colors"
                    >
                      {note.title}
                    </h4>

                    {/* Variant 1: Checklist Style */}
                    {isCard1Checklist && (
                      <div className="space-y-1.5 pt-1">
                        {checklistItems.map((item) => {
                          const isChecked = currentChecklistState[item.id] ?? false;
                          return (
                            <label 
                              key={item.id} 
                              className="flex items-center gap-2 font-body-sm text-xs text-on-surface cursor-pointer select-none"
                            >
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleChecklist(note.id, item.id)}
                                className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                              />
                              <span className={isChecked ? 'line-through text-on-surface-variant' : 'text-on-surface'}>
                                {item.text}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Variant 2: Quote / Mindset Style */}
                    {isCard2Quote && (
                      <div 
                        onClick={() => handleOpenNote(note)}
                        className="p-3 bg-sunshine-subtle/30 rounded-xl text-on-surface font-body-sm text-xs italic border border-amber-200/40 cursor-pointer"
                      >
                        {note.highlight || note.content}
                      </div>
                    )}

                    {/* Variant 3: Freehand / Canvas Snippet */}
                    {isCard3Doodle && (
                      <>
                        <p 
                          onClick={() => handleOpenNote(note)}
                          className="font-body-sm text-xs text-on-surface-variant cursor-pointer line-clamp-2"
                        >
                          {note.content}
                        </p>
                        {/* Mini Doodle Canvas Preview */}
                        <div 
                          onClick={handleOpenDoodle}
                          className="mt-2 h-14 w-full bg-canvas-bg rounded-xl flex items-center justify-between px-4 border border-stone-200/60 cursor-pointer hover:border-primary/40 transition-colors shadow-inner"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary shadow-xs"></span>
                            <span className="w-3 h-3 rounded-full bg-sunshine-accent shadow-xs"></span>
                            <span className="w-3 h-3 rounded-full bg-secondary-container shadow-xs"></span>
                            <span className="w-3 h-3 rounded-full bg-tertiary-container shadow-xs"></span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant italic font-medium flex items-center gap-1">
                            1 Sketch Attached ✏️
                          </span>
                        </div>
                      </>
                    )}

                    {/* Regular Note Card (if not matching showcase variants) */}
                    {!isCard1Checklist && !isCard2Quote && !isCard3Doodle && (
                      <p 
                        onClick={() => handleOpenNote(note)}
                        className="font-body-sm text-xs text-on-surface-variant cursor-pointer line-clamp-3"
                      >
                        {note.content}
                      </p>
                    )}
                  </div>

                  {/* Bottom strip: Timestamp & Synced Status */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-100 text-on-surface-variant text-[11px] font-medium">
                    <span className="flex items-center gap-1 text-stone-400">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {isCard1Checklist ? '2 hrs ago' : isCard2Quote ? 'Yesterday' : isCard3Doodle ? 'Oct 22' : formatDate(note.updatedAt || note.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                      Synced
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* ======================================================== */}
      {/* 5. FLOATING QUICK ACTION BUTTON (FAB)                    */}
      {/* ======================================================== */}
      <aside className="fixed bottom-24 right-5 z-40 max-w-md mx-auto" data-purpose="quick-add-note-fab">
        <button 
          aria-label="Quick add note" 
          onClick={handleOpenCreateNote}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-[0_8px_20px_rgba(107,56,212,0.35)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </aside>

      {/* ======================================================== */}
      {/* 7. DOODLE / SKETCHPAD MODAL                              */}
      {/* ======================================================== */}
      {isDoodleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <input 
                  value={sketchTitle}
                  onChange={(e) => setSketchTitle(e.target.value)}
                  className="font-fraunces text-base font-bold text-on-surface focus:outline-none border-b border-dashed border-stone-300 px-1"
                  placeholder="Sketch title..."
                />
              </div>
              <button 
                onClick={() => setIsDoodleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="relative w-full h-[360px] bg-canvas-bg overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="touch-none cursor-crosshair"
              />
            </div>

            {/* Doodle Controls Strip */}
            <div className="p-3 border-t border-stone-100 space-y-2.5 bg-stone-50/50">
              {/* Tool selectors */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-stone-200/70 shadow-xs">
                  <button
                    onClick={() => { playPopSound(); setTool('pen'); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      tool === 'pen' ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <PenTool size={12} /> Pen
                  </button>
                  <button
                    onClick={() => { playPopSound(); setTool('highlighter'); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      tool === 'highlighter' ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles size={12} /> Glow
                  </button>
                  <button
                    onClick={() => { playPopSound(); setTool('eraser'); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      tool === 'eraser' ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Eraser size={12} /> Erase
                  </button>
                  <button
                    onClick={() => { playPopSound(); setTool('stamp'); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      tool === 'stamp' ? 'bg-primary text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🌸 Stamp
                  </button>
                </div>

                {/* Undo / Redo */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      if (history.length > 1) {
                        const newHistory = history.slice(0, -1);
                        const prevImage = newHistory[newHistory.length - 1];
                        setRedoStack((prev) => [history[history.length - 1], ...prev]);
                        setHistory(newHistory);
                        const img = new Image();
                        img.onload = () => {
                          const ctx = canvasRef.current?.getContext('2d');
                          if (ctx && canvasRef.current) {
                            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                          }
                        };
                        img.src = prevImage;
                      }
                    }}
                    title="Undo"
                    className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    <Undo2 size={12} />
                  </button>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {PASTEL_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setBrushColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full shrink-0 border-2 transition-transform cursor-pointer ${
                      brushColor === c.hex ? 'scale-110 border-stone-800' : 'border-white shadow-xs'
                    }`}
                  />
                ))}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    fillPaperBackground(ctx, canvas.width, canvas.height, paperStyle);
                    pushHistory();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Clear Canvas
                </button>
                <button
                  onClick={handleSaveDoodle}
                  className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold shadow-sm hover:opacity-95 active:scale-95 cursor-pointer"
                >
                  Save to Notes ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MOVE TO FOLDER MODAL                                  */}
      {/* ======================================================== */}
      {noteToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderInput className="w-5 h-5 text-primary" />
                <h3 className="font-fraunces text-base font-bold text-on-surface">Move Note to Folder</h3>
              </div>
              <button 
                onClick={() => setNoteToMove(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Moving: <span className="font-semibold text-on-surface">{noteToMove.title}</span>
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onUpdateNote({ ...noteToMove, tag: '#Creative Sparks' });
                  setNoteToMove(null);
                  triggerCelebration();
                }}
                className="w-full text-left p-3 rounded-2xl bg-lavender-subtle hover:bg-purple-100 border border-purple-200/60 flex items-center justify-between text-xs font-semibold text-purple-900 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>💡</span> Creative Sparks
                </span>
                <span className="text-primary font-bold">Select →</span>
              </button>
              <button
                onClick={() => {
                  onUpdateNote({ ...noteToMove, tag: '#Personal' });
                  setNoteToMove(null);
                  triggerCelebration();
                }}
                className="w-full text-left p-3 rounded-2xl bg-peach-subtle hover:bg-pink-100 border border-pink-200/60 flex items-center justify-between text-xs font-semibold text-pink-900 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🌸</span> Personal Journal
                </span>
                <span className="text-tertiary font-bold">Select →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. NOTE MODAL (Add & Edit)                               */}
      {/* ======================================================== */}
      <NoteModal
        isOpen={isNoteModalOpen}
        note={activeModalNote}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={(data) => {
          if (activeModalNote) {
            onUpdateNote({
              ...activeModalNote,
              ...data,
              updatedAt: new Date().toISOString(),
            });
          } else {
            onAddNote({
              title: data.title || 'Untitled Note',
              content: data.content || '',
              highlight: data.highlight,
              color: data.color || 'lavender',
              pinned: Boolean(data.pinned),
              tag: data.tag || '#Idea',
              drawing: data.drawing,
              attachments: data.attachments || [],
            });
          }
          setIsNoteModalOpen(false);
          triggerCelebration();
        }}
        onDelete={(id) => {
          onDeleteNote(id);
          setIsNoteModalOpen(false);
        }}
        onOpenAttachment={onOpenAttachment}
      />

    </div>
  );
};
