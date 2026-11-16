import React, { useState, useEffect } from 'react';
import { 
  X, 
  Target, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Download, 
  AlertCircle,
  HelpCircle,
  Sliders,
  CheckSquare
} from 'lucide-react';
import type { TodoItem, PriorityLevel, ProgressMode, SubTask, GoalExtension } from '../types';
import { todayKey, addDays, generateIcsCalendar, diffInDays, toLocalDateKey } from '../utils/dates';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: TodoItem | null;
  onSave: (goalData: Partial<TodoItem>) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSave,
}) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [progressMode, setProgressMode] = useState<ProgressMode>('checklist');
  const [manualProgress, setManualProgress] = useState(0);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [extensionReason, setExtensionReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (goal) {
      setText(goal.text);
      setNotes(goal.notes || '');
      setStartDate(goal.startDate || goal.date || todayKey());
      setEndDate(goal.endDate || '');
      setPriority(goal.priority || 'high');
      setProgressMode(goal.progressMode || 'checklist');
      setManualProgress(goal.progress || 0);
      setSubtasks(goal.subtasks || []);
      setTags(goal.tags || []);
      setIsExtending(false);
      setExtensionReason('');
    } else {
      setText('');
      setNotes('');
      setStartDate(todayKey());
      setEndDate('');
      setPriority('high');
      setProgressMode('checklist');
      setManualProgress(0);
      setSubtasks([]);
      setTags([]);
      setIsExtending(false);
      setExtensionReason('');
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  // Quick deadline chips
  const applyQuickDeadline = (days: number) => {
    const target = addDays(startDate || todayKey(), days);
    setEndDate(target);
    playPopSound();
  };

  const applyEndOfYearDeadline = () => {
    const year = new Date().getFullYear();
    setEndDate(`${year}-12-31`);
    playPopSound();
  };

  // Subtasks
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSt: SubTask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newSubtaskText.trim(),
      done: false,
    };
    setSubtasks([...subtasks, newSt]);
    setNewSubtaskText('');
    playPopSound();
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map((st) =>
      st.id === id ? { ...st, done: !st.done, doneAt: !st.done ? new Date().toISOString() : undefined } : st
    );
    setSubtasks(updated);
    playPopSound();
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
    playPopSound();
  };

  // Tags
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Calculate progress if checklist
    let finalProgress = manualProgress;
    if (progressMode === 'checklist') {
      if (subtasks.length > 0) {
        const done = subtasks.filter((s) => s.done).length;
        finalProgress = Math.round((done / subtasks.length) * 100);
      } else {
        finalProgress = goal?.progress || 0;
      }
    }

    // Handle extension if date changed on existing goal
    let extensions = goal?.extensions || [];
    if (goal && goal.endDate && endDate && goal.endDate !== endDate) {
      const ext: GoalExtension = {
        from: goal.endDate,
        to: endDate,
        reason: extensionReason.trim() || undefined,
        at: new Date().toISOString(),
      };
      extensions = [ext, ...extensions];
    }

    onSave({
      text: text.trim(),
      notes: notes.trim() || undefined,
      startDate: startDate || todayKey(),
      endDate: endDate || undefined,
      priority,
      progressMode,
      progress: finalProgress,
      subtasks,
      tags,
      extensions,
      type: 'permanent',
    });

    triggerPartyPop('single');
    onClose();
  };

  // Export .ics calendar event
  const handleDownloadIcs = () => {
    if (!endDate) return;
    const icsContent = generateIcsCalendar(text || 'Goal Deadline', endDate, notes);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(text || 'goal').toLowerCase().replace(/\s+/g, '-')}-deadline.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playPopSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[92vh] bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Target size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main leading-tight">
                {goal ? 'Edit Permanent Goal' : 'Create Master Goal'}
              </h2>
              <span className="text-[11px] text-muted">
                Track long-term mastery, milestones and deadlines
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="goal-form" onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Goal Title */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1">
              Goal Title <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Master TypeScript and System Design"
              className="w-full text-sm p-3 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring font-medium transition"
            />
          </div>

          {/* 2. Dates & Deadline Section */}
          <div className="p-3.5 rounded-2xl bg-sunken border border-subtle space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-surface border border-border-input text-main focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  End Date / Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-surface border border-border-input text-main focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Quick Chips for Target Deadlines */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-faint uppercase mr-1">Quick Target:</span>
              <button
                type="button"
                onClick={() => applyQuickDeadline(7)}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-sunken border border-subtle text-[11px] font-semibold text-muted transition cursor-pointer"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => applyQuickDeadline(30)}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-sunken border border-subtle text-[11px] font-semibold text-muted transition cursor-pointer"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => applyQuickDeadline(90)}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-sunken border border-subtle text-[11px] font-semibold text-muted transition cursor-pointer"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={applyEndOfYearDeadline}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-sunken border border-subtle text-[11px] font-semibold text-muted transition cursor-pointer"
              >
                End of Year
              </button>
              {endDate && (
                <button
                  type="button"
                  onClick={() => setEndDate('')}
                  className="px-2 py-0.5 rounded-lg text-[11px] text-muted hover:text-danger font-medium transition cursor-pointer"
                >
                  Clear deadline
                </button>
              )}
            </div>

            {/* Add to Calendar (.ics) Download helper */}
            {endDate && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-faint">
                  Sync with your calendar app:
                </span>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-sunken border border-subtle text-[11px] font-bold text-accent transition cursor-pointer"
                >
                  <Download size={11} />
                  <span>Download .ics Event</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Priority & Progress Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted mb-1">
                Priority
              </label>
              <div className="flex items-center p-1 rounded-xl bg-sunken border border-subtle">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPriority(p);
                      playPopSound();
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                      priority === p
                        ? 'bg-surface text-main shadow-2xs font-extrabold'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1">
                Progress Tracking Mode
              </label>
              <div className="flex items-center p-1 rounded-xl bg-sunken border border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setProgressMode('checklist');
                    playPopSound();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    progressMode === 'checklist'
                      ? 'bg-surface text-main shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <CheckSquare size={12} />
                  <span>Subtasks</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProgressMode('manual');
                    playPopSound();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    progressMode === 'manual'
                      ? 'bg-surface text-main shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Sliders size={12} />
                  <span>Manual %</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Manual Progress Slider (if manual mode) */}
          {progressMode === 'manual' && (
            <div className="p-3 rounded-xl bg-sunken border border-subtle space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>Completion Percentage</span>
                <span className="font-mono text-main">{manualProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualProgress}
                onChange={(e) => setManualProgress(parseInt(e.target.value, 10))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          )}

          {/* 5. Subtasks / Milestones Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted">
                Milestones & Subtasks ({subtasks.filter((s) => s.done).length}/{subtasks.length})
              </label>
              {progressMode === 'checklist' && subtasks.length > 0 && (
                <span className="text-[11px] font-mono font-bold text-accent">
                  {Math.round((subtasks.filter((s) => s.done).length / subtasks.length) * 100)}% Auto
                </span>
              )}
            </div>

            {/* Subtask input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
                placeholder="Add a milestone or subtask..."
                className="flex-1 text-xs p-2.5 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="min-h-[38px] px-3.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* List of subtasks */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-sunken border border-subtle text-xs"
                  >
                    <div 
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none"
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition ${
                          st.done
                            ? 'bg-accent border-accent text-on-accent'
                            : 'border-border-input bg-surface'
                        }`}
                      >
                        {st.done && <Check size={11} className="stroke-[3]" />}
                      </div>
                      <span className={`truncate ${st.done ? 'line-through text-faint' : 'text-main font-medium'}`}>
                        {st.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="p-1 text-faint hover:text-danger rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Tags */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface border border-border-input">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sunken text-main text-xs font-medium border border-subtle"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-faint hover:text-main"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "Type tag & press enter (e.g. learning, career)..." : "Add more..."}
                className="flex-1 min-w-[120px] text-xs bg-transparent border-none text-main placeholder:text-faint focus:outline-none"
              />
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1">
              Strategy & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this goal matters, key resources, or motivation..."
              className="w-full text-xs p-2.5 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* 8. Extension History (if goal has been extended) */}
          {goal?.extensions && goal.extensions.length > 0 && (
            <div className="p-3 rounded-xl bg-sunken border border-subtle text-xs space-y-1">
              <span className="font-bold text-muted block">Deadline Extensions History:</span>
              <ul className="space-y-1 text-[11px] text-faint">
                {goal.extensions.map((ext, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>
                      {ext.from} → <strong className="text-main">{ext.to}</strong> {ext.reason && `(${ext.reason})`}
                    </span>
                    <span className="text-[10px]">{new Date(ext.at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        {/* Modal Actions */}
        <div className="p-4 border-t border-subtle bg-sunken/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="goal-form"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} className="stroke-[2.5]" />
            <span>{goal ? 'Update Goal' : 'Create Goal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
