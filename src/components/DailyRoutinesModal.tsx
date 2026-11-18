import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Calendar,
  Sparkles,
  Check,
  CheckCircle2,
  Sun,
  Lock,
  Tag,
  ArrowRight
} from 'lucide-react';
import type { RoutineItem, RoutineFrequency, PriorityLevel } from '../types/todo';
import { getRoutineFrequencyLabel } from '../utils/routines';
import { playPopSound, triggerPartyPop } from '../utils/delight';
import { todayKey } from '../utils/dates';

interface DailyRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  routines: RoutineItem[];
  onSaveRoutine: (routine: RoutineItem) => void;
  onDeleteRoutine: (id: string) => void;
}

const STARTER_ROUTINES: Omit<RoutineItem, 'id' | 'createdAt'>[] = [
  { text: 'Morning Meditation 🧘', priority: 'high', frequency: 'daily' },
  { text: 'Drink 2L Water 💧', priority: 'medium', frequency: 'daily' },
  { text: 'Read 15 Pages 📖', priority: 'medium', frequency: 'daily' },
  { text: 'Daily Workout & Stretch 💪', priority: 'high', frequency: 'weekdays' },
  { text: 'Review Weekly Goals 🎯', priority: 'high', frequency: 'weekends' },
  { text: 'Evening Gratitude & Journal 🌸', priority: 'low', frequency: 'daily' },
];

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const DailyRoutinesModal: React.FC<DailyRoutinesModalProps> = ({
  isOpen,
  onClose,
  routines,
  onSaveRoutine,
  onDeleteRoutine,
}) => {
  const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [text, setText] = useState('');
  const [frequency, setFrequency] = useState<RoutineFrequency>('daily');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState('');
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setText('');
    setFrequency('daily');
    setPriority('medium');
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setStartDate(todayKey());
    setEndDate('');
    setTagInput('');
    setEditingRoutine(null);
    setIsFormOpen(false);
  };

  const handleOpenEdit = (routine: RoutineItem) => {
    setEditingRoutine(routine);
    setText(routine.text);
    setFrequency(routine.frequency);
    setPriority(routine.priority);
    setDaysOfWeek(routine.daysOfWeek || [1, 2, 3, 4, 5]);
    setStartDate(routine.startDate || todayKey());
    setEndDate(routine.endDate || '');
    setTagInput(routine.tags ? routine.tags.join(', ') : '');
    setIsFormOpen(true);
    playPopSound();
  };

  const handleToggleDay = (day: number) => {
    playPopSound();
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    playPopSound();
    triggerPartyPop('single');

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const routineToSave: RoutineItem = {
      id: editingRoutine ? editingRoutine.id : `routine_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      priority,
      frequency,
      daysOfWeek: frequency === 'custom' || frequency === 'period' ? daysOfWeek : undefined,
      startDate: frequency === 'period' || frequency === 'daily' ? startDate || undefined : undefined,
      endDate: frequency === 'period' || frequency === 'daily' ? endDate || undefined : undefined,
      active: editingRoutine ? editingRoutine.active !== false : true,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: editingRoutine ? editingRoutine.createdAt : new Date().toISOString(),
    };

    onSaveRoutine(routineToSave);
    resetForm();
  };

  const handleAddStarter = (starter: Omit<RoutineItem, 'id' | 'createdAt'>) => {
    playPopSound();
    triggerPartyPop('single');
    const newRoutine: RoutineItem = {
      ...starter,
      id: `routine_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      active: true,
    };
    onSaveRoutine(newRoutine);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface text-main rounded-3xl border border-subtle shadow-raised p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shadow-2xs select-none">
              <RotateCcw size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-main leading-tight flex items-center gap-1.5">
                <span>Fixed Daily Routines</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent font-bold font-mono">
                  Auto-Added
                </span>
              </h2>
              <p className="text-[11px] text-muted font-medium">
                Tasks that automatically appear in your daily to-do list & cannot be deleted there
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-sunken text-muted hover:text-main cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
          
          {/* Action Button: Add New Routine Form Toggle */}
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setIsFormOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-accent text-on-accent font-bold text-xs sm:text-sm shadow-soft hover:bg-accent-hover transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>+ Create Fixed Routine</span>
            </button>
          )}

          {/* Routine Creation/Edit Form */}
          {isFormOpen && (
            <form onSubmit={handleSubmit} className="p-4 bg-sunken rounded-2xl border border-subtle space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-subtle/60 pb-2">
                <span className="text-xs font-black text-main">
                  {editingRoutine ? 'Edit Fixed Routine' : 'Create New Fixed Routine'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-muted hover:text-main cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Task Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  Routine Task Name
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Morning 20m Walk ☀️, Drink 2L Water 💧, Read Book 📖"
                  autoFocus
                  required
                  className="w-full bg-surface border border-subtle rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
                />
              </div>

              {/* Frequency Schedule Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  When should it appear in daily list?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { key: 'daily', label: '☀️ Every Day' },
                    { key: 'weekdays', label: '💼 Mon–Fri' },
                    { key: 'weekends', label: '🌴 Sat–Sun' },
                    { key: 'period', label: '🗓️ Period / Dates' },
                  ].map((freq) => (
                    <button
                      key={freq.key}
                      type="button"
                      onClick={() => {
                        playPopSound();
                        setFrequency(freq.key as RoutineFrequency);
                      }}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer text-[11px] ${
                        frequency === freq.key
                          ? 'bg-accent text-on-accent border-accent shadow-2xs'
                          : 'bg-surface hover:bg-surface/80 text-muted border-subtle'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* If Period or Custom: Date range / Days selector */}
              {frequency === 'period' && (
                <div className="p-3 bg-surface rounded-xl border border-subtle space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-muted block">Active Date Period</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted block mb-0.5">Start Date:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-sunken border border-subtle rounded-lg px-2.5 py-1.5 text-xs text-main font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block mb-0.5">End Date (optional):</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-sunken border border-subtle rounded-lg px-2.5 py-1.5 text-xs text-main font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Priority Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  Priority
                </label>
                <div className="flex items-center gap-1.5">
                  {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        playPopSound();
                        setPriority(p);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer border ${
                        priority === p
                          ? 'bg-accent text-on-accent border-accent shadow-2xs'
                          : 'bg-surface text-muted border-subtle'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle/50">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl bg-surface hover:bg-subtle text-xs font-bold text-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  {editingRoutine ? 'Update Routine' : '+ Save Fixed Routine'}
                </button>
              </div>
            </form>
          )}

          {/* Active Routines List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block px-1">
              Your Fixed Routines ({routines.length})
            </span>

            {routines.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-2xl bg-sunken/40 border border-subtle/60 text-muted space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center mx-auto text-lg shadow-2xs">
                  🌱
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-main">No fixed routines added yet</p>
                  <p className="text-[11px] text-faint max-w-xs mx-auto">
                    Fixed routines automatically appear in your daily to-do list every morning so you never forget your key habits!
                  </p>
                </div>

                {/* 1-Tap Starter Routine Chips */}
                <div className="space-y-1.5 pt-2 border-t border-subtle/40">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    Quick 1-Tap Starters:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {STARTER_ROUTINES.map((st) => (
                      <button
                        key={st.text}
                        type="button"
                        onClick={() => handleAddStarter(st)}
                        className="px-2.5 py-1 rounded-xl bg-surface hover:bg-sunken border border-subtle text-[11px] font-semibold text-main transition active:scale-95 shadow-2xs cursor-pointer"
                      >
                        + {st.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {routines.map((routine) => {
                  const label = getRoutineFrequencyLabel(routine);
                  const isActive = routine.active !== false;

                  return (
                    <div
                      key={routine.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-surface border-subtle shadow-2xs hover:border-strong'
                          : 'bg-sunken/40 border-subtle/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                          <RotateCcw size={13} className="stroke-[2.5]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-main' : 'text-muted line-through'}`}>
                            {routine.text}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sunken text-muted font-bold">
                              {label}
                            </span>
                            <span className="text-[10px] font-mono capitalize text-muted">
                              {routine.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Active Toggle, Edit, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle active / pause */}
                        <button
                          type="button"
                          onClick={() => {
                            playPopSound();
                            onSaveRoutine({
                              ...routine,
                              active: !isActive,
                            });
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-sunken text-muted'
                          }`}
                          title={isActive ? 'Active (Click to pause)' : 'Paused (Click to activate)'}
                        >
                          {isActive ? 'Active' : 'Paused'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(routine)}
                          className="p-1.5 rounded-lg hover:bg-sunken text-muted hover:text-main cursor-pointer"
                          title="Edit Routine"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete fixed routine "${routine.text}"? It will stop being added to future daily lists.`)) {
                              playPopSound();
                              onDeleteRoutine(routine.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 cursor-pointer"
                          title="Delete Routine"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs text-muted shrink-0">
          <span className="flex items-center gap-1">
            <Lock size={12} className="text-accent" />
            <span>Protected from daily deletion</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sunken hover:bg-surface border border-subtle font-bold text-main cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
