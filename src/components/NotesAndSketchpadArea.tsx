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
  Share2,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import type { NoteItem, SketchItem, Attachment } from '../types';
import { formatDate } from '../utils/urlHelper';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { getCategoryToken, resolveCategoryKey } from '../utils/themeColors';
import { NoteModal } from './NoteModal';
import './notes.css';

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

const STICKERS = ['⭐', '💖', '✨', '🌸', '🐱', '☕', '🍓', '🌈', '🧁', '🍀'];

const PAPER_STYLES = [
  { id: 'cream', name: 'Cream Paper', icon: '📄', bg: '#fdfbf7' },
  { id: 'grid', name: 'Pastel Grid', icon: '📐', bg: '#f9f9fb' },
  { id: 'dots', name: 'Bullet Dots', icon: '🔘', bg: '#f8fafc' },
  { id: 'ruled', name: 'Lined Notebook', icon: '📝', bg: '#fefefe' },
  { id: 'dark', name: 'Blackboard', icon: '🌌', bg: '#18181b' },
] as const;

interface NoteTagConfig {
  id: string;
  label: string;
  bg: string;
  color: string;
  dotColor: string;
}

const TAG_CONFIGS: NoteTagConfig[] = [
  { id: 'all', label: 'All', bg: '#1F2A24', color: '#ffffff', dotColor: '#FFD166' },
  { id: 'pinned', label: 'Pinned', bg: '#FFF1CC', color: '#5E4800', dotColor: '#E6A800' },
  { id: 'idea', label: 'Idea', bg: '#DDF0E5', color: '#1D4D36', dotColor: '#2C5A45' },
  { id: 'personal', label: 'Personal', bg: '#FFE1EA', color: '#7D1B43', dotColor: '#DE3B78' },
  { id: 'project', label: 'Project', bg: '#E9E3FF', color: '#471A8F', dotColor: '#7C3AED' },
  { id: 'cute', label: 'Cute', bg: '#FFE8D6', color: '#8A3D0B', dotColor: '#F97316' },
  { id: 'urgent', label: 'Urgent', bg: '#FFD6D6', color: '#991B1B', dotColor: '#EF4444' },
];

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
  const [selectedTagId, setSelectedTagId] = useState<string>('all');

  // Note Modal & Delete Confirmation state
  const [activeModalNote, setActiveModalNote] = useState<NoteItem | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  // Sketchpad state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [brushColor, setBrushColor] = useState('#2C5A45');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'stamp'>('pen');
  const [selectedSticker, setSelectedSticker] = useState('🌸');
  const [paperStyle, setPaperStyle] = useState<'cream' | 'grid' | 'dots' | 'ruled' | 'dark'>('cream');
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [sketchTitle, setSketchTitle] = useState('');
  const [previewSketch, setPreviewSketch] = useState<SketchItem | null>(null);

  // Resize canvas when switching to sketchpad
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const width = parent.clientWidth;
    const height = Math.min(520, Math.max(380, window.innerHeight * 0.5));

    // Save existing contents if any
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

  useEffect(() => {
    if (activeTab === 'sketchpad') {
      const timer = setTimeout(resizeCanvas, 50);
      window.addEventListener('resize', resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [activeTab, resizeCanvas]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    fillPaperBackground(ctx, canvas.width / dpr, canvas.height / dpr, paperStyle);
    pushHistory();
    playPopSound();
  };

  const handleSaveToGallery = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const title = sketchTitle.trim() || `Cute Doodle #${sketches.length + 1}`;

    onSaveSketch({
      title,
      dataUrl,
      paperStyle,
    });

    playPopSound();
    triggerPartyPop('stars');
    setSketchTitle('');
    setActiveTab('gallery');
  };

  const handleDownloadPng = (customDataUrl?: string, customTitle?: string) => {
    const data = customDataUrl || canvasRef.current?.toDataURL('image/png');
    if (!data) return;
    const a = document.createElement('a');
    a.href = data;
    a.download = `${(customTitle || sketchTitle || 'orbit-doodle').replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
    playPopSound();
  };

  const handleAttachSketchToNewNote = (customDataUrl?: string) => {
    const url = customDataUrl || canvasRef.current?.toDataURL('image/png');
    if (!url) return;

    onAddNote({
      title: sketchTitle.trim() || 'My Cute Doodle 🎨',
      content: 'Jotted on sketchpad with love ✨\n- [ ] Keep creating',
      color: 'peach',
      pinned: true,
      tag: 'Cute',
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
        if (selectedTagId === 'pinned' && !n.pinned) return false;
        if (selectedTagId !== 'all' && selectedTagId !== 'pinned') {
          const config = TAG_CONFIGS.find((c) => c.id === selectedTagId);
          if (config) {
            const tagMatch = (n.tag || '').toLowerCase().includes(config.label.toLowerCase());
            const titleMatch = (n.title || '').toLowerCase().includes(config.label.toLowerCase());
            if (!tagMatch && !titleMatch) return false;
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
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
      });
  }, [notes, selectedTagId, searchQuery]);

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
    <div className="notes-container">
      <div className="wrap space-y-5">
        
        {/* ======================================================== */}
        {/* 1. TOP HEADER CARD (EXACT MATCH TO DESIGN IMAGE)         */}
        {/* ======================================================== */}
        <div className="header-card space-y-4">
          
          {/* Row 1: Logo & Title + Segmented Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            
            {/* Left: Soft pink pencil icon + Title + "Cute Studio" badge */}
            <div className="flex items-center gap-3.5">
              <div 
                className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 shadow-xs"
                style={{ background: '#FFE1EA', color: '#DE3B78' }}
              >
                <Edit3 size={20} className="stroke-[2.2]" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-['Fredoka',sans-serif] font-bold text-2xl text-[#1F2A24] leading-tight">
                    Notes &amp; Sketchpad
                  </h1>
                  <span 
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: '#DDF0E5', color: '#2C5A45' }}
                  >
                    Cute Studio
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#6E7A72] mt-0.5">
                  Pastel notes, checklists &amp; freehand doodles synced to cloud
                </p>
              </div>
            </div>

            {/* Right: Segmented Mode Capsule: [Notes 0] [Sketchpad] [Doodles 0] */}
            <div className="flex items-center p-1 rounded-full bg-[#FFF8ED] border border-[#EFE5CC] shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('notes');
                  playPopSound();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-white text-[#DE3B78] shadow-xs'
                    : 'text-[#6E7A72] hover:text-[#1F2A24]'
                }`}
              >
                Notes {notes.length}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('sketchpad');
                  playPopSound();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sketchpad'
                    ? 'bg-white text-[#DE3B78] shadow-xs'
                    : 'text-[#6E7A72] hover:text-[#1F2A24]'
                }`}
              >
                Sketchpad
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('gallery');
                  playPopSound();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-white text-[#DE3B78] shadow-xs'
                    : 'text-[#6E7A72] hover:text-[#1F2A24]'
                }`}
              >
                Doodles {sketches.length}
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar + Doodle Button + + New Note Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA39C]" />
              <input
                type="text"
                placeholder="Search notes, checklists, thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sketchpad');
                  playPopSound();
                }}
                className="btn-pill"
                style={{ background: '#FFF8ED', borderColor: '#EFE5CC', color: '#1F2A24' }}
              >
                <PenTool size={13} className="text-[#DE3B78]" />
                <span>Doodle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModalNote(null);
                  setIsNoteModalOpen(true);
                  playPopSound();
                }}
                className="btn-pill btn-pill-primary"
              >
                <Plus size={15} className="stroke-[2.8]" />
                <span>New Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Colored Tag Pills with Colored Dots (Matching Image 2) */}
        {activeTab === 'notes' && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 pt-0.5">
            {TAG_CONFIGS.map((t) => {
              const isSelected = selectedTagId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTagId(t.id);
                    playPopSound();
                  }}
                  className="tag-pill"
                  style={{
                    background: t.bg,
                    color: t.color,
                    borderColor: isSelected ? 'transparent' : '#EFE5CC',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)'
                  }}
                >
                  <span className="dot" style={{ background: t.dotColor }} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. MODE 1: NOTES LIST & EMPTY STATE                      */}
        {/* ======================================================== */}
        {activeTab === 'notes' && (
          <div>
            {filteredNotes.length === 0 ? (
              /* Cozy Empty State matching Image 2 */
              <div className="empty-card">
                <div className="text-5xl mb-3 select-none">🌸</div>
                <h3 className="font-['Fredoka',sans-serif] font-bold text-xl text-[#1F2A24] mb-1.5">
                  Your cozy note space is empty
                </h3>
                <p className="text-xs sm:text-[13px] text-[#6E7A72] max-w-sm mx-auto mb-5 leading-relaxed">
                  Jot down ideas, checklists, memories, or draw a cute doodle!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalNote(null);
                    setIsNoteModalOpen(true);
                    playPopSound();
                  }}
                  className="btn-pill btn-pill-primary px-6 py-2.5 text-xs font-bold"
                >
                  <Plus size={14} className="stroke-[2.8]" />
                  <span>Write first note</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => {
                  const isCopied = copiedNoteId === note.id;
                  const catToken = getCategoryToken(note.color || 'sage');
                  const isDragging = draggedNoteId === note.id;
                  const isOver = dragOverNoteId === note.id;

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
                      className={`note-card group relative flex flex-col justify-between cursor-pointer select-none overflow-hidden ${
                        isDragging ? 'opacity-30 scale-95' : isOver ? 'ring-4 ring-[#DE3B78]/40' : ''
                      }`}
                      style={{
                        backgroundColor: catToken.softVar || '#FFF8ED',
                        color: catToken.textVar || '#1F2A24',
                        borderColor: '#EFE5CC',
                      }}
                    >
                      <div>
                        {/* Note Header: Pin ⭐, Title, Drag handle & Actions */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span title="Drag to rearrange" className="shrink-0 cursor-grab active:cursor-grabbing">
                              <GripVertical size={13} className="opacity-35 group-hover:opacity-80 transition" />
                            </span>
                            <h4 className="font-['Fredoka',sans-serif] font-bold text-base leading-tight line-clamp-1 group-hover:text-[#DE3B78] transition-colors">
                              {note.title || 'Untitled Note'}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Pin Button */}
                            <button
                              type="button"
                              onClick={(e) => handleTogglePinNote(e, note)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                note.pinned ? 'text-amber-500 hover:text-amber-600' : 'opacity-40 hover:opacity-100 text-[#1F2A24]'
                              }`}
                              title={note.pinned ? 'Unpin note' : 'Pin note to top'}
                            >
                              <Star size={14} className={note.pinned ? 'fill-amber-400' : ''} />
                            </button>

                            {/* Quick Copy */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyNote(e, note)}
                              className="p-1.5 opacity-50 hover:opacity-100 rounded-lg transition cursor-pointer text-[#1F2A24]"
                              title="Copy note text"
                            >
                              {isCopied ? <Check size={14} className="stroke-[3] text-emerald-600" /> : <Copy size={14} />}
                            </button>

                            {/* Delete Button (Triggers Confirmation) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(note);
                                playPopSound();
                              }}
                              className="p-1.5 opacity-60 hover:opacity-100 hover:text-red-500 rounded-lg transition cursor-pointer text-[#1F2A24]"
                              title="Delete note"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Tag pill (if assigned) */}
                        {note.tag && (
                          <div className="mb-2">
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/80 border border-[#EFE5CC] font-bold inline-flex items-center gap-1 shadow-2xs">
                              {note.tag}
                            </span>
                          </div>
                        )}

                        {/* Embedded Sketch Doodle Thumbnail */}
                        {note.drawing && (
                          <div className="mb-2.5 rounded-2xl overflow-hidden border border-[#EFE5CC] bg-white shadow-2xs">
                            <img
                              src={note.drawing}
                              alt="Doodle"
                              className="w-full h-28 object-contain bg-stone-50"
                            />
                          </div>
                        )}

                        {/* Highlight Banner (if exists) */}
                        {note.highlight && (
                          <div className="mb-2 px-2.5 py-1 rounded-xl text-xs font-bold line-clamp-1 flex items-center gap-1.5 bg-white/80 border border-[#EFE5CC] shadow-2xs">
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
                                  className="flex items-center gap-1.5 text-left text-xs w-full py-0.5 px-1 rounded-lg hover:bg-white/60 transition cursor-pointer"
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
                      <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] opacity-70 font-medium">
                        <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                        <div className="flex items-center gap-2">
                          {note.attachments && note.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Paperclip size={11} />
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
        {/* 3. MODE 2: CUTE DOODLE SKETCHPAD CANVAS                  */}
        {/* ======================================================== */}
        {activeTab === 'sketchpad' && (
          <div className="space-y-3.5 no-swipe-zone" data-no-swipe="true">
            {/* Sketchpad Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 rounded-[24px] bg-white border border-[#EFE5CC] shadow-sm">
              {/* Tool Selection: Pen / Highlighter / Eraser / Stamp */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#FFF8ED] border border-[#EFE5CC]">
                <button
                  type="button"
                  onClick={() => {
                    setTool('pen');
                    playPopSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    tool === 'pen' ? 'bg-white text-[#DE3B78] shadow-xs' : 'text-[#6E7A72] hover:text-[#1F2A24]'
                  }`}
                  title="Pen"
                >
                  <PenTool size={13} />
                  <span>Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTool('highlighter');
                    playPopSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    tool === 'highlighter' ? 'bg-white text-[#DE3B78] shadow-xs' : 'text-[#6E7A72] hover:text-[#1F2A24]'
                  }`}
                  title="Pastel Glow"
                >
                  <span>🖍️</span>
                  <span>Glow</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTool('eraser');
                    playPopSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    tool === 'eraser' ? 'bg-white text-[#DE3B78] shadow-xs' : 'text-[#6E7A72] hover:text-[#1F2A24]'
                  }`}
                  title="Eraser"
                >
                  <Eraser size={13} />
                  <span>Eraser</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTool('stamp');
                    playPopSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    tool === 'stamp' ? 'bg-white text-[#DE3B78] shadow-xs' : 'text-[#6E7A72] hover:text-[#1F2A24]'
                  }`}
                  title="Cute Stamps"
                >
                  <span>✨</span>
                  <span>Stamps</span>
                </button>
              </div>

              {/* Brush Size Slider */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#FFF8ED] border border-[#EFE5CC] text-xs">
                <span className="text-[11px] font-bold text-[#6E7A72]">Size:</span>
                {[2, 5, 10, 20].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setBrushSize(sz);
                      playPopSound();
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                      brushSize === sz ? 'bg-[#1F2A24] text-white shadow-2xs font-bold' : 'hover:bg-white text-[#6E7A72]'
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
                <span className="text-[11px] font-bold text-[#6E7A72] hidden sm:inline">Paper:</span>
                <div className="flex items-center p-0.5 rounded-xl bg-[#FFF8ED] border border-[#EFE5CC]">
                  {PAPER_STYLES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPaperStyle(p.id);
                        playPopSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                        paperStyle === p.id ? 'bg-white shadow-xs font-bold' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={p.name}
                    >
                      <span>{p.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Undo / Redo / Clear Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length <= 1}
                  className="p-2 rounded-xl bg-[#FFF5E5] hover:bg-[#FFE3D2] disabled:opacity-30 border border-[#EFE5CC] transition cursor-pointer"
                  title="Undo"
                >
                  <Undo2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-2 rounded-xl bg-[#FFF5E5] hover:bg-[#FFE3D2] disabled:opacity-30 border border-[#EFE5CC] transition cursor-pointer"
                  title="Redo"
                >
                  <Redo2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="p-2 rounded-xl bg-[#FFF5E5] hover:bg-rose-50 hover:text-rose-600 border border-[#EFE5CC] transition cursor-pointer"
                  title="Clear Canvas"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Color Palette or Sticker Tray */}
            {tool === 'stamp' ? (
              <div className="flex items-center gap-2 p-3 rounded-[20px] bg-white border border-[#EFE5CC] overflow-x-auto scrollbar-none shadow-xs">
                <span className="text-xs font-bold text-[#6E7A72] shrink-0 pl-1">Tap stamp to use:</span>
                {STICKERS.map((stk) => (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => {
                      setSelectedSticker(stk);
                      playPopSound();
                    }}
                    className={`text-xl p-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                      selectedSticker === stk ? 'bg-[#FFE1EA] scale-110 shadow-xs' : 'hover:bg-[#FFF8ED]'
                    }`}
                  >
                    {stk}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 p-3 rounded-[20px] bg-white border border-[#EFE5CC] overflow-x-auto scrollbar-none shadow-xs">
                <span className="text-xs font-bold text-[#6E7A72] shrink-0 pl-1">Ink:</span>
                {PASTEL_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setBrushColor(c.hex);
                      playPopSound();
                    }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer shrink-0 border-2 ${
                      brushColor === c.hex ? 'scale-115 ring-2 ring-[#DE3B78]/50 shadow-md border-white' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer opacity-80 hover:opacity-100 border border-[#EFE5CC] shrink-0"
                  title="Custom color"
                />
              </div>
            )}

            {/* Active Canvas Drawing Frame */}
            <div
              className="relative rounded-[28px] border border-[#EFE5CC] shadow-md overflow-hidden select-none touch-none"
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

            {/* Sketchpad Bottom Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3.5 rounded-[24px] bg-white border border-[#EFE5CC] shadow-sm">
              <input
                type="text"
                placeholder="Give your doodle a title (e.g. Starry Night Cat)..."
                value={sketchTitle}
                onChange={(e) => setSketchTitle(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full bg-[#FFF5E5] border border-[#EFE5CC] text-xs text-[#1F2A24] placeholder:text-[#9AA39C] focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPng()}
                  className="btn-pill"
                >
                  <Download size={13} />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAttachSketchToNewNote()}
                  className="btn-pill btn-pill-rose"
                >
                  <span>📝</span>
                  <span>Send to Note</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToGallery}
                  className="btn-pill btn-pill-primary"
                >
                  <Sparkles size={13} />
                  <span>Save to Gallery</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. MODE 3: DOODLES GALLERY                               */}
        {/* ======================================================== */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-[#6E7A72]">
                {sketches.length} {sketches.length === 1 ? 'drawing' : 'drawings'} saved in your creative sketchbook
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sketchpad');
                  playPopSound();
                }}
                className="btn-pill btn-pill-primary"
              >
                <Plus size={13} />
                <span>New Doodle</span>
              </button>
            </div>

            {sketches.length === 0 ? (
              <div className="empty-card">
                <div className="text-4xl mb-3 select-none">🎨</div>
                <h3 className="font-['Fredoka',sans-serif] font-bold text-lg text-[#1F2A24] mb-1">
                  No saved doodles yet
                </h3>
                <p className="text-xs text-[#6E7A72] max-w-sm mx-auto mb-4">
                  Sketch, scribble, or stamp stickers on the sketchpad, then tap "Save to Gallery"!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('sketchpad');
                    playPopSound();
                  }}
                  className="btn-pill btn-pill-primary"
                >
                  <span>✏️</span>
                  <span>Open Sketchpad</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {sketches.map((sk) => (
                  <div
                    key={sk.id}
                    className="group relative rounded-[24px] bg-white border border-[#EFE5CC] shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer"
                    onClick={() => setPreviewSketch(sk)}
                  >
                    <div className="p-2.5 bg-[#FFF8ED]">
                      <img
                        src={sk.dataUrl}
                        alt={sk.title}
                        className="w-full h-32 sm:h-36 object-contain rounded-2xl bg-white border border-[#EFE5CC]"
                      />
                    </div>

                    <div className="p-3.5">
                      <h4 className="font-['Fredoka',sans-serif] font-bold text-xs sm:text-sm text-[#1F2A24] truncate group-hover:text-[#DE3B78]">
                        {sk.title}
                      </h4>
                      <p className="text-[10px] text-[#6E7A72] mt-0.5">
                        {formatDate(sk.updatedAt || sk.createdAt)}
                      </p>

                      <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-[#EFE5CC]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPng(sk.dataUrl, sk.title);
                          }}
                          className="w-7 h-7 rounded-lg bg-[#FFF5E5] text-[#6E7A72] hover:text-[#1F2A24] flex items-center justify-center transition cursor-pointer"
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
                          className="w-7 h-7 rounded-lg bg-[#FFF5E5] text-[#DE3B78] hover:bg-[#FFE1EA] flex items-center justify-center transition cursor-pointer"
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
                          className="w-7 h-7 rounded-lg bg-[#FFF5E5] text-[#6E7A72] hover:text-red-500 flex items-center justify-center transition cursor-pointer"
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

      </div>

      {/* ======================================================== */}
      {/* 5. MODALS: NOTE EDITOR, PREVIEW & DELETE CONFIRMATION     */}
      {/* ======================================================== */}

      {/* Note Editor Modal */}
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
                tag: noteData.tag || 'Idea',
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

      {/* Delete Note Confirmation Modal */}
      {noteToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setNoteToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-[24px] p-6 border border-[#EFE5CC] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-[#1F2A24]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE1EA] text-[#DE3B78] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-['Fredoka',sans-serif] font-bold text-base leading-tight">Delete Note?</h4>
                <p className="text-xs text-[#6E7A72] mt-0.5">Are you sure you want to remove this note?</p>
              </div>
            </div>

            <p className="text-xs bg-[#FFF8ED] p-3 rounded-xl border border-[#EFE5CC] text-[#1F2A24] font-medium line-clamp-2">
              "{noteToDelete.title || 'Untitled Note'}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E7A72] hover:bg-[#FFF5E5] border border-[#EFE5CC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  onDeleteNote(noteToDelete.id);
                  setNoteToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#DE3B78] hover:bg-[#C22964] text-white shadow-md transition cursor-pointer"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal for Saved Sketches */}
      {previewSketch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewSketch(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-[28px] shadow-2xl border border-[#EFE5CC] p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-[#1F2A24]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EFE5CC] pb-3">
              <div>
                <h3 className="font-['Fredoka',sans-serif] font-bold text-lg text-[#1F2A24]">{previewSketch.title}</h3>
                <p className="text-xs text-[#6E7A72]">{formatDate(previewSketch.updatedAt || previewSketch.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSketch(null)}
                className="p-1.5 text-[#6E7A72] hover:text-[#1F2A24] rounded-xl hover:bg-[#FFF5E5] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-[#EFE5CC] overflow-hidden bg-[#FFF8ED] p-2 flex items-center justify-center max-h-[60vh]">
              <img
                src={previewSketch.dataUrl}
                alt={previewSketch.title}
                className="max-h-[55vh] w-auto object-contain rounded-xl bg-white border border-[#EFE5CC]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadPng(previewSketch.dataUrl, previewSketch.title)}
                className="btn-pill"
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
                className="btn-pill btn-pill-primary"
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
