import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { 
  TodoItem, 
  DayLog, 
  ActivityEvent, 
  StreakState, 
  RoutineItem,
  WorkspaceView
} from '../../types';
import avatarImg from '../../assets/avatar.jpg';
import { playPopSound } from '../../utils/delight';

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
  onNavigate?: (view: WorkspaceView) => void;
  onLock?: () => void;
}

const HABITS_STORAGE_KEY = 'orbit-habits-v2';

interface HabitItemDef {
  id: string;
  title: string;
  detail: string;
  emoji: string;
  badge: string;
  badgeBg: string;
  bgClass: string;
  watermark: string;
  watermarkColor: string;
  iconBg: string;
  iconColor: string;
  btnBgDone: string;
  completed: boolean;
}

interface GoalArcDef {
  id: string;
  title: string;
  emoji: string;
  priorityText: string;
  priorityClass: string;
  progressPercent: number;
  progressLabel: string;
  daysLeft: string;
  barColor: string;
  subtasks: Array<{ id: string; text: string; completed: boolean }>;
}

export const HabitsDashboard: React.FC<HabitsDashboardProps> = ({
  todos = [],
  routines = [],
  selectedDate,
  dayLogs = {},
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onArchiveCompletedDaily,
  onSaveRoutine,
  onLock,
}) => {
  const TODAY = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Celebration helper
  const triggerCelebration = () => {
    try {
      playPopSound();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6B38D4', '#006C49', '#DE3B78', '#F59E0B', '#D1FAE5']
      });
    } catch {}
  };

  // Persistent points and rewards
  const [glowPoints, setGlowPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${HABITS_STORAGE_KEY}-points`);
      return saved ? parseInt(saved, 10) : 830;
    } catch {
      return 830;
    }
  });

  const [hasClaimedBonus, setHasClaimedBonus] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${HABITS_STORAGE_KEY}-bonus-claimed`) === 'true';
    } catch {
      return true; // Match the default in Stitch HTML
    }
  });

  const [showBonusToast, setShowBonusToast] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'daily' | 'routine'>('daily');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('high');

  // Bazaar perks state
  const [unlockedPerks, setUnlockedPerks] = useState<Record<string, boolean>>(() => {
    return { 'perk-matcha': true };
  });

  // Default Daily Habits matching Stitch 1:1
  const [habitsList, setHabitsList] = useState<HabitItemDef[]>([
    {
      id: 'h1',
      title: 'Drink 2.5L Water',
      detail: 'Hydrated & glowing · 8 glasses logged',
      emoji: '💧',
      badge: '8/8 done',
      badgeBg: 'bg-secondary text-on-secondary',
      bgClass: 'bg-mint-subtle/80 text-on-secondary-container',
      watermark: 'water_drop',
      watermarkColor: 'text-secondary/10',
      iconBg: 'bg-surface-card',
      iconColor: 'text-secondary',
      btnBgDone: 'bg-secondary text-on-secondary',
      completed: true,
    },
    {
      id: 'h2',
      title: 'Read 20 pages',
      detail: 'Atomic Habits · page 84-104',
      emoji: '📖',
      badge: 'Ch. 4',
      badgeBg: 'bg-primary text-on-primary',
      bgClass: 'bg-lavender-subtle/80 text-on-primary-fixed',
      watermark: 'menu_book',
      watermarkColor: 'text-primary/10',
      iconBg: 'bg-surface-card',
      iconColor: 'text-primary',
      btnBgDone: 'bg-primary text-on-primary',
      completed: true,
    },
    {
      id: 'h3',
      title: 'Code for 1 hour',
      detail: 'Next.js Personal App Project',
      emoji: '💻',
      badge: '62 mins',
      badgeBg: 'bg-sky-accent text-on-primary',
      bgClass: 'bg-sky-subtle/80 text-on-surface',
      watermark: 'terminal',
      watermarkColor: 'text-sky-accent/10',
      iconBg: 'bg-surface-card',
      iconColor: 'text-sky-accent',
      btnBgDone: 'bg-sky-accent text-on-primary',
      completed: true,
    },
    {
      id: 'h4',
      title: '10m Meditation',
      detail: 'Pending for evening unwind session',
      emoji: '🧘',
      badge: '✨ Pending',
      badgeBg: 'bg-surface-card text-tertiary',
      bgClass: 'bg-peach-subtle/90 text-on-tertiary-fixed-variant',
      watermark: 'self_improvement',
      watermarkColor: 'text-tertiary/10',
      iconBg: 'bg-surface-card',
      iconColor: 'text-tertiary',
      btnBgDone: 'bg-tertiary text-on-primary',
      completed: false,
    },
  ]);

  // Default Today's Priorities matching Stitch
  interface PriorityTaskDef {
    id: string;
    priority: 'high' | 'medium' | 'gentle';
    time: string;
    text: string;
    completed: boolean;
  }

  const [prioritiesList, setPrioritiesList] = useState<PriorityTaskDef[]>([
    {
      id: 'p1',
      priority: 'high',
      time: '4:00 PM',
      text: 'Deploy Sreeshnav mobile app to Vercel',
      completed: false,
    },
    {
      id: 'p2',
      priority: 'medium',
      time: '5:30 PM',
      text: 'Review Figma design tokens & corner radii',
      completed: false,
    },
    {
      id: 'p3',
      priority: 'gentle',
      time: '11:00 AM',
      text: 'Send weekly community newsletter',
      completed: true,
    },
  ]);

  // Long-Term Goal Arcs matching Stitch
  const [goalArcs, setGoalArcs] = useState<GoalArcDef[]>([
    {
      id: 'g1',
      title: 'Master TypeScript & Next.js',
      emoji: '🚀',
      priorityText: '🌸 High Priority',
      priorityClass: 'bg-peach-subtle text-on-tertiary-fixed-variant',
      progressPercent: 68,
      progressLabel: '68% completed (2/3 Milestones)',
      daysLeft: '42 days left',
      barColor: 'bg-secondary',
      subtasks: [
        { id: 'g1-s1', text: 'Build Auth engine & session middleware', completed: true },
        { id: 'g1-s2', text: 'Ship dashboard state management', completed: false },
        { id: 'g1-s3', text: 'Deploy Next.js production micro-app', completed: false },
      ],
    },
    {
      id: 'g2',
      title: 'Read 12 Books This Year',
      emoji: '📚',
      priorityText: '💜 Medium Priority',
      priorityClass: 'bg-lavender-subtle text-primary',
      progressPercent: 50,
      progressLabel: '50% completed (6/12 Books)',
      daysLeft: '120 days left',
      barColor: 'bg-primary',
      subtasks: [
        { id: 'g2-s1', text: "Finish 'Atomic Habits' (Ch. 1-20)", completed: true },
        { id: 'g2-s2', text: "Read 'Design of Everyday Things'", completed: false },
        { id: 'g2-s3', text: "Read 'Show Your Work!' by Austin Kleon", completed: false },
      ],
    },
    {
      id: 'g3',
      title: 'Build $10k Passive MRR',
      emoji: '🌱',
      priorityText: '🌿 Gentle Priority',
      priorityClass: 'bg-mint-subtle text-secondary',
      progressPercent: 32,
      progressLabel: '32% completed ($3,200 MRR)',
      daysLeft: '180 days left',
      barColor: 'bg-sky-accent',
      subtasks: [
        { id: 'g3-s1', text: 'Launch Pastel Whimsy Figma Kit', completed: true },
        { id: 'g3-s2', text: 'Build Micro-SaaS boilerplate & Stripe billing', completed: false },
        { id: 'g3-s3', text: 'Create 5 interactive landing templates', completed: false },
      ],
    },
  ]);

  // Dynamic user tasks from props
  const userDailyTodos = useMemo(() => {
    return todos.filter(
      (t) => (t.type === 'daily' || !t.type) && t.status !== 'archived'
    );
  }, [todos]);

  // Combined counts for progress calculation
  const totalRoutines = habitsList.length;
  const completedRoutines = habitsList.filter((h) => h.completed).length;
  const remainingRoutines = totalRoutines - completedRoutines;

  const totalPriorities = prioritiesList.length;
  const remainingPriorities = prioritiesList.filter((p) => !p.completed).length;

  const focusPercent = totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 75;
  const progressOffset = 175.9 - (175.9 * (focusPercent / 100));

  // Toggle daily habit
  const handleToggleHabit = (id: string) => {
    setHabitsList((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const next = !h.completed;
          if (next) triggerCelebration();
          else playPopSound();
          return {
            ...h,
            completed: next,
            badge: next ? 'Completed!' : '✨ Pending',
            badgeBg: next ? h.btnBgDone : 'bg-surface-card text-tertiary',
          };
        }
        return h;
      })
    );
  };

  // Toggle priority task
  const handleTogglePriority = (id: string) => {
    setPrioritiesList((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = !p.completed;
          if (next) triggerCelebration();
          else playPopSound();
          return { ...p, completed: next };
        }
        return p;
      })
    );
  };

  // Toggle goal subtask
  const handleToggleGoalSubtask = (goalId: string, subtaskId: string) => {
    setGoalArcs((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextSubtasks = g.subtasks.map((st) => {
            if (st.id === subtaskId) {
              const next = !st.completed;
              if (next) triggerCelebration();
              else playPopSound();
              return { ...st, completed: next };
            }
            return st;
          });
          const done = nextSubtasks.filter((s) => s.completed).length;
          const pct = Math.round((done / nextSubtasks.length) * 100);
          return {
            ...g,
            subtasks: nextSubtasks,
            progressPercent: pct,
            progressLabel: `${pct}% completed (${done}/${nextSubtasks.length} Milestones)`,
          };
        }
        return g;
      })
    );
  };

  // Claim streak bonus
  const handleClaimBonus = () => {
    if (hasClaimedBonus) return;
    const newPoints = glowPoints + 50;
    setGlowPoints(newPoints);
    setHasClaimedBonus(true);
    setShowBonusToast(true);
    triggerCelebration();
    try {
      localStorage.setItem(`${HABITS_STORAGE_KEY}-points`, newPoints.toString());
      localStorage.setItem(`${HABITS_STORAGE_KEY}-bonus-claimed`, 'true');
    } catch {}
    setTimeout(() => setShowBonusToast(false), 4000);
  };

  // Redeem bazaar perk
  const handleRedeemPerk = (perkId: string, cost: number) => {
    if (unlockedPerks[perkId]) return;
    if (glowPoints < cost) {
      alert("Not enough Glow Points yet! Complete more habits to earn points ✨");
      return;
    }
    const nextPoints = glowPoints - cost;
    setGlowPoints(nextPoints);
    setUnlockedPerks((prev) => ({ ...prev, [perkId]: true }));
    triggerCelebration();
    try {
      localStorage.setItem(`${HABITS_STORAGE_KEY}-points`, nextPoints.toString());
    } catch {}
  };

  // Clear completed priorities
  const handleClearDone = () => {
    setPrioritiesList((prev) => prev.filter((p) => !p.completed));
    if (onArchiveCompletedDaily) {
      onArchiveCompletedDaily(selectedDate || TODAY);
    }
    playPopSound();
  };

  // Add new habit or task
  const handleCreateItem = () => {
    const text = newTaskInput.trim();
    if (!text) return;

    if (addMode === 'routine') {
      if (onSaveRoutine) {
        onSaveRoutine({
          id: 'routine-' + Date.now(),
          text,
          priority: newTaskPriority,
          frequency: 'daily',
          startDate: TODAY,
          createdAt: new Date().toISOString(),
        });
      }
      // Also add to local habitsList
      setHabitsList((prev) => [
        ...prev,
        {
          id: 'h-' + Date.now(),
          title: text,
          detail: 'Daily intentional ritual',
          emoji: '✨',
          badge: '✨ Pending',
          badgeBg: 'bg-surface-card text-tertiary',
          bgClass: 'bg-lavender-subtle/80 text-on-primary-fixed',
          watermark: 'auto_awesome',
          watermarkColor: 'text-primary/10',
          iconBg: 'bg-surface-card',
          iconColor: 'text-primary',
          btnBgDone: 'bg-primary text-on-primary',
          completed: false,
        },
      ]);
    } else {
      onAddTodo(text, 'daily', newTaskPriority, selectedDate || TODAY);
      setPrioritiesList((prev) => [
        ...prev,
        {
          id: 'p-' + Date.now(),
          priority: newTaskPriority === 'high' ? 'high' : newTaskPriority === 'low' ? 'gentle' : 'medium',
          time: 'Today',
          text,
          completed: false,
        },
      ]);
    }

    setNewTaskInput('');
    setIsAddModalOpen(false);
    triggerCelebration();
  };

  return (
    <div className="bg-canvas-bg font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen">
      
      {/* ======================================================== */}
      {/* 1. FIXED TOP HEADER MATCHING STITCH 1:1                  */}
      {/* ======================================================== */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 px-space-lg flex items-center justify-between gap-space-sm max-w-lg mx-auto">
          <div className="flex items-center gap-space-md">
            <div className="relative flex items-center justify-center">
              <img 
                src={avatarImg} 
                alt="Sreeshnav" 
                className="rounded-full w-9 h-9 object-cover border-2 border-white shadow-sm ring-2 ring-primary-fixed"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-container rounded-full flex items-center justify-center shadow-sm text-[9px]">
                ✨
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none font-fraunces">
                  Sreeshnav's Space
                </span>
              </div>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-peach-subtle/80 text-on-tertiary-fixed-variant font-label-sm text-label-sm shadow-[0_1px_4px_rgba(220,44,79,0.08)]">
                  <span>✨ Feeling Creative</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-space-xs">
            <button 
              onClick={() => {
                playPopSound();
                if (onLock) onLock();
              }}
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95 cursor-pointer"
              title="Lock Sanctuary"
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </button>
            <button 
              onClick={() => {
                playPopSound();
                setIsNotificationOpen(true);
              }}
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95 cursor-pointer"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN HABITS & TASKS CONTENT                           */}
      {/* ======================================================== */}
      <main className="flex flex-col relative w-full pt-20 pb-28 bg-canvas-bg min-h-screen">
        <div className="flex flex-col w-full px-space-md sm:px-space-lg space-y-space-lg max-w-lg mx-auto">
          
          {/* Section 1: Gamified Header / Progress Card */}
          <section className="relative overflow-hidden bg-surface-card rounded-3xl p-space-lg shadow-sm border border-border-subtle mt-2">
            {/* Subtle Ambient Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-mint-subtle/60 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-lavender-subtle/70 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between gap-space-md">
              <div className="flex flex-col space-y-1">
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-mint-subtle text-on-secondary-container">
                  <span className="text-xs">🌱</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Growing Daily</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-fraunces">
                  You're glowing!
                </h2>
                <div className="inline-flex items-center gap-1 text-sunshine-accent font-label-md text-label-md">
                  <span>🔥</span>
                  <span className="text-on-surface font-semibold">5 Day Streak</span>
                  <span className="text-on-surface-variant font-normal">· Keep it up!</span>
                </div>
              </div>

              {/* Cute Circular Progress Meter */}
              <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle className="text-surface-container" cx="36" cy="36" fill="none" r="28" stroke="currentColor" strokeWidth="6.5"></circle>
                  <circle 
                    className="text-secondary transition-all duration-700 ease-out" 
                    cx="36" 
                    cy="36" 
                    fill="none" 
                    r="28" 
                    stroke="currentColor" 
                    strokeDasharray="175.9" 
                    strokeDashoffset={progressOffset} 
                    strokeLinecap="round" 
                    strokeWidth="6.5"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline-sm text-headline-sm text-on-surface leading-none font-fraunces">
                    {focusPercent}%
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                    {completedRoutines}/{totalRoutines} Done
                  </span>
                </div>
              </div>
            </div>

            {/* Motivational Micro-sticker */}
            <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {remainingRoutines > 0 
                    ? 'One tiny ritual left to complete your gold ring!' 
                    : 'All rituals complete! You have achieved your gold ring! 🎉'}
                </p>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold">
                {remainingRoutines > 0 ? `${remainingRoutines} left` : 'Done ✨'}
              </span>
            </div>
          </section>

          {/* Section 2: Week at a Glance mini calendar pills */}
          <section className="bg-surface-card rounded-3xl p-space-md shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between mb-space-sm px-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Week 28 · Habit Journey</span>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-mint-subtle px-2 py-0.5 rounded-full font-bold">
                <span>★</span> 100% on Mon–Thu
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
              {/* Mon */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-mint-subtle/70 text-on-secondary-container">
                <span className="font-label-sm text-label-sm">M</span>
                <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
              </div>
              {/* Tue */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-mint-subtle/70 text-on-secondary-container">
                <span className="font-label-sm text-label-sm">T</span>
                <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
              </div>
              {/* Wed */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-mint-subtle/70 text-on-secondary-container">
                <span className="font-label-sm text-label-sm">W</span>
                <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
              </div>
              {/* Thu */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-mint-subtle/70 text-on-secondary-container">
                <span className="font-label-sm text-label-sm">T</span>
                <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
              </div>
              {/* Fri (Active Today) */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-primary text-on-primary shadow-sm scale-105 transition-transform">
                <span className="font-label-sm text-label-sm text-primary-fixed">FRI</span>
                <span className="text-[13px] mt-1 font-bold">🌟</span>
              </div>
              {/* Sat */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-surface-container text-on-surface-variant opacity-75">
                <span className="font-label-sm text-label-sm">S</span>
                <span className="font-body-sm text-body-sm mt-1">•</span>
              </div>
              {/* Sun */}
              <div className="flex flex-col items-center py-2 px-1 rounded-2xl bg-surface-container text-on-surface-variant opacity-75">
                <span className="font-label-sm text-label-sm">S</span>
                <span className="font-body-sm text-body-sm mt-1">•</span>
              </div>
            </div>
          </section>

          {/* Section 3: Habits Checklist Section */}
          <section className="space-y-space-md">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Daily Habits</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  {habitsList.length} Routines
                </span>
              </div>
              <button 
                onClick={() => {
                  playPopSound();
                  setIsAddModalOpen(true);
                }}
                className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
              >
                <span>Organize</span>
                <span className="material-symbols-outlined text-[14px]">tune</span>
              </button>
            </div>

            <div className="space-y-space-sm" id="habits-list">
              {habitsList.map((habit) => (
                <div 
                  key={habit.id}
                  className={`habit-item relative overflow-hidden ${habit.bgClass} rounded-2xl p-space-md transition-all duration-300 shadow-sm border border-border-subtle`}
                >
                  <div className={`absolute -right-3 -bottom-4 ${habit.watermarkColor} pointer-events-none select-none`}>
                    <span className="material-symbols-outlined text-[80px]">{habit.watermark}</span>
                  </div>
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl ${habit.iconBg} ${habit.iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-xl">{habit.emoji}</span>
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm truncate font-fraunces">
                            {habit.title}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full font-label-sm text-[10px] font-bold ${
                            habit.completed ? habit.badgeBg : 'bg-surface-card text-tertiary'
                          }`}>
                            {habit.badge}
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm opacity-80 truncate">
                          {habit.detail}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`habit-toggle w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform cursor-pointer ${
                        habit.completed 
                          ? habit.btnBgDone 
                          : 'bg-surface-card text-tertiary border border-border-subtle'
                      }`}
                      title={habit.completed ? 'Completed' : 'Mark complete'}
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

          {/* Section 4: Quick Task Priorities Section */}
          <section className="space-y-space-md">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Today's Priorities</span>
                <span className="px-2 py-0.5 rounded-full bg-sunshine-subtle text-sunshine-accent font-label-sm text-label-sm font-bold">
                  {remainingPriorities} Remaining
                </span>
              </div>
              <button 
                onClick={handleClearDone}
                className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors cursor-pointer"
              >
                Clear Done
              </button>
            </div>

            {/* Task Cards Container */}
            <div className="space-y-2.5">
              {prioritiesList.map((task) => (
                <div 
                  key={task.id}
                  className={`task-card flex items-start gap-3.5 p-space-md rounded-2xl shadow-sm transition-all duration-200 border border-border-subtle ${
                    task.completed 
                      ? 'bg-surface-container-low opacity-75' 
                      : 'bg-surface-card'
                  }`}
                >
                  <button 
                    onClick={() => handleTogglePriority(task.id)}
                    className={`task-checkbox mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center active:scale-95 shrink-0 transition-colors cursor-pointer ${
                      task.completed 
                        ? 'bg-secondary text-on-secondary' 
                        : 'bg-surface-container text-transparent hover:text-outline-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">done</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                        task.priority === 'high' 
                          ? 'bg-peach-subtle text-on-tertiary-fixed-variant'
                          : task.priority === 'medium'
                          ? 'bg-lavender-subtle text-primary'
                          : 'bg-mint-subtle text-secondary'
                      }`}>
                        {task.priority === 'high' ? '🌸 High Priority' : task.priority === 'medium' ? '💜 Medium Priority' : '🌿 Gentle Priority'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span> {task.time}
                      </span>
                    </div>
                    <p className={`task-title font-body-lg text-body-lg leading-snug ${
                      task.completed 
                        ? 'line-through text-on-surface-variant' 
                        : 'text-on-surface'
                    }`}>
                      {task.text}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setPrioritiesList((prev) => prev.filter((p) => p.id !== task.id));
                      playPopSound();
                    }}
                    className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                    title="Remove task"
                  >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              ))}

              {/* Dynamic user todos */}
              {userDailyTodos.map((todo) => (
                <div 
                  key={todo.id}
                  className={`task-card flex items-start gap-3.5 p-space-md rounded-2xl shadow-sm transition-all duration-200 border border-border-subtle ${
                    todo.completed 
                      ? 'bg-surface-container-low opacity-75' 
                      : 'bg-surface-card'
                  }`}
                >
                  <button 
                    onClick={() => {
                      onToggleTodo(todo.id);
                      if (!todo.completed) triggerCelebration();
                      else playPopSound();
                    }}
                    className={`task-checkbox mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center active:scale-95 shrink-0 transition-colors cursor-pointer ${
                      todo.completed 
                        ? 'bg-secondary text-on-secondary' 
                        : 'bg-surface-container text-transparent hover:text-outline-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">done</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                        todo.priority === 'high' 
                          ? 'bg-peach-subtle text-on-tertiary-fixed-variant'
                          : todo.priority === 'low'
                          ? 'bg-mint-subtle text-secondary'
                          : 'bg-lavender-subtle text-primary'
                      }`}>
                        {todo.priority === 'high' ? '🌸 High Priority' : todo.priority === 'low' ? '🌿 Gentle Priority' : '💜 Medium Priority'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span> Today
                      </span>
                    </div>
                    <p className={`task-title font-body-lg text-body-lg leading-snug ${
                      todo.completed 
                        ? 'line-through text-on-surface-variant' 
                        : 'text-on-surface'
                    }`}>
                      {todo.text}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      onDeleteTodo(todo.id);
                      playPopSound();
                    }}
                    className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                    title="Delete task"
                  >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Long-Term Goals (3 Active Arcs) */}
          <section className="space-y-space-md">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Long-Term Goals</span>
                <span className="px-2 py-0.5 rounded-full bg-lavender-subtle text-primary font-label-sm text-label-sm font-bold">
                  {goalArcs.length} Active Arcs
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Q3 Vision ✨</span>
            </div>

            <div className="space-y-space-sm">
              {goalArcs.map((arc) => (
                <div 
                  key={arc.id}
                  className="bg-surface-card rounded-2xl p-space-md shadow-sm border border-border-subtle hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{arc.emoji}</span>
                      <h3 className="font-headline-sm text-[16px] text-on-surface font-semibold truncate font-fraunces">
                        {arc.title}
                      </h3>
                    </div>
                    <span className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold shrink-0 ${arc.priorityClass}`}>
                      {arc.priorityText}
                    </span>
                  </div>

                  {/* Progress & Timeline */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-label-sm">
                      <span className="text-secondary font-bold">{arc.progressLabel}</span>
                      <span className="text-on-surface-variant font-normal">{arc.daysLeft}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${arc.barColor} rounded-full transition-all duration-500`} 
                        style={{ width: `${arc.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Subtask Checklist */}
                  <div className="pt-1 space-y-1.5">
                    {arc.subtasks.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleToggleGoalSubtask(arc.id, st.id)}
                        className={`w-full text-left flex items-center gap-2 text-xs py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                          st.completed 
                            ? 'bg-surface-container-low/80 text-on-surface-variant' 
                            : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[15px] font-bold shrink-0 ${
                          st.completed ? 'text-secondary' : 'text-outline-variant'
                        }`}>
                          {st.completed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`truncate ${st.completed ? 'line-through text-on-surface-variant/80' : ''}`}>
                          {st.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Score & Points Claim System & Cozy Reward Bazaar */}
          <section className="bg-surface-card rounded-3xl p-space-lg shadow-sm border border-border-subtle space-y-space-md">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sunshine-subtle text-sunshine-accent flex items-center justify-center text-2xl shadow-sm">
                  ✨
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                      Glow Points &amp; Vault
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span id="glow-points-val" className="font-headline-md text-headline-md text-on-surface font-bold font-fraunces">
                      {glowPoints}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Glow Pts</span>
                  </div>
                </div>
              </div>

              {/* Claim Streak Bonus Button */}
              <button 
                id="claim-bonus-btn"
                onClick={handleClaimBonus}
                disabled={hasClaimedBonus}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-on-primary font-label-sm text-label-sm font-bold shadow-sm transition-all cursor-pointer ${
                  hasClaimedBonus 
                    ? 'bg-secondary opacity-90 pointer-events-none' 
                    : 'bg-primary hover:scale-105 active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {hasClaimedBonus ? 'check' : 'add'}
                </span>
                <span>{hasClaimedBonus ? 'Claimed +50!' : 'Claim +50 Bonus'}</span>
              </button>
            </div>

            {/* Claimed Feedback Banner */}
            {showBonusToast && (
              <div 
                id="claim-feedback-toast" 
                className="flex items-center justify-between bg-mint-subtle px-3 py-2 rounded-xl text-on-secondary-container font-label-sm text-xs shadow-xs animate-bounce"
              >
                <span className="flex items-center gap-1.5">
                  🎉 <strong>Woohoo!</strong> 50 Glow Points deposited into your Vault!
                </span>
                <span className="font-bold">✨ Total: {glowPoints} Pts</span>
              </div>
            )}

            {/* Cozy Reward Bazaar Sub-grid */}
            <div className="pt-2 border-t border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                  Cozy Reward Bazaar
                </span>
                <span className="font-label-sm text-xs text-primary font-semibold">3 Perks Ready</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Perk 1 */}
                <div className="p-2.5 rounded-2xl bg-lavender-subtle/70 flex flex-col justify-between gap-2 border border-border-subtle">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base">🎨</span>
                      <span className="font-label-sm text-[10px] font-bold text-primary bg-surface-card px-1.5 py-0.5 rounded-full">
                        500 Pts
                      </span>
                    </div>
                    <p className="font-headline-sm text-[13px] text-on-surface mt-1 leading-tight font-semibold font-fraunces">
                      Sunset Lo-Fi Theme
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">Atmospheric palette</p>
                  </div>
                  <button 
                    onClick={() => handleRedeemPerk('perk-sunset', 500)}
                    className={`w-full py-1 text-center rounded-xl font-label-sm text-[11px] font-bold shadow-xs active:scale-95 transition-transform cursor-pointer ${
                      unlockedPerks['perk-sunset'] 
                        ? 'bg-surface-card text-secondary pointer-events-none' 
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    {unlockedPerks['perk-sunset'] ? 'Unlocked!' : 'Claim Perk'}
                  </button>
                </div>

                {/* Perk 2 */}
                <div className="p-2.5 rounded-2xl bg-mint-subtle/70 flex flex-col justify-between gap-2 border border-border-subtle">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base">🍵</span>
                      <span className="font-label-sm text-[10px] font-bold text-secondary bg-surface-card px-1.5 py-0.5 rounded-full">
                        300 Pts
                      </span>
                    </div>
                    <p className="font-headline-sm text-[13px] text-on-surface mt-1 leading-tight font-semibold font-fraunces">
                      Matcha Latte Break
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">Guilt-free offline treat</p>
                  </div>
                  <div className="w-full py-1 text-center rounded-xl bg-surface-card text-secondary font-label-sm text-[11px] font-bold shadow-xs">
                    ✓ Claimed Today
                  </div>
                </div>

                {/* Perk 3 */}
                <div className="p-2.5 rounded-2xl bg-peach-subtle/70 flex flex-col justify-between gap-2 border border-border-subtle">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base">🎮</span>
                      <span className="font-label-sm text-[10px] font-bold text-tertiary bg-surface-card px-1.5 py-0.5 rounded-full">
                        250 Pts
                      </span>
                    </div>
                    <p className="font-headline-sm text-[13px] text-on-surface mt-1 leading-tight font-semibold font-fraunces">
                      1 Hr Game Break
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">Rest &amp; recharge block</p>
                  </div>
                  <button 
                    onClick={() => handleRedeemPerk('perk-game', 250)}
                    className={`w-full py-1 text-center rounded-xl font-label-sm text-[11px] font-bold shadow-xs active:scale-95 transition-transform cursor-pointer ${
                      unlockedPerks['perk-game'] 
                        ? 'bg-surface-card text-tertiary pointer-events-none' 
                        : 'bg-surface-card text-on-surface hover:text-tertiary'
                    }`}
                  >
                    {unlockedPerks['perk-game'] ? 'Active!' : 'Redeem'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Daily Gentle Note */}
          <section className="bg-gradient-to-r from-peach-subtle/50 via-lavender-subtle/40 to-mint-subtle/50 rounded-3xl p-space-md flex items-center gap-3 shadow-sm border border-border-subtle">
            <div className="w-10 h-10 rounded-2xl bg-surface-card flex items-center justify-center text-lg shrink-0 shadow-xs">
              💌
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-sm text-label-sm uppercase tracking-wide text-primary font-bold">
                Daily Gentle Note
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                "Small daily disciplines compound into quiet confidence."
              </p>
            </div>
          </section>

          {/* Floating Action Button Pill (Above nav) */}
          <div className="pt-space-xs pb-space-sm flex justify-center sticky bottom-24 z-20 pointer-events-none">
            <button 
              onClick={() => {
                playPopSound();
                setIsAddModalOpen(true);
              }}
              className="pointer-events-auto group flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-90">
                add
              </span>
              <span className="font-label-lg text-label-lg font-bold">Add Habit or Task</span>
              <span className="text-xs bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded-full font-bold">✨</span>
            </button>
          </div>

        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. NOTIFICATIONS MODAL                                   */}
      {/* ======================================================== */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  Habit Sanctuary Updates
                </h3>
              </div>
              <button 
                onClick={() => setIsNotificationOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-mint-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-secondary">🔥 5 Day Streak Active</span>
                  <span className="text-[10px] text-on-surface-variant">Today</span>
                </div>
                <p className="text-xs text-on-surface-variant">You're glowing! Keep up the daily discipline to earn your gold ring.</p>
              </div>
              <div className="p-3 rounded-2xl bg-lavender-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">✨ Glow Points Vault</span>
                  <span className="text-[10px] text-on-surface-variant">Active</span>
                </div>
                <p className="text-xs text-on-surface-variant">You have {glowPoints} points in your vault. 3 perks ready in the bazaar!</p>
              </div>
            </div>
            <button 
              onClick={() => setIsNotificationOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              All Caught Up!
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ADD HABIT OR TASK MODAL                                */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border-subtle space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-lavender-subtle text-primary flex items-center justify-center font-bold">
                  ✨
                </div>
                <h3 className="font-headline-sm text-lg text-on-surface font-bold font-fraunces">
                  Add Habit or Task
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Type Switcher: Daily Task vs Fixed Routine */}
            <div className="flex p-1 rounded-2xl bg-surface-container border border-border-subtle">
              <button
                onClick={() => setAddMode('daily')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  addMode === 'daily' ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                Today's Task
              </button>
              <button
                onClick={() => setAddMode('routine')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  addMode === 'routine' ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                Recurring Routine
              </button>
            </div>

            {/* Task Title Input */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                {addMode === 'routine' ? 'Routine Title' : 'Task Title'}
              </label>
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder={addMode === 'routine' ? 'e.g., Drink water, Read 10 pages' : 'e.g., Deploy updates, Review notes'}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-lowest"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateItem();
                }}
              />
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewTaskPriority('high')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    newTaskPriority === 'high' 
                      ? 'bg-peach-subtle text-on-tertiary-fixed-variant border-tertiary' 
                      : 'bg-surface-container-low text-on-surface-variant border-border-subtle'
                  }`}
                >
                  🌸 High
                </button>
                <button
                  type="button"
                  onClick={() => setNewTaskPriority('medium')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    newTaskPriority === 'medium' 
                      ? 'bg-lavender-subtle text-primary border-primary' 
                      : 'bg-surface-container-low text-on-surface-variant border-border-subtle'
                  }`}
                >
                  💜 Medium
                </button>
                <button
                  type="button"
                  onClick={() => setNewTaskPriority('low')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    newTaskPriority === 'low' 
                      ? 'bg-mint-subtle text-secondary border-secondary' 
                      : 'bg-surface-container-low text-on-surface-variant border-border-subtle'
                  }`}
                >
                  🌿 Gentle
                </button>
              </div>
            </div>

            <button
              onClick={handleCreateItem}
              className="w-full py-3 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/25 active:scale-95 transition-all mt-2 cursor-pointer"
            >
              Add to Daily Journey ✨
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
