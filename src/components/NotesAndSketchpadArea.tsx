import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Maximize2,
  CheckSquare,
  Square,
  Eye,
  Eraser,
  PenTool,
  Paperclip,
  Share2
} from 'lucide-react';
import type { NoteItem, SketchItem, Attachment } from '../types';
import { formatDate } from '../utils/urlHelper';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { getCategoryToken, resolveCategoryKey } from '../utils/themeColors';
import { NoteModal } from './NoteModal';

interface NotesAndSketchpadAreaProps {
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
}

const PASTEL_PALETTE = [
  { name: 'Charcoal', hex: '#292524' },
  { name: 'Sakura Rose', hex: '#f43f5e' },
  { name: 'Warm Peach', hex: '#f97316' },
  { name: 'Honey Amber', hex: '#eab308' },
  { name: 'Matcha Sage', hex: '#10b981' },
  { name: 'Sky Mint', hex: '#06b6d4' },
  { name: 'Periwinkle', hex: '#6366f1' },
  { name: 'Lavender', hex: '#a855f7' },
  { name: 'Bubblegum', hex: '#ec4899' },
  { name: 'Chalk White', hex: '#ffffff' },
];

const STICKERS = ['⭐', '💖', '✨', '🌸', '🐱', '☕', '🍓', '🌈', '🧁', '🍀'];

const PAPER_STYLES = [
  { id: 'cream', name: 'Cream Paper', icon: '📄', bg: '#fdfbf7' },
  { id: 'grid', name: 'Pastel Grid', icon: '📐', bg: '#f9f9fb' },
  { id: 'dots', name: 'Bullet Dots', icon: '🔘', bg: '#f8fafc' },
  { id: 'ruled', name: 'Lined Notebook', icon: '📝', bg: '#fefefe' },
  { id: 'dark', name: 'Blackboard', icon: '🌌', bg: '#18181b' },
] as const;

const NOTE_TAGS = ['🌟 All', '⭐ Pinned', '💡 Idea', '💖 Personal', '🚀 Project', '🎀 Cute', '📌 Urgent'];

