import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import './habits.css';
import type { 
  TodoItem, 
  DayLog, 
  ActivityEvent, 
  StreakState, 
  RoutineItem 
} from '../../types';
import avatarImg from '../../assets/avatar.jpg';

export interface HabitsDashboardProps {
  todos: TodoItem[];
  routines?: RoutineItem[];
  streakState?: StreakState;
  events?: ActivityEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayLogs: Record<string, DayLog>;
  onSaveDayLog: (dateKey: string, updates: Partial<DayLog>) => void;
  onAddTodo: (text: string, type: 'daily' | 'permanent', priority: 'low' | 'medium' | 'high', dateKey?: string, tags?: string[]) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onArchiveCompletedDaily?: (dateKey: string) => void;
  onArchiveCompletedPermanent?: () => void;
  onSaveRoutine?: (routine: RoutineItem) => void;
  onDeleteRoutine?: (id: string) => void;
  onOpenCreateGoal?: () => void;
  onOpenEditGoal?: (goal: TodoItem) => void;
  onOpenInsights?: () => void;
  onOpenWeeklyReview?: () => void;
}

interface HabitReward {
  id: string;
  n: string;
  p: number;
  c?: string;
}

const HABITS_STORAGE_KEY = 'orbit-habits-v1';

export const HabitsDashboard: React.FC<HabitsDashboardProps> = ({
  todos = [],
  routines = [],
  selectedDate,
  onSelectDate,
  dayLogs = {},
  onSaveDayLog,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onArchiveCompletedDaily,
  onSaveRoutine,
  onDeleteRoutine,
  onOpenEditGoal,
  onOpenInsights,
  onOpenWeeklyReview,
}) => {
  const TODAY = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Local persistent orbit state (score, claim records, rewards, point settings)
  const [orbitData, setOrbitData] = useState<{
    score: number;
    cl: { d: Record<string, number>; m: Record<number, number> };
    rewards: HabitReward[];
  }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HABITS_STORAGE_KEY) || '{}');
      return {
        score: typeof saved.score === 'number' ? saved.score : 830,
        cl: saved.cl || { d: {}, m: {} },
        rewards: Array.isArray(saved.rewards) && saved.rewards.length > 0 
          ? saved.rewards 
          : [
              { id: 'r1', n: 'Sunset Lo-Fi Theme 🎨', p: 500 },
              { id: 'r2', n: 'Matcha Latte Break 🍵', p: 300, c: TODAY },
              { id: 'r3', n: '1 Hr Game Break 🎮', p: 250 }
            ],
      };
    } catch {
      return {
        score: 830,
        cl: { d: {}, m: {} },
        rewards: [
          { id: 'r1', n: 'Sunset Lo-Fi Theme 🎨', p: 500 },
          { id: 'r2', n: 'Matcha Latte Break 🍵', p: 300, c: TODAY },
          { id: 'r3', n: '1 Hr Game Break 🎮', p: 250 }
        ],
      };
    }
  });

  const saveOrbitData = (updates: Partial<typeof orbitData>) => {
    setOrbitData((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'daily' | 'routine'>('daily');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [claimedBonus, setClaimedBonus] = useState(false);
  const [bonusToast, setBonusToast] = useState(false);

  // Sound & confetti delight helper
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6B38D4', '#006C49', '#DE3B78', '#F59E0B', '#D1FAE5']
      });
    } catch {}
  };

  // Pure Streak Calculation
  const { curStreak, isTodayActive, activeDatesSet } = useMemo(() => {
    const activeDates = new Set<string>();

    todos.forEach((t) => {
      if (t.completed && (t.type === 'daily' || !t.type) && t.status !== 'archived') {
        const d = t.completedAt?.slice(0, 10) || t.date || t.createdAt.slice(0, 10);
        if (d) activeDates.add(d);
      }
    });

    Object.entries(dayLogs).forEach(([k, log]) => {
      if (log.completed && log.completed > 0) {
        activeDates.add(k);
      }
    });

    const isTodayActive = activeDates.has(TODAY);

    let cur = 0;
    let checkDate = TODAY;
    if (!isTodayActive) {
      const yesterday = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
      checkDate = yesterday;
    }

    while (activeDates.has(checkDate)) {
      cur++;
      const [y, m, d] = checkDate.split('-').map(Number);
      checkDate = new Date(y, m - 1, d - 1).toLocaleDateString('en-CA');
    }

    return {
      curStreak: cur,
      isTodayActive,
      activeDatesSet: activeDates
    };
  }, [TODAY, todos, dayLogs]);

  // Daily Tasks
  const dailyTodos = useMemo(() => {
    return todos.filter(
      (t) => (t.type === 'daily' || !t.type) && 
             t.status !== 'archived' && 
             (t.date === selectedDate || t.createdAt.slice(0, 10) === selectedDate)
    );
  }, [todos, selectedDate]);

  // Combined routines + tasks
  const combinedTasks = useMemo(() => {
    const routineTasks = routines.map((r) => {
      const matched = dailyTodos.find((t) => t.recurringId === r.id);
      return {
        id: matched?.id || `virtual-${r.id}`,
        routineId: r.id,
        text: r.text,
        priority: r.priority || 'medium',
        completed: Boolean(matched?.completed),
        isRoutine: true,
        tag: 'Daily Routine'
      };
    });

    const standalone = dailyTodos
      .filter((t) => !t.recurringId)
      .map((t) => ({
        id: t.id,
        routineId: undefined,
        text: t.text,
        priority: t.priority || 'medium',
        completed: Boolean(t.completed),
        isRoutine: false,
        tag: t.tags?.[0] || 'Task'
      }));

    return [...routineTasks, ...standalone];
  }, [routines, dailyTodos]);

  const doneTasksCount = combinedTasks.filter((t) => t.completed).length;
  const totalTasksCount = combinedTasks.length || 4; // default base of 4 rituals
  const focusPercent = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;
  const progressOffset = 175.9 - (175.9 * (focusPercent / 100));

  // Consistency rate
  const consistencyRate = useMemo(() => {
    let activeDays = 0;
    const now = new Date(TODAY);
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toLocaleDateString('en-CA');
      if (activeDatesSet.has(d)) {
        activeDays++;
      }
    }
    return Math.round((activeDays / 30) * 100);
  }, [TODAY, activeDatesSet]);

  // Built-in Habits cards (Water, Pages, Code, Meditation)
  const defaultHabits = [
    {
      id: 'h-water',
      title: 'Drink 2.5L Water',
      detail: 'Hydrated & glowing · 8 glasses logged',
      emoji: '💧',
      badge: '8/8 done',
      bg: 'bg-[#D1FAE5]/80 text-[#005236]',
      iconBg: 'bg-white text-[#006C49]',
      btnBg: 'bg-[#006C49] text-white',
      watermark: 'water_drop',
      completed: true
    },
    {
      id: 'h-read',
      title: 'Read 20 pages',
      detail: 'Atomic Habits · page 84-104',
      emoji: '📖',
      badge: 'Ch. 4',
      bg: 'bg-[#EDE9FE]/80 text-[#5516BE]',
      iconBg: 'bg-white text-[#6B38D4]',
      btnBg: 'bg-[#6B38D4] text-white',
      watermark: 'menu_book',
      completed: true
    },
    {
      id: 'h-code',
      title: 'Code for 1 hour',
      detail: 'SreeshSpace Personal App Project',
      emoji: '💻',
      badge: '62 mins',
      bg: 'bg-[#E0F2FE]/80 text-[#0284C7]',
      iconBg: 'bg-white text-[#0284C7]',
      btnBg: 'bg-[#0284C7] text-white',
      watermark: 'terminal',
      completed: true
    },
    {
      id: 'h-meditate',
      title: '10m Meditation',
      detail: 'Pending for evening unwind session',
      emoji: '🧘',
      badge: '✨ Pending',
      bg: 'bg-[#FFE4E6]/90 text-[#92002A]',
      iconBg: 'bg-white text-[#B90538]',
      btnBg: 'bg-white text-[#B90538] border border-rose-200',
      watermark: 'self_improvement',
      completed: false
    }
  ];

  const [habitsState, setHabitsState] = useState(defaultHabits);

  const handleToggleDefaultHabit = (id: string) => {
    setHabitsState((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const next = !h.completed;
          if (next) triggerCelebration();
          return {
            ...h,
            completed: next,
            badge: next ? 'Completed!' : '✨ Pending',
            btnBg: next ? 'bg-[#6B38D4] text-white' : 'bg-white text-stone-600 border border-stone-200'
          };
        }
        return h;
      })
    );
  };

  // Add task handler
  const handleAddTask = () => {
    const text = newTaskInput.trim();
    if (!text) return;

    if (addMode === 'routine' && onSaveRoutine) {
      onSaveRoutine({
        id: 'routine-' + Date.now(),
        text,
        priority: newTaskPriority,
        frequency: 'daily',
        startDate: selectedDate,
        createdAt: new Date().toISOString()
      });
    } else {
      onAddTodo(text, 'daily', newTaskPriority, selectedDate);
    }

    setNewTaskInput('');
    setIsAddModalOpen(false);
    triggerCelebration();
  };

  // Claim streak bonus
  const handleClaimStreakBonus = () => {
    if (claimedBonus) return;
    setClaimedBonus(true);
    saveOrbitData({ score: orbitData.score + 50 });
    setBonusToast(true);
    triggerCelebration();
    setTimeout(() => setBonusToast(false), 3500);
  };

  return (
    <div className="bg-[#FAF8F4] font-['Plus_Jakarta_Sans',sans-serif] text-[#1D1B19] antialiased min-h-screen pb-28">
      <div className="max-w-lg mx-auto px-4 sm:px-6 space-y-5 pt-3">
        
        {/* ======================================================== */}
        {/* 1. GAMIFIED PROGRESS HERO CARD                            */}
        {/* ======================================================== */}
        <section className="relative overflow-hidden bg-white rounded-3xl p-5 shadow-sm border border-stone-200/70">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#D1FAE5]/60 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#EDE9FE]/70 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex flex-col space-y-1">
              <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#00714D]">
                <span className="text-xs">🌱</span>
                <span className="text-[11px] font-bold uppercase tracking-wider">Growing Daily</span>
              </div>
              
              <h2 className="font-['Fraunces',serif] font-bold text-2xl text-[#1D1B19] leading-tight">
                You're glowing!
              </h2>

              <div className="inline-flex items-center gap-1 text-[#F59E0B] text-xs font-semibold">
                <span>🔥</span>
                <span className="text-[#1D1B19] font-bold">{curStreak > 0 ? curStreak : 5} Day Streak</span>
                <span className="text-stone-500 font-normal">· Keep it up!</span>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle className="text-stone-100" cx="36" cy="36" fill="none" r="28" stroke="currentColor" strokeWidth="6.5" />
                <circle 
                  className="text-[#006C49] transition-all duration-700 ease-out" 
                  cx="36" 
                  cy="36" 
                  fill="none" 
                  r="28" 
                  stroke="currentColor" 
                  strokeDasharray="175.9" 
                  strokeDashoffset={progressOffset} 
                  strokeLinecap="round" 
                  strokeWidth="6.5" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-['Fraunces',serif] font-bold text-base text-[#1D1B19] leading-none">
                  {focusPercent > 0 ? `${focusPercent}%` : '75%'}
                </span>
                <span className="text-[10px] text-stone-500 mt-0.5 font-medium">
                  {doneTasksCount}/{totalTasksCount} Done
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Micro-sticker */}
          <div className="mt-4 pt-2 flex items-center justify-between bg-stone-50 px-3.5 py-2.5 rounded-2xl border border-stone-200/60">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <p className="text-xs text-stone-600">
                {totalTasksCount - doneTasksCount > 0 
                  ? 'One tiny ritual left to complete your gold ring!' 
                  : 'Gold ring complete! You rock! 🎉'}
              </p>
            </div>
            <span className="text-xs font-bold text-[#6B38D4]">
              {totalTasksCount - doneTasksCount > 0 ? `${totalTasksCount - doneTasksCount} left` : '100% ✨'}
            </span>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. WEEK AT A GLANCE MINI CALENDAR PILLS                   */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/70">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-stone-600">Week 28 · Habit Journey</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#006C49] bg-[#D1FAE5] px-2.5 py-0.5 rounded-full font-bold">
              <span>★</span> 100% on Mon–Thu
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {/* Mon */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-[#D1FAE5]/70 text-[#00714D]">
              <span className="text-[11px] font-bold">M</span>
              <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
            </div>
            {/* Tue */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-[#D1FAE5]/70 text-[#00714D]">
              <span className="text-[11px] font-bold">T</span>
              <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
            </div>
            {/* Wed */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-[#D1FAE5]/70 text-[#00714D]">
              <span className="text-[11px] font-bold">W</span>
              <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
            </div>
            {/* Thu */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-[#D1FAE5]/70 text-[#00714D]">
              <span className="text-[11px] font-bold">T</span>
              <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
            </div>
            {/* Fri (Active Today) */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-[#6B38D4] text-white shadow-sm scale-105 transition-transform">
              <span className="text-[11px] font-bold text-[#E9DDFF]">FRI</span>
              <span className="text-[13px] mt-1 font-bold">🌟</span>
            </div>
            {/* Sat */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-stone-100 text-stone-400">
              <span className="text-[11px] font-bold">S</span>
              <span className="text-xs mt-1">•</span>
            </div>
            {/* Sun */}
            <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-stone-100 text-stone-400">
              <span className="text-[11px] font-bold">S</span>
              <span className="text-xs mt-1">•</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. DAILY HABITS (WATER, PAGES, CODE, MEDITATION)          */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Daily Habits</h3>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-bold">
                {habitsState.length} Routines
              </span>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-[#6B38D4] hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>+ Add Habit</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {habitsState.map((habit) => (
              <div 
                key={habit.id}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 shadow-sm border border-stone-200/60 ${habit.bg}`}
              >
                {/* Watermark Icon */}
                <div className="absolute -right-3 -bottom-4 opacity-15 pointer-events-none select-none">
                  <span className="material-symbols-outlined text-[80px]">{habit.watermark}</span>
                </div>

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${habit.iconBg}`}>
                      <span className="text-xl">{habit.emoji}</span>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-['Fraunces',serif] font-bold text-base truncate">
                          {habit.title}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/80 font-bold text-[10px] shadow-2xs">
                          {habit.badge}
                        </span>
                      </div>
                      <span className="text-xs opacity-80 truncate mt-0.5">
                        {habit.detail}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Checkmark */}
                  <button 
                    onClick={() => handleToggleDefaultHabit(habit.id)}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-all ${habit.btnBg}`}
                    title={habit.completed ? 'Mark pending' : 'Mark done'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {habit.completed ? 'check' : 'radio_button_unchecked'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. TODAY'S PRIORITIES                                    */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Today's Priorities</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#F59E0B] text-xs font-bold">
                {combinedTasks.filter(t => !t.completed).length} Remaining
              </span>
            </div>
            {onArchiveCompletedDaily && (
              <button 
                onClick={() => onArchiveCompletedDaily(selectedDate)}
                className="text-stone-500 text-xs hover:text-[#6B38D4] font-semibold transition-colors"
              >
                Clear Done
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Task 1: High Priority */}
            <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl shadow-sm border border-stone-200/60 transition-all">
              <button 
                onClick={() => triggerCelebration()}
                className="mt-0.5 w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 active:scale-95 shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">done</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#B90538] font-bold">
                    🌸 High Priority
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">schedule</span> 4:00 PM
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#1D1B19] leading-snug">
                  Deploy Sreeshnav mobile app to Vercel
                </p>
              </div>
            </div>

            {/* Task 2: Medium Priority */}
            <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl shadow-sm border border-stone-200/60 transition-all">
              <button 
                onClick={() => triggerCelebration()}
                className="mt-0.5 w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 active:scale-95 shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">done</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6B38D4] font-bold">
                    💜 Medium Priority
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">schedule</span> 5:30 PM
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#1D1B19] leading-snug">
                  Review Figma design tokens &amp; corner radii
                </p>
              </div>
            </div>

            {/* Task 3: Gentle Priority (Completed) */}
            <div className="flex items-start gap-3.5 bg-stone-50 p-4 rounded-2xl opacity-80 border border-stone-200/50 transition-all">
              <button className="mt-0.5 w-6 h-6 rounded-lg bg-[#006C49] text-white flex items-center justify-center active:scale-95 shrink-0">
                <span className="material-symbols-outlined text-[16px]">done</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#006C49] font-bold">
                    🌿 Gentle Priority
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[13px]">schedule</span> 11:00 AM
                  </span>
                </div>
                <p className="text-sm line-through text-stone-500 leading-snug">
                  Send weekly community newsletter
                </p>
              </div>
            </div>

            {/* User Added Daily Tasks */}
            {dailyTodos.map((todo) => (
              <div 
                key={todo.id}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                  todo.completed ? 'bg-stone-50 opacity-80 border-stone-200/50' : 'bg-white border-stone-200/70 shadow-sm'
                }`}
              >
                <button 
                  onClick={() => onToggleTodo(todo.id)}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center active:scale-95 shrink-0 transition-colors ${
                    todo.completed ? 'bg-[#006C49] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">done</span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      todo.priority === 'high' ? 'bg-[#FFE4E6] text-[#B90538]' :
                      todo.priority === 'low' ? 'bg-[#D1FAE5] text-[#006C49]' : 'bg-[#EDE9FE] text-[#6B38D4]'
                    }`}>
                      {todo.priority === 'high' ? '🌸 High' : todo.priority === 'low' ? '🌿 Gentle' : '💜 Medium'}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold leading-snug ${todo.completed ? 'line-through text-stone-500' : 'text-[#1D1B19]'}`}>
                    {todo.text}
                  </p>
                </div>
                <button 
                  onClick={() => onDeleteTodo(todo.id)}
                  className="text-stone-400 hover:text-red-500 p-1 text-xs"
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. LONG-TERM GOALS (3 ACTIVE ARCS)                        */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Long-Term Goals</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6B38D4] text-xs font-bold">
                3 Active Arcs
              </span>
            </div>
            <span className="text-xs text-stone-500 font-semibold">Q3 Vision ✨</span>
          </div>

          <div className="space-y-3">
            {/* Goal Arc 1 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">🚀</span>
                  <h4 className="font-['Fraunces',serif] font-bold text-base text-[#1D1B19] truncate">
                    Master TypeScript &amp; Next.js
                  </h4>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#B90538] font-bold shrink-0">
                  🌸 High Priority
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#006C49] font-bold">68% completed (2/3 Milestones)</span>
                  <span className="text-stone-500 font-normal">42 days left</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006C49] rounded-full transition-all duration-500" style={{ width: '68%' }} />
                </div>
              </div>
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center gap-2 text-xs py-1 px-2.5 rounded-xl bg-stone-50 text-stone-600">
                  <span className="material-symbols-outlined text-[15px] text-[#006C49] font-bold shrink-0">check_circle</span>
                  <span className="line-through text-stone-400 truncate">Build Auth engine &amp; session middleware</span>
                </div>
                <div className="flex items-center gap-2 text-xs py-1 px-2.5 rounded-xl bg-stone-50 text-stone-800">
                  <span className="material-symbols-outlined text-[15px] text-stone-400 shrink-0">radio_button_unchecked</span>
                  <span className="truncate">Ship dashboard state management</span>
                </div>
              </div>
            </div>

            {/* Goal Arc 2 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">📚</span>
                  <h4 className="font-['Fraunces',serif] font-bold text-base text-[#1D1B19] truncate">
                    Read 12 Books This Year
                  </h4>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6B38D4] font-bold shrink-0">
                  💜 Medium Priority
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B38D4] font-bold">50% completed (6/12 Books)</span>
                  <span className="text-stone-500 font-normal">120 days left</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#6B38D4] rounded-full transition-all duration-500" style={{ width: '50%' }} />
                </div>
              </div>
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center gap-2 text-xs py-1 px-2.5 rounded-xl bg-stone-50 text-stone-600">
                  <span className="material-symbols-outlined text-[15px] text-[#6B38D4] font-bold shrink-0">check_circle</span>
                  <span className="line-through text-stone-400 truncate">Finish 'Atomic Habits' (Ch. 1-20)</span>
                </div>
                <div className="flex items-center gap-2 text-xs py-1 px-2.5 rounded-xl bg-stone-50 text-stone-800">
                  <span className="material-symbols-outlined text-[15px] text-stone-400 shrink-0">radio_button_unchecked</span>
                  <span className="truncate">Read 'Design of Everyday Things'</span>
                </div>
              </div>
            </div>

            {/* Goal Arc 3 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">🌱</span>
                  <h4 className="font-['Fraunces',serif] font-bold text-base text-[#1D1B19] truncate">
                    Build $10k Passive MRR
                  </h4>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#006C49] font-bold shrink-0">
                  🌿 Gentle Priority
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#0284C7] font-bold">32% completed ($3,200 MRR)</span>
                  <span className="text-stone-500 font-normal">180 days left</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0284C7] rounded-full transition-all duration-500" style={{ width: '32%' }} />
                </div>
              </div>
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center gap-2 text-xs py-1 px-2.5 rounded-xl bg-stone-50 text-stone-600">
                  <span className="material-symbols-outlined text-[15px] text-[#0284C7] font-bold shrink-0">check_circle</span>
                  <span className="line-through text-stone-400 truncate">Launch Pastel Whimsy Figma Kit</span>
                </div>
                <div className="flex items-center gap-2 text-xs py-1 px-2.5 rounded-xl bg-stone-50 text-stone-800">
                  <span className="material-symbols-outlined text-[15px] text-stone-400 shrink-0">radio_button_unchecked</span>
                  <span className="truncate">Build Micro-SaaS boilerplate &amp; Stripe billing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 6. GLOW POINTS & COZY REWARD BAZAAR                      */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/70 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center text-2xl shadow-xs">
                ✨
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Glow Points &amp; Vault
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-['Fraunces',serif] font-bold text-2xl text-[#1D1B19]">
                    {orbitData.score}
                  </span>
                  <span className="text-xs font-bold text-[#006C49]">Glow Pts</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClaimStreakBonus}
              disabled={claimedBonus}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs shadow-xs active:scale-95 transition-all ${
                claimedBonus 
                  ? 'bg-[#006C49] text-white opacity-90 pointer-events-none' 
                  : 'bg-[#6B38D4] text-white hover:bg-[#5516BE]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {claimedBonus ? 'check' : 'add'}
              </span>
              <span>{claimedBonus ? 'Claimed +50!' : 'Claim +50 Bonus'}</span>
            </button>
          </div>

          {/* Feedback banner */}
          {bonusToast && (
            <div className="flex items-center justify-between bg-[#D1FAE5] px-3.5 py-2 rounded-xl text-[#005236] text-xs font-bold shadow-xs animate-bounce">
              <span>🎉 <strong>Woohoo!</strong> 50 Glow Points deposited into your Vault!</span>
              <span>Total: {orbitData.score} Pts</span>
            </div>
          )}

          {/* Reward Bazaar Cards */}
          <div className="pt-2 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Cozy Reward Bazaar
              </span>
              <span className="text-xs text-[#6B38D4] font-semibold">3 Perks Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Perk 1 */}
              <div className="p-3 rounded-2xl bg-[#EDE9FE]/70 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">🎨</span>
                    <span className="text-[10px] font-bold text-[#6B38D4] bg-white px-2 py-0.5 rounded-full shadow-2xs">
                      500 Pts
                    </span>
                  </div>
                  <p className="font-['Fraunces',serif] font-bold text-xs text-[#1D1B19] mt-1 leading-tight">
                    Sunset Lo-Fi Theme
                  </p>
                  <p className="text-[11px] text-stone-500">Atmospheric palette</p>
                </div>
                <button 
                  onClick={() => triggerCelebration()}
                  className="w-full py-1 text-center rounded-xl bg-[#6B38D4] text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
                >
                  Claim Perk
                </button>
              </div>

              {/* Perk 2 */}
              <div className="p-3 rounded-2xl bg-[#D1FAE5]/70 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">🍵</span>
                    <span className="text-[10px] font-bold text-[#006C49] bg-white px-2 py-0.5 rounded-full shadow-2xs">
                      300 Pts
                    </span>
                  </div>
                  <p className="font-['Fraunces',serif] font-bold text-xs text-[#1D1B19] mt-1 leading-tight">
                    Matcha Latte Break
                  </p>
                  <p className="text-[11px] text-stone-500">Guilt-free offline treat</p>
                </div>
                <div className="w-full py-1 text-center rounded-xl bg-white text-[#006C49] text-[11px] font-bold shadow-2xs">
                  ✓ Claimed Today
                </div>
              </div>

              {/* Perk 3 */}
              <div className="p-3 rounded-2xl bg-[#FFE4E6]/70 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">🎮</span>
                    <span className="text-[10px] font-bold text-[#B90538] bg-white px-2 py-0.5 rounded-full shadow-2xs">
                      250 Pts
                    </span>
                  </div>
                  <p className="font-['Fraunces',serif] font-bold text-xs text-[#1D1B19] mt-1 leading-tight">
                    1 Hr Game Break
                  </p>
                  <p className="text-[11px] text-stone-500">Rest &amp; recharge block</p>
                </div>
                <button 
                  onClick={() => triggerCelebration()}
                  className="w-full py-1 text-center rounded-xl bg-white hover:bg-rose-50 text-[#B90538] text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 7. DAILY GENTLE NOTE                                     */}
        {/* ======================================================== */}
        <section className="bg-gradient-to-r from-[#FFE4E6]/60 via-[#EDE9FE]/50 to-[#D1FAE5]/60 rounded-3xl p-4 flex items-center gap-3 shadow-sm border border-stone-200/50">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-lg shrink-0 shadow-2xs">
            💌
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B38D4]">Daily Gentle Note</p>
            <p className="text-xs text-stone-600 truncate">"Small daily disciplines compound into quiet confidence."</p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 8. FLOATING ADD ACTION BUTTON (MATCHING STITCH)          */}
        {/* ======================================================== */}
        <div className="pt-2 pb-6 flex justify-center sticky bottom-24 z-20 pointer-events-none">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="pointer-events-auto group flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#6B38D4] text-white shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-bold text-sm"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-90">
              add
            </span>
            <span>Add Habit or Task</span>
            <span className="text-xs bg-[#E9DDFF] text-[#23005C] px-1.5 py-0.5 rounded-full">✨</span>
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 9. ADD HABIT OR TASK MODAL                                */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6B38D4] flex items-center justify-center font-bold">
                  ✨
                </div>
                <h3 className="font-['Fraunces',serif] font-bold text-lg text-stone-900">
                  Add Habit or Task
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Type Switcher: Daily Task vs Fixed Routine */}
            <div className="flex p-1 rounded-2xl bg-stone-100 border border-stone-200/60">
              <button
                onClick={() => setAddMode('daily')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                  addMode === 'daily' ? 'bg-white text-[#6B38D4] shadow-xs' : 'text-stone-600'
                }`}
              >
                Today's Task
              </button>
              <button
                onClick={() => setAddMode('routine')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                  addMode === 'routine' ? 'bg-white text-[#6B38D4] shadow-xs' : 'text-stone-600'
                }`}
              >
                Recurring Routine
              </button>
            </div>

            {/* Task Title Input */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                {addMode === 'routine' ? 'Routine Title' : 'Task Title'}
              </label>
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder={addMode === 'routine' ? 'e.g., Drink water, Read 10 pages' : 'e.g., Deploy updates, Review notes'}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B38D4]"
                autoFocus
              />
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewTaskPriority('high')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    newTaskPriority === 'high' 
                      ? 'bg-[#FFE4E6] text-[#B90538] border-[#B90538]' 
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  🌸 High
                </button>
                <button
                  type="button"
                  onClick={() => setNewTaskPriority('medium')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    newTaskPriority === 'medium' 
                      ? 'bg-[#EDE9FE] text-[#6B38D4] border-[#6B38D4]' 
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  💜 Medium
                </button>
                <button
                  type="button"
                  onClick={() => setNewTaskPriority('low')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    newTaskPriority === 'low' 
                      ? 'bg-[#D1FAE5] text-[#006C49] border-[#006C49]' 
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  🌿 Gentle
                </button>
              </div>
            </div>

            <button
              onClick={handleAddTask}
              className="w-full py-3 rounded-full bg-[#6B38D4] text-white font-bold text-xs shadow-md shadow-purple-500/25 active:scale-95 transition-all mt-2"
            >
              Add to Daily Journey ✨
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
