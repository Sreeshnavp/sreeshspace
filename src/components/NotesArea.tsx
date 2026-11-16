import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Star, 
  Copy, 
  Check, 
  Paperclip, 
  Sparkles,
  Maximize2,
  GripVertical,
  FileText,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import type { NoteItem, Attachment } from '../types';
import { formatDate } from '../utils/urlHelper';
import { NoteModal } from './NoteModal';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { getConcentratedNoteTheme } from '../utils/themeColors';

interface NotesAreaProps {
  notes: NoteItem[];
  onAddNote: (note: { title: string; content: string; highlight?: string; color: string; pinned: boolean; attachments?: Attachment[] }) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onOpenAttachment?: (attachment: Attachment) => void;
  onReorderNotes?: (reordered: NoteItem[]) => void;
}

export const NotesArea: React.FC<NotesAreaProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onOpenAttachment,
  onReorderNotes,
}) => {
  const [activeModalNote, setActiveModalNote] = useState<NoteItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Liquid drag and drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  const handleOpenNewNote = () => {
    setActiveModalNote(null);
    setIsModalOpen(true);
    playPopSound();
  };

  const handleOpenEditNote = (note: NoteItem) => {
    setActiveModalNote(note);
    setIsModalOpen(true);
    playPopSound();
  };

  const handleSaveModal = (noteData: Partial<NoteItem>) => {
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
        color: noteData.color || '#f0f7f3',
        pinned: Boolean(noteData.pinned),
        attachments: noteData.attachments || [],
      });
    }
  };

  const handleCopyNote = (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    const text = `${note.title}\n${note.highlight ? `[Highlight]: ${note.highlight}\n` : ''}\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    triggerPartyPop('single');
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Drag and drop handlers
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

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedNoteId && draggedNoteId !== id) {
      setDragOverNoteId(id);
    }
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
    <div className="space-y-4 pt-2">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sage-100 dark:bg-emerald-950/80 flex items-center justify-center text-sage-600 dark:text-emerald-400">
            <FileText size={17} className="stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-espresso-900 dark:text-cream-50">
            Scratchpad & Notes
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cream-200 dark:bg-espresso-800 text-espresso-800/70 dark:text-cream-100/70 font-mono font-bold">
            {notes.length}
          </span>
          <span className="hidden sm:inline text-xs text-espresso-800/40 dark:text-cream-100/40 font-medium">
            • Drag cards to arrange freely
          </span>
        </div>

        <button
          onClick={handleOpenNewNote}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-espresso-850 hover:bg-cream-100 dark:hover:bg-espresso-800 border border-cream-300 dark:border-espresso-750 text-xs font-bold text-sage-700 dark:text-emerald-300 shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Write Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white/90 dark:bg-espresso-850/90 border border-cream-300 dark:border-espresso-800 shadow-soft">
          <p className="text-sm font-bold text-espresso-900 dark:text-cream-50 mb-1">
            No notes saved yet
          </p>
          <p className="text-xs text-espresso-800/50 dark:text-cream-100/50 mb-3">
            Jot down thoughts, ideas, or quick memos in relaxing cards with full attachments & highlights!
          </p>
          <button
            onClick={handleOpenNewNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-500 text-white text-xs font-bold rounded-2xl shadow-pill transition active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Create first note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {notes.map((note) => {
            const isCopied = copiedId === note.id;
            const theme = getConcentratedNoteTheme(note.color);
            const isDraggingThis = draggedNoteId === note.id;
            const isOverThis = dragOverNoteId === note.id;

            return (
              <div
                key={note.id}
                draggable
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, note.id)}
                onDrop={(e) => handleDrop(e, note.id)}
                onClick={() => handleOpenEditNote(note)}
                className={`group relative flex flex-col justify-between p-5 rounded-3xl border shadow-soft hover:shadow-soft-hover transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[210px] cursor-pointer select-none overflow-hidden ${
                  isDraggingThis
                    ? 'opacity-35 scale-95 border-dashed shadow-inner'
                    : isOverThis
                    ? 'scale-102 ring-4 ring-sage-400/50 dark:ring-emerald-400/50 shadow-xl'
                    : 'hover:-translate-y-1'
                }`}
                style={{
                  // Dynamic concentrated dark mode & light mode variables
                  backgroundColor: 'var(--note-bg)',
                  borderColor: 'var(--note-border)',
                  color: 'var(--note-text)',
                } as any}
              >
                {/* Embedded CSS variable for concentrated dark mode theme */}
                <style>{`
                  #note-card-${note.id} {
                    --note-bg: ${theme.lightBg};
                    --note-border: ${theme.lightBorder};
                    --note-text: ${theme.lightText};
                  }
                  .dark #note-card-${note.id} {
                    --note-bg: ${theme.darkBg};
                    --note-border: ${theme.darkBorder};
                    --note-text: ${theme.darkText};
                  }
                `}</style>
                <div id={`note-card-${note.id}`} className="contents">
                  
                  {/* Top: Headline & Controls */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span title="Drag to rearrange" className="shrink-0 cursor-grab active:cursor-grabbing">
                          <GripVertical 
                            size={14} 
                            className="opacity-30 group-hover:opacity-70 transition-opacity" 
                          />
                        </span>
                        <h4 className="font-black text-sm leading-tight line-clamp-1 group-hover:underline">
                          {note.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {note.pinned && (
                          <span className="text-amber-500 text-xs" title="Pinned note">
                            ⭐
                          </span>
                        )}
                        <button
                          onClick={(e) => handleCopyNote(e, note)}
                          className="p-1 opacity-50 hover:opacity-100 rounded-lg transition"
                          title="Copy note"
                        >
                          {isCopied ? <Check size={13} className="text-emerald-500 stroke-[3]" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-lg transition"
                          title="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Key Highlight Banner (if exists) */}
                    {note.highlight && (
                      <div 
                        className="mb-2 px-2.5 py-1 rounded-xl text-[11px] font-bold line-clamp-1 flex items-center gap-1.5 border shadow-xs"
                        style={{
                          backgroundColor: 'var(--highlight-bg)',
                          color: 'var(--highlight-text)',
                          borderColor: 'var(--highlight-border)',
                        } as any}
                      >
                        <style>{`
                          #note-highlight-${note.id} {
                            --highlight-bg: ${theme.lightHighlightBg};
                            --highlight-text: ${theme.lightHighlightText};
                            --highlight-border: ${theme.lightBorder};
                          }
                          .dark #note-highlight-${note.id} {
                            --highlight-bg: ${theme.darkHighlightBg};
                            --highlight-text: ${theme.darkHighlightText};
                            --highlight-border: ${theme.darkBorder};
                          }
                        `}</style>
                        <span id={`note-highlight-${note.id}`} className="contents">
                          <Lightbulb size={13} className="shrink-0 stroke-[2.5]" />
                          <span className="truncate">{note.highlight}</span>
                        </span>
                      </div>
                    )}

                    {/* Paragraph Snippet */}
                    <p className="text-xs leading-relaxed whitespace-pre-line line-clamp-3 opacity-80 font-normal">
                      {note.content}
                    </p>
                  </div>

                  {/* Footer: Attachments badge + Date */}
                  <div className="pt-2.5 mt-auto border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] opacity-70">
                    <div className="flex items-center gap-2">
                      <span>{formatDate(note.updatedAt)}</span>
                      {note.attachments && note.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold">
                          <Paperclip size={9} />
                          <span>{note.attachments.length}</span>
                        </span>
                      )}
                    </div>

                    <span className="font-extrabold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>View</span>
                      <span>&rarr;</span>
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP NOTE MODAL */}
      <NoteModal
        isOpen={isModalOpen}
        note={activeModalNote}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        onDelete={activeModalNote ? onDeleteNote : undefined}
        onOpenAttachment={onOpenAttachment}
      />

    </div>
  );
};
