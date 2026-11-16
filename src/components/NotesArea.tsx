import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Paperclip, 
  GripVertical,
  FileText,
  Lightbulb
} from 'lucide-react';
import type { NoteItem, Attachment } from '../types';
import { formatDate } from '../utils/urlHelper';
import { NoteModal } from './NoteModal';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { getCategoryToken } from '../utils/themeColors';

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
        color: noteData.color || 'sage',
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
          <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
            <FileText size={17} className="stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-main">
            Scratchpad & Notes
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-sunken text-muted border border-subtle font-mono font-bold">
            {notes.length}
          </span>
          <span className="hidden sm:inline text-xs text-faint font-medium">
            • Drag cards to arrange freely
          </span>
        </div>

        <button
          onClick={handleOpenNewNote}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-surface hover:bg-sunken border border-input text-xs font-bold text-main shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Write Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-surface border border-subtle shadow-soft">
          <p className="text-sm font-bold text-main mb-1">
            No notes saved yet
          </p>
          <p className="text-xs text-muted mb-3">
            Jot down thoughts, ideas, or quick memos in relaxing cards with full attachments & highlights!
          </p>
          <button
            onClick={handleOpenNewNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold rounded-2xl shadow-soft transition active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Create first note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {notes.map((note) => {
            const isCopied = copiedId === note.id;
            const catToken = getCategoryToken(note.color);
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
                className={`group relative flex flex-col justify-between p-5 rounded-3xl border shadow-soft hover:shadow-soft-hover transition-all duration-300 ease-out min-h-[210px] cursor-pointer select-none overflow-hidden ${
                  isDraggingThis
                    ? 'opacity-35 scale-95 border-dashed shadow-inner'
                    : isOverThis
                    ? 'scale-102 ring-4 ring-ring/40 shadow-raised'
                    : 'hover:-translate-y-1'
                }`}
                style={{
                  backgroundColor: catToken.softVar,
                  color: catToken.textVar,
                  borderColor: 'rgb(var(--border-subtle))',
                }}
              >
                {/* Top: Headline & Controls */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span title="Drag to rearrange" className="shrink-0 cursor-grab active:cursor-grabbing">
                        <GripVertical 
                          size={14} 
                          className="opacity-40 group-hover:opacity-80 transition-opacity" 
                        />
                      </span>
                      <h4 className="font-extrabold text-sm leading-tight line-clamp-1 group-hover:underline">
                        {note.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {note.pinned && (
                        <span className="text-accent text-xs" title="Pinned note">
                          ⭐
                        </span>
                      )}
                      <button
                        onClick={(e) => handleCopyNote(e, note)}
                        className="p-1 opacity-60 hover:opacity-100 rounded-lg transition cursor-pointer"
                        title="Copy note"
                      >
                        {isCopied ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-danger rounded-lg transition cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Key Highlight Banner (if exists) */}
                  {note.highlight && (
                    <div 
                      className="mb-2 px-2.5 py-1 rounded-xl text-[11px] font-bold line-clamp-1 flex items-center gap-1.5 border shadow-2xs"
                      style={{
                        backgroundColor: 'rgb(var(--surface))',
                        color: 'rgb(var(--text-main))',
                        borderColor: 'rgb(var(--border-subtle))',
                      }}
                    >
                      <Lightbulb size={13} className="shrink-0 stroke-[2.5] text-accent" />
                      <span className="truncate">{note.highlight}</span>
                    </div>
                  )}

                  {/* Paragraph Snippet */}
                  <p className="text-xs leading-relaxed whitespace-pre-line line-clamp-3 opacity-90 font-normal">
                    {note.content}
                  </p>
                </div>

                {/* Footer: Attachments badge + Date */}
                <div className="pt-2.5 mt-auto border-t border-subtle flex items-center justify-between text-[10px] opacity-80">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(note.updatedAt)}</span>
                    {note.attachments && note.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface border border-subtle text-[9px] font-bold">
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