export const NotesAndSketchpadArea: React.FC<NotesAndSketchpadAreaProps> = ({
  notes,
  sketches,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes,
  onSaveSketch,
  onDeleteSketch,
  onOpenAttachment,
}) => {
  // Mode: Notes list vs Interactive Sketchpad vs Saved Doodles Gallery
  const [activeTab, setActiveTab] = useState<'notes' | 'sketchpad' | 'gallery'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('🌟 All');

  // Note Modal state
  const [activeModalNote, setActiveModalNote] = useState<NoteItem | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Gallery preview modal
  const [previewSketch, setPreviewSketch] = useState<SketchItem | null>(null);

  // Drag and drop state for notes
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  // ==========================================
  // 🎨 SKETCHPAD CANVAS STATE & LOGIC
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'stamp'>('pen');
  const [brushColor, setBrushColor] = useState('#292524');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [selectedSticker, setSelectedSticker] = useState('⭐');
  const [paperStyle, setPaperStyle] = useState<'cream' | 'grid' | 'dots' | 'ruled' | 'dark'>('cream');
  const [sketchTitle, setSketchTitle] = useState('');

  // Undo / Redo history stacks
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Initialize or redraw canvas background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, style: string) => {
    ctx.save();
    if (style === 'dark') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);

      // Subtle chalk grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 24; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = style === 'cream' ? '#fdfbf7' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      if (style === 'grid') {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
        ctx.lineWidth = 1;
        for (let x = 24; x < width; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 24; y < height; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (style === 'dots') {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
        for (let x = 20; x < width; x += 24) {
          for (let y = 20; y < height; y += 24) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (style === 'ruled') {
        // Red margin line
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(48, 0);
        ctx.lineTo(48, height);
        ctx.stroke();

        // Blue ruled lines
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
        ctx.lineWidth = 1;
        for (let y = 40; y < height; y += 28) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }, []);

  // Save snapshot to history
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory((prev) => [...prev.slice(-20), data]);
    setRedoStack([]);
  }, []);

  // Resize canvas to display size with device pixel ratio
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.min(600, Math.max(380, Math.floor(window.innerHeight * 0.55)));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    drawBackground(ctx, width, height, paperStyle);
    pushHistory();
  }, [paperStyle, drawBackground, pushHistory]);

  useEffect(() => {
    if (activeTab === 'sketchpad') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, initCanvas]);

  // Handle pointer down (mouse, touch, stylus)
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
      ctx.globalAlpha = 1;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * 2.8;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(x, y, (ctx.lineWidth || brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    // Smooth quadratic curve midpoint
    const midX = (lastPointRef.current.x + x) / 2;
    const midY = (lastPointRef.current.y + y) / 2;
    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.restore();
    }
    pushHistory();
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = history[history.length - 1];
    const prev = history[history.length - 2];
    const newHistory = history.slice(0, -1);

    setRedoStack((r) => [...r, current]);
    setHistory(newHistory);

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    img.src = prev;
    playPopSound();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, next]);

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    img.src = next;
    playPopSound();
  };

  const handleClearCanvas = () => {
    if (!window.confirm('Clear your sketch canvas?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.scale(dpr, dpr);
    drawBackground(ctx, rect.width, rect.height, paperStyle);
    ctx.restore();

    pushHistory();
    playPopSound();
  };

  const handleSaveToGallery = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const title = sketchTitle.trim() || `Doodle ${new Date().toLocaleDateString()}`;

    onSaveSketch({
      title,
      dataUrl,
      paperStyle,
      colorTheme: brushColor,
      tag: 'sketch',
    });

    playPopSound();
    triggerPartyPop('stars');
    setActiveTab('gallery');
  };

  const handleDownloadPng = (dataUrl?: string, title?: string) => {
    const canvas = canvasRef.current;
    const url = dataUrl || (canvas ? canvas.toDataURL('image/png') : null);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || sketchTitle || 'orbit-doodle').toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playPopSound();
  };

  const handleAttachSketchToNewNote = (sketchUrl?: string) => {
    const canvas = canvasRef.current;
    const url = sketchUrl || (canvas ? canvas.toDataURL('image/png') : null);
    if (!url) return;

    onAddNote({
      title: sketchTitle.trim() || 'My Cute Doodle 🎨',
      content: 'Jotted on sketchpad with love ✨\n- [ ] Keep creating',
      color: 'peach',
      pinned: true,
      tag: '🎀 Cute',
      drawing: url,
    });

    playPopSound();
    triggerPartyPop('stars');
    setActiveTab('notes');
  };

  // ==========================================
  // 📝 NOTES LIST FILTERING & HANDLERS
  // ==========================================
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Tag filter
        if (selectedTag === '⭐ Pinned' && !n.pinned) return false;
        if (selectedTag !== '🌟 All' && selectedTag !== '⭐ Pinned') {
          if (n.tag !== selectedTag && !n.title.toLowerCase().includes(selectedTag.replace(/^[^\s]+\s/, '').toLowerCase())) {
            return false;
          }
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (n.title || '').toLowerCase().includes(q);
          const matchContent = (n.content || '').toLowerCase().includes(q);
          const matchHighlight = (n.highlight || '').toLowerCase().includes(q);
          const matchTag = (n.tag || '').toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchHighlight && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned notes always float to top
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
      });
  }, [notes, selectedTag, searchQuery]);

  const handleCopyNote = (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    const text = `${note.title}\n${note.highlight ? `[Highlight]: ${note.highlight}\n` : ''}\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    playPopSound();
    triggerPartyPop('single');
    setTimeout(() => setCopiedNoteId(null), 1800);
  };

  const handleTogglePinNote = (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
    });
    playPopSound();
  };

  const handleToggleChecklistLine = (e: React.MouseEvent, note: NoteItem, lineIndex: number) => {
    e.stopPropagation();
    const lines = note.content.split('\n');
    if (!lines[lineIndex]) return;

    if (lines[lineIndex].startsWith('- [ ]')) {
      lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]');
    } else if (lines[lineIndex].startsWith('- [x]')) {
      lines[lineIndex] = lines[lineIndex].replace('- [x]', '- [ ]');
    } else if (lines[lineIndex].startsWith('[ ]')) {
      lines[lineIndex] = lines[lineIndex].replace('[ ]', '[x]');
    } else if (lines[lineIndex].startsWith('[x]')) {
      lines[lineIndex] = lines[lineIndex].replace('[x]', '[ ]');
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString(),
    });
    playPopSound();
    triggerPartyPop('single');
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNoteId(id);
    playPopSound();
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
  };

  const handleDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetNoteId || !onReorderNotes) {
      handleDragEnd();
      return;
    }

    const currentNotes = [...notes];
    const draggedIdx = currentNotes.findIndex((n) => n.id === draggedNoteId);
    const targetIdx = currentNotes.findIndex((n) => n.id === targetNoteId);

    if (draggedIdx === -1 || targetIdx === -1) {
      handleDragEnd();
      return;
    }

    const [moved] = currentNotes.splice(draggedIdx, 1);
    currentNotes.splice(targetIdx, 0, moved);

    onReorderNotes(currentNotes);
    playPopSound();
    triggerPartyPop('single');
    handleDragEnd();
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      {/* 1. TOP HEADER & CUTE MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-surface border border-subtle shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300 flex items-center justify-center text-lg shadow-2xs">
            🎨
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-main flex items-center gap-2">
              <span>Notes & Sketchpad</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent font-bold">
                Cute Studio
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-muted">
              Pastel notes, checklists & freehand doodles synced to cloud
            </p>
          </div>
        </div>

        {/* Mode Segmented Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-sunken border border-subtle self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('notes');
              playPopSound();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-surface text-main shadow-2xs font-extrabold'
                : 'text-muted hover:text-main'
            }`}
          >
            <FileText size={13} className="stroke-[2.2]" />
            <span>Notes ({notes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sketchpad');
              playPopSound();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sketchpad'
                ? 'bg-surface text-main shadow-2xs font-extrabold'
                : 'text-muted hover:text-main'
            }`}
          >
            <PenTool size={13} className="stroke-[2.2]" />
            <span>Sketchpad</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
              playPopSound();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-surface text-main shadow-2xs font-extrabold'
                : 'text-muted hover:text-main'
            }`}
          >
            <ImageIcon size={13} className="stroke-[2.2]" />
            <span>Doodles ({sketches.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MODE 1: PASTEL NOTES (CARDS, CHECKLISTS, STICKERS) */}
      {/* ======================================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Controls Bar: Search + Tag Filters + New Note */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                placeholder="Search notes, checklists, thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-surface border border-subtle text-xs text-main placeholder:text-faint focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint hover:text-main"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sketchpad');
                  playPopSound();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-surface hover:bg-sunken border border-subtle text-xs font-bold text-main shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <span>✏️</span>
                <span>Doodle</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalNote(null);
                  setIsNoteModalOpen(true);
                  playPopSound();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition active:scale-95 cursor-pointer"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Cute Tag Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
            {NOTE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTag(tag);
                  playPopSound();
                }}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-main text-surface shadow-2xs'
                    : 'bg-surface hover:bg-sunken text-muted border border-subtle'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-surface border border-subtle shadow-soft">
              <div className="text-4xl mb-2 select-none">🌸</div>
              <h3 className="font-extrabold text-sm sm:text-base text-main mb-1">
                {searchQuery || selectedTag !== '🌟 All' ? 'No matching notes found' : 'Your cozy note space is empty'}
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                Jot down ideas, checklists, memories, or draw a cute doodle!
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveModalNote(null);
                  setIsNoteModalOpen(true);
                  playPopSound();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-on-accent text-xs font-bold rounded-2xl shadow-soft hover:bg-accent-hover transition active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>Write first note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
              {filteredNotes.map((note) => {
                const isCopied = copiedNoteId === note.id;
                const catToken = getCategoryToken(note.color || 'sage');
                const isDragging = draggedNoteId === note.id;
                const isOver = dragOverNoteId === note.id;

                // Parse content lines for interactive checklists
                const lines = note.content.split('\n');
                const checklistLines = lines
                  .map((line, idx) => ({ line, idx }))
                  .filter(({ line }) =>
                    line.startsWith('- [ ]') ||
                    line.startsWith('- [x]') ||
                    line.startsWith('[ ]') ||
                    line.startsWith('[x]')
                  );

                return (
                  <div
                    key={note.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverNoteId(note.id);
                    }}
                    onDrop={(e) => handleDrop(e, note.id)}
                    onClick={() => {
                      setActiveModalNote(note);
                      setIsNoteModalOpen(true);
                      playPopSound();
                    }}
                    className={`group relative flex flex-col justify-between p-4.5 rounded-3xl border shadow-soft hover:shadow-soft-hover transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                      isDragging
                        ? 'opacity-30 scale-95 border-dashed shadow-inner'
                        : isOver
                        ? 'scale-102 ring-4 ring-ring/40'
                        : 'hover:-translate-y-0.5'
                    }`}
                    style={{
                      backgroundColor: catToken.softVar,
                      color: catToken.textVar,
                      borderColor: 'rgb(var(--border-subtle))',
                    }}
                  >
                    <div>
                      {/* Note Header: Pin ⭐, Title, Drag handle & actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span title="Drag to rearrange" className="shrink-0 cursor-grab active:cursor-grabbing">
                            <GripVertical size={13} className="opacity-35 group-hover:opacity-80 transition" />
                          </span>
                          <h4 className="font-extrabold text-sm leading-tight line-clamp-1 group-hover:underline">
                            {note.title || 'Untitled Note'}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Star/Pin toggle button */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePinNote(e, note)}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              note.pinned ? 'text-amber-500 hover:text-amber-600' : 'opacity-40 hover:opacity-100'
                            }`}
                            title={note.pinned ? 'Unpin note' : 'Pin note to top'}
                          >
                            <Star size={13} className={note.pinned ? 'fill-amber-400' : ''} />
                          </button>

                          {/* Quick Copy */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyNote(e, note)}
                            className="p-1 opacity-50 hover:opacity-100 rounded-lg transition cursor-pointer"
                            title="Copy note text"
                          >
                            {isCopied ? <Check size={13} className="stroke-[3] text-emerald-600" /> : <Copy size={13} />}
                          </button>

                          {/* Delete Note */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                              playPopSound();
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-500 rounded-lg transition cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Tag pill (if assigned) */}
                      {note.tag && (
                        <div className="mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface/80 border border-subtle font-bold inline-flex items-center gap-1 shadow-2xs">
                            {note.tag}
                          </span>
                        </div>
                      )}

                      {/* Embedded Sketch Doodle Thumbnail (if note has drawing) */}
                      {note.drawing && (
                        <div className="mb-2.5 rounded-2xl overflow-hidden border border-subtle bg-white shadow-2xs">
                          <img
                            src={note.drawing}
                            alt="Doodle"
                            className="w-full h-28 object-contain bg-stone-50"
                          />
                        </div>
                      )}

                      {/* Highlight Banner (if exists) */}
                      {note.highlight && (
                        <div className="mb-2 px-2.5 py-1 rounded-xl text-[11px] font-bold line-clamp-1 flex items-center gap-1.5 bg-surface/80 border border-subtle shadow-2xs">
                          <Sparkles size={11} className="text-amber-500 shrink-0" />
                          <span>{note.highlight}</span>
                        </div>
                      )}

                      {/* Interactive Checklist Preview */}
                      {checklistLines.length > 0 ? (
                        <div className="space-y-1 mb-2">
                          {checklistLines.slice(0, 4).map(({ line, idx }) => {
                            const isChecked = line.startsWith('- [x]') || line.startsWith('[x]');
                            const label = line.replace(/^(- \[( |x)\]|\[( |x)\])\s*/, '');
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => handleToggleChecklistLine(e, note, idx)}
                                className="flex items-center gap-1.5 text-left text-xs w-full py-0.5 px-1 rounded-lg hover:bg-surface/60 transition cursor-pointer"
                              >
                                {isChecked ? (
                                  <CheckSquare size={13} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <Square size={13} className="opacity-50 shrink-0" />
                                )}
                                <span className={`line-clamp-1 ${isChecked ? 'line-through opacity-50' : 'font-medium'}`}>
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                          {checklistLines.length > 4 && (
                            <span className="text-[10px] opacity-60 font-bold pl-1">
                              +{checklistLines.length - 4} more checklist items...
                            </span>
                          )}
                        </div>
                      ) : (
                        /* Standard Text Preview */
                        <p className="text-xs opacity-85 leading-relaxed line-clamp-4 whitespace-pre-wrap mb-3 font-normal">
                          {note.content || 'Tap to start writing...'}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata & Attachments count */}
                    <div className="pt-2 border-t border-subtle/60 flex items-center justify-between text-[10px] opacity-65 font-medium">
                      <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        {note.attachments && note.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Paperclip size={10} />
                            <span>{note.attachments.length}</span>
                          </span>
                        )}
                        <span>{note.content.trim().split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODE 2: CUTE DOODLE SKETCHPAD CANVAS */}
      {/* ======================================================== */}
      {activeTab === 'sketchpad' && (
        <div className="space-y-3.5 no-swipe-zone" data-no-swipe="true">
          {/* Sketchpad Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-surface border border-subtle shadow-soft">
            {/* Tool Selection: Pen / Marker / Eraser / Stamp */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-sunken border border-subtle">
              <button
                type="button"
                onClick={() => {
                  setTool('pen');
                  playPopSound();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tool === 'pen' ? 'bg-surface text-main shadow-2xs font-extrabold' : 'text-muted hover:text-main'
                }`}
                title="Pen"
              >
                <PenTool size={13} />
                <span className="hidden sm:inline">Pen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTool('highlighter');
                  playPopSound();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tool === 'highlighter' ? 'bg-surface text-main shadow-2xs font-extrabold' : 'text-muted hover:text-main'
                }`}
                title="Pastel Highlighter"
              >
                <span>🖍️</span>
                <span className="hidden sm:inline">Glow</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTool('eraser');
                  playPopSound();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tool === 'eraser' ? 'bg-surface text-main shadow-2xs font-extrabold' : 'text-muted hover:text-main'
                }`}
                title="Eraser"
              >
                <Eraser size={13} />
                <span className="hidden sm:inline">Eraser</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTool('stamp');
                  playPopSound();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tool === 'stamp' ? 'bg-surface text-main shadow-2xs font-extrabold' : 'text-muted hover:text-main'
                }`}
                title="Cute Stickers & Stamps"
              >
                <span>✨</span>
                <span className="hidden sm:inline">Stamps</span>
              </button>
            </div>

            {/* Brush Size Slider */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-sunken border border-subtle text-xs">
              <span className="text-[11px] font-bold text-muted">Size:</span>
              {[2, 5, 10, 20].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setBrushSize(sz);
                    playPopSound();
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                    brushSize === sz ? 'bg-main text-surface shadow-2xs font-bold' : 'hover:bg-surface text-muted'
                  }`}
                  title={`${sz}px`}
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: `${Math.min(14, sz + 2)}px`, height: `${Math.min(14, sz + 2)}px` }}
                  />
                </button>
              ))}
            </div>

            {/* Paper Background Style */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-muted hidden sm:inline">Paper:</span>
              <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-subtle">
                {PAPER_STYLES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPaperStyle(p.id);
                      playPopSound();
                    }}
                    className={`px-2 py-1 rounded-lg text-xs transition cursor-pointer ${
                      paperStyle === p.id ? 'bg-surface shadow-2xs font-bold' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={p.name}
                  >
                    <span>{p.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Undo / Redo / Clear Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-2 rounded-xl bg-surface hover:bg-sunken disabled:opacity-30 border border-subtle transition cursor-pointer"
                title="Undo"
              >
                <Undo2 size={13} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-xl bg-surface hover:bg-sunken disabled:opacity-30 border border-subtle transition cursor-pointer"
                title="Redo"
              >
                <Redo2 size={13} />
              </button>
              <button
                type="button"
                onClick={handleClearCanvas}
                className="p-2 rounded-xl bg-surface hover:bg-rose-50 hover:text-rose-600 border border-subtle transition cursor-pointer"
                title="Clear Canvas"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Color Palette or Sticker Tray */}
          {tool === 'stamp' ? (
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface border border-subtle overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-muted shrink-0 pl-1">Tap stamp to use:</span>
              {STICKERS.map((stk) => (
                <button
                  key={stk}
                  type="button"
                  onClick={() => {
                    setSelectedSticker(stk);
                    playPopSound();
                  }}
                  className={`text-lg p-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    selectedSticker === stk ? 'bg-accent-soft scale-110 shadow-2xs' : 'hover:bg-sunken'
                  }`}
                >
                  {stk}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 p-2.5 rounded-2xl bg-surface border border-subtle overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-muted shrink-0 pl-1">Ink:</span>
              {PASTEL_PALETTE.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setBrushColor(c.hex);
                    playPopSound();
                  }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer shrink-0 border-2 ${
                    brushColor === c.hex ? 'scale-115 ring-2 ring-ring/60 shadow-md border-white' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer opacity-70 hover:opacity-100 border border-subtle shrink-0"
                title="Custom color"
              />
            </div>
          )}

          {/* Active Canvas Drawing Frame */}
          <div
            className="relative rounded-3xl border border-subtle shadow-soft overflow-hidden select-none touch-none"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full block cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Sketchpad Bottom Bar: Title, Save to Gallery, Export PNG, Convert to Note */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-surface border border-subtle shadow-soft">
            <input
              type="text"
              placeholder="Give your doodle a title (e.g. Starry Night Cat)..."
              value={sketchTitle}
              onChange={(e) => setSketchTitle(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-sunken border border-subtle text-xs text-main placeholder:text-faint focus:outline-hidden focus:ring-2 focus:ring-ring/40"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPng()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-sunken border border-subtle text-xs font-bold text-main transition active:scale-95 cursor-pointer shadow-2xs"
                title="Download PNG image"
              >
                <Download size={13} />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleAttachSketchToNewNote()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200/60 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                title="Create a Note with this Doodle"
              >
                <span>📝</span>
                <span>Send to Note</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToGallery}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition active:scale-95 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Save to Gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODE 3: DOODLES GALLERY */}
      {/* ======================================================== */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">
              {sketches.length} {sketches.length === 1 ? 'drawing' : 'drawings'} saved in your creative sketchbook
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sketchpad');
                playPopSound();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-2xs hover:bg-accent-hover transition active:scale-95 cursor-pointer"
            >
              <Plus size={13} />
              <span>New Doodle</span>
            </button>
          </div>

          {sketches.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-surface border border-subtle shadow-soft">
              <div className="text-4xl mb-2 select-none">🎨</div>
              <h3 className="font-extrabold text-sm sm:text-base text-main mb-1">
                No saved doodles yet
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                Sketch, scribble, or stamp stickers on the sketchpad, then tap "Save to Gallery"!
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sketchpad');
                  playPopSound();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-on-accent text-xs font-bold rounded-2xl shadow-soft hover:bg-accent-hover transition active:scale-95 cursor-pointer"
              >
                <span>✏️</span>
                <span>Open Sketchpad</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {sketches.map((sk) => (
                <div
                  key={sk.id}
                  className="group relative rounded-3xl bg-surface border border-subtle shadow-soft hover:shadow-soft-hover overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer"
                  onClick={() => setPreviewSketch(sk)}
                >
                  <div className="p-2 bg-stone-100 dark:bg-stone-900">
                    <img
                      src={sk.dataUrl}
                      alt={sk.title}
                      className="w-full h-32 sm:h-36 object-contain rounded-2xl bg-white"
                    />
                  </div>

                  <div className="p-3">
                    <h4 className="font-extrabold text-xs text-main truncate group-hover:underline">
                      {sk.title}
                    </h4>
                    <p className="text-[10px] text-muted mt-0.5">
                      {formatDate(sk.updatedAt || sk.createdAt)}
                    </p>

                    <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-subtle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPng(sk.dataUrl, sk.title);
                        }}
                        className="p-1.5 text-muted hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
                        title="Download PNG"
                      >
                        <Download size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAttachSketchToNewNote(sk.dataUrl);
                        }}
                        className="p-1.5 text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition cursor-pointer"
                        title="Make Note from this sketch"
                      >
                        <FileText size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete doodle "${sk.title}"?`)) {
                            onDeleteSketch(sk.id);
                            playPopSound();
                          }
                        }}
                        className="p-1.5 text-muted hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete sketch"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODALS: NOTE EDITOR & SKETCH EXPANDER */}
      {/* ======================================================== */}
      {isNoteModalOpen && (
        <NoteModal
          isOpen={isNoteModalOpen}
          note={activeModalNote}
          onClose={() => {
            setIsNoteModalOpen(false);
            setActiveModalNote(null);
          }}
          onSave={(noteData) => {
            if (activeModalNote) {
              onUpdateNote({
                ...activeModalNote,
                ...noteData,
                updatedAt: new Date().toISOString(),
              } as NoteItem);
            } else {
              onAddNote({
                title: noteData.title || 'Untitled Note',
                content: noteData.content || '',
                highlight: noteData.highlight,
                color: noteData.color || 'sage',
                pinned: Boolean(noteData.pinned),
                tag: noteData.tag || '💡 Idea',
                attachments: noteData.attachments || [],
              });
            }
            setIsNoteModalOpen(false);
            setActiveModalNote(null);
            playPopSound();
          }}
          onDelete={onDeleteNote}
          onOpenAttachment={onOpenAttachment}
        />
      )}

      {/* Full Preview Modal for Saved Sketches */}
      {previewSketch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-main/50 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewSketch(null)}
        >
          <div
            className="w-full max-w-2xl bg-surface rounded-3xl shadow-raised border border-subtle p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-extrabold text-base text-main">{previewSketch.title}</h3>
                <p className="text-[11px] text-muted">{formatDate(previewSketch.updatedAt || previewSketch.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSketch(null)}
                className="p-1.5 text-muted hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-subtle overflow-hidden bg-stone-100 dark:bg-stone-900 p-2 flex items-center justify-center max-h-[60vh]">
              <img
                src={previewSketch.dataUrl}
                alt={previewSketch.title}
                className="max-h-[55vh] w-auto object-contain rounded-xl bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadPng(previewSketch.dataUrl, previewSketch.title)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-sunken border border-subtle text-xs font-bold text-main transition shadow-2xs cursor-pointer"
              >
                <Download size={13} />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAttachSketchToNewNote(previewSketch.dataUrl);
                  setPreviewSketch(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition cursor-pointer"
              >
                <span>📝</span>
                <span>Create Note with this Doodle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
