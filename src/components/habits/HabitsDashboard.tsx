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
import { useScrollVisibility } from '../../utils/useScrollVisibility';
import {
  todayKey,
  toLocalDateKey,
  parseLocalDateKey,
  addDays,
  diffInDays,
  startOfWeek,
  isAfter,
  isBefore,
  getWeekNumber,
} from '../../utils/dates';

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

function formatDisplayDate(dateKey: string): string {
  try {
    const d = parseLocalDateKey(dateKey);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateKey;
  }
}

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

export interface PriorityTaskDef {
  id: string;
  priority: 'high' | 'medium' | 'gentle';
  time: string;
  text: string;
  completed: boolean;
  date?: string;
}

export interface PointRatesConfig {
  habitPts: number;
  priorityPts: number;
  milestonePts: number;
  dailyBonusPts: number;
}

export const DEFAULT_POINT_RATES: PointRatesConfig = {
  habitPts: 20,
  priorityPts: 15,
  milestonePts: 25,
  dailyBonusPts: 50,
};

export function getSeedPriorities(today: string): PriorityTaskDef[] {
  const prevWeekMonday = addDays(startOfWeek(today, 1), -7);
  return [
    // Monday
    { id: 'seed-pw-mon-1', priority: 'high', time: '09:30 AM', text: 'Finish quarterly systems roadmap & architecture spec', completed: true, date: addDays(prevWeekMonday, 0) },
    { id: 'seed-pw-mon-2', priority: 'medium', time: '02:00 PM', text: 'Review LinkVault vault sync & state integrity', completed: true, date: addDays(prevWeekMonday, 0) },
    { id: 'seed-pw-mon-3', priority: 'gentle', time: '06:30 PM', text: 'Evening 30-min mindful recharge walk', completed: true, date: addDays(prevWeekMonday, 0) },
    // Tuesday
    { id: 'seed-pw-tue-1', priority: 'high', time: '10:00 AM', text: 'Refactor responsive shell navigation and touch feedback', completed: true, date: addDays(prevWeekMonday, 1) },
    { id: 'seed-pw-tue-2', priority: 'medium', time: '03:15 PM', text: 'Organize design tokens and typography hierarchy', completed: true, date: addDays(prevWeekMonday, 1) },
    // Wednesday
    { id: 'seed-pw-wed-1', priority: 'high', time: '09:00 AM', text: 'Weekly finance reconciliation & expense audit', completed: true, date: addDays(prevWeekMonday, 2) },
    { id: 'seed-pw-wed-2', priority: 'medium', time: '01:30 PM', text: 'Back up workspace bookmarks & clean archived tags', completed: true, date: addDays(prevWeekMonday, 2) },
    { id: 'seed-pw-wed-3', priority: 'gentle', time: '08:00 PM', text: 'Read 2 chapters of cognitive architecture paper', completed: true, date: addDays(prevWeekMonday, 2) },
    // Thursday
    { id: 'seed-pw-thu-1', priority: 'high', time: '10:30 AM', text: 'Optimize media preloader and feed scroll FPS', completed: true, date: addDays(prevWeekMonday, 3) },
    { id: 'seed-pw-thu-2', priority: 'medium', time: '04:00 PM', text: 'Prepare presentation notes for team sync', completed: true, date: addDays(prevWeekMonday, 3) },
    // Friday
    { id: 'seed-pw-fri-1', priority: 'high', time: '11:00 AM', text: 'Complete weekly sprint retro and wrap-up', completed: true, date: addDays(prevWeekMonday, 4) },
    { id: 'seed-pw-fri-2', priority: 'medium', time: '04:30 PM', text: 'Archive completed priorities and clean habit log', completed: true, date: addDays(prevWeekMonday, 4) },
    { id: 'seed-pw-fri-3', priority: 'gentle', time: '07:00 PM', text: 'Order weekly pantry essentials & restock', completed: true, date: addDays(prevWeekMonday, 4) },
    // Saturday
    { id: 'seed-pw-sat-1', priority: 'high', time: '08:00 AM', text: 'Long weekend trail hike & nature photography', completed: true, date: addDays(prevWeekMonday, 5) },
    { id: 'seed-pw-sat-2', priority: 'medium', time: '03:00 PM', text: 'Curate inspiration reels & moodboard bookmarks', completed: true, date: addDays(prevWeekMonday, 5) },
    // Sunday
    { id: 'seed-pw-sun-1', priority: 'high', time: '10:00 AM', text: 'Weekly reflection & sanctuary reset', completed: true, date: addDays(prevWeekMonday, 6) },
    { id: 'seed-pw-sun-2', priority: 'medium', time: '05:00 PM', text: 'Plan upcoming goals and priority schedule', completed: true, date: addDays(prevWeekMonday, 6) },
  ];
}

export const DEFAULT_BAZAAR_PERKS = [
  {
    id: 'perk-default-1',
    title: 'Artisanal Coffee or Boba',
    detail: 'Treat yourself to your favorite cozy beverage.',
    cost: 40,
    emoji: '☕',
    bgClass: 'bg-lavender-subtle/70',
    accentColor: 'text-primary',
    redeemedCount: 0,
    lastRedeemedDate: null,
  },
  {
    id: 'perk-default-2',
    title: '1 Hr Guilt-Free Gaming',
    detail: 'Kick back and immerse yourself in your favorite game.',
    cost: 60,
    emoji: '🎮',
    bgClass: 'bg-mint-subtle/70',
    accentColor: 'text-secondary',
    redeemedCount: 0,
    lastRedeemedDate: null,
  },
  {
    id: 'perk-default-3',
    title: 'Movie Night & Favorite Snack',
    detail: 'Pick any film and treat yourself guilt-free.',
    cost: 100,
    emoji: '🎬',
    bgClass: 'bg-peach-subtle/70',
    accentColor: 'text-tertiary',
    redeemedCount: 0,
    lastRedeemedDate: null,
  },
];

export const HabitsDashboard: React.FC<HabitsDashboardProps> = ({
  todos = [],
  routines = [],
  streakState,
  selectedDate,
  onSelectDate,
  dayLogs = {},
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onArchiveCompletedDaily,
  onSaveRoutine,
  onLock,
}) => {
  const isHeaderVisible = useScrollVisibility();
  const TODAY = useMemo(() => todayKey(), []);

  // Week offset state (0 = current week, -1 = previous week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const currentWeekStart = useMemo(() => startOfWeek(TODAY, 1), [TODAY]);
  const weekStart = useMemo(() => addDays(currentWeekStart, weekOffset * 7), [currentWeekStart, weekOffset]);
  const displayedWeekNumber = useMemo(() => getWeekNumber(weekStart), [weekStart]);

  // Compute 7-day strip date mapping for displayed week
  const dayDateMap = useMemo(() => {
    return {
      MON: addDays(weekStart, 0),
      TUE: addDays(weekStart, 1),
      WED: addDays(weekStart, 2),
      THU: addDays(weekStart, 3),
      FRI: addDays(weekStart, 4),
      SAT: addDays(weekStart, 5),
      SUN: addDays(weekStart, 6),
    } as Record<string, string>;
  }, [weekStart]);

  // Determine current day key if today is in the displayed week
  const todayDayKey = useMemo(() => {
    for (const [k, v] of Object.entries(dayDateMap)) {
      if (v === TODAY) return k;
    }
    return null;
  }, [dayDateMap, TODAY]);

  // Initialize selectedDay to matching selectedDate or todayDayKey or fallback
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (selectedDate) {
      for (const [k, v] of Object.entries(dayDateMap)) {
        if (v === selectedDate) return k;
      }
    }
    for (const [k, v] of Object.entries(dayDateMap)) {
      if (v === TODAY) return k;
    }
    const dayIndex = new Date().getDay();
    const map = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return map[dayIndex] || 'MON';
  });

  const activeDateKey = useMemo(() => {
    if (selectedDate && Object.values(dayDateMap).includes(selectedDate)) {
      return selectedDate;
    }
    return dayDateMap[selectedDay] || selectedDate || TODAY;
  }, [selectedDate, selectedDay, dayDateMap, TODAY]);

  // Sync selectedDay if selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      for (const [k, v] of Object.entries(dayDateMap)) {
        if (v === selectedDate) {
          setSelectedDay(k);
          break;
        }
      }
    }
  }, [selectedDate, dayDateMap]);

  // Week navigation actions
  const handlePrevWeek = () => {
    playPopSound();
    const newOffset = weekOffset - 1;
    setWeekOffset(newOffset);
    const newWeekStart = addDays(currentWeekStart, newOffset * 7);
    const dayIndices: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 };
    const dayIdx = dayIndices[selectedDay] ?? 0;
    const targetDate = addDays(newWeekStart, dayIdx);
    if (onSelectDate) onSelectDate(targetDate);
  };

  const handleNextWeek = () => {
    playPopSound();
    const newOffset = weekOffset + 1;
    setWeekOffset(newOffset);
    const newWeekStart = addDays(currentWeekStart, newOffset * 7);
    const dayIndices: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 };
    const dayIdx = dayIndices[selectedDay] ?? 0;
    const targetDate = addDays(newWeekStart, dayIdx);
    if (onSelectDate) onSelectDate(targetDate);
  };

  const handleResetToCurrentWeek = () => {
    playPopSound();
    setWeekOffset(0);
    const currentMap: Record<string, string> = {
      MON: addDays(currentWeekStart, 0),
      TUE: addDays(currentWeekStart, 1),
      WED: addDays(currentWeekStart, 2),
      THU: addDays(currentWeekStart, 3),
      FRI: addDays(currentWeekStart, 4),
      SAT: addDays(currentWeekStart, 5),
      SUN: addDays(currentWeekStart, 6),
    };
    for (const [k, v] of Object.entries(currentMap)) {
      if (v === TODAY) {
        setSelectedDay(k);
        break;
      }
    }
    if (onSelectDate) onSelectDate(TODAY);
  };

  // Date for modal priority creation
  const [newTaskDate, setNewTaskDate] = useState<string>(activeDateKey);

  useEffect(() => {
    setNewTaskDate(activeDateKey);
  }, [activeDateKey]);

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
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const updateGlowPoints = (delta: number) => {
    setGlowPoints((prev) => {
      const next = Math.max(0, prev + delta);
      try {
        localStorage.setItem(`${HABITS_STORAGE_KEY}-points`, next.toString());
      } catch {}
      return next;
    });
  };

  const [pointsToast, setPointsToast] = useState<{ message: string; pts: number; type: 'earn' | 'redeem' } | null>(null);

  const showPointsFeedback = (message: string, pts: number, type: 'earn' | 'redeem') => {
    setPointsToast({ message, pts, type });
    setTimeout(() => {
      setPointsToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  const [lastBonusDate, setLastBonusDate] = useState<string>(() => {
    try {
      return localStorage.getItem(`${HABITS_STORAGE_KEY}-bonus-date`) || '';
    } catch {
      return '';
    }
  });

  // Configurable point reward rates
  const [pointRates, setPointRates] = useState<PointRatesConfig>(() => {
    try {
      const saved = localStorage.getItem('sreesh-habit-point-rates-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          habitPts: typeof parsed.habitPts === 'number' && parsed.habitPts >= 0 ? parsed.habitPts : 20,
          priorityPts: typeof parsed.priorityPts === 'number' && parsed.priorityPts >= 0 ? parsed.priorityPts : 15,
          milestonePts: typeof parsed.milestonePts === 'number' && parsed.milestonePts >= 0 ? parsed.milestonePts : 25,
          dailyBonusPts: typeof parsed.dailyBonusPts === 'number' && parsed.dailyBonusPts >= 0 ? parsed.dailyBonusPts : 50,
        };
      }
    } catch {}
    return DEFAULT_POINT_RATES;
  });

  const hasClaimedTodayBonus = pointRates.dailyBonusPts > 0 && lastBonusDate === TODAY;

  const [isEditRatesModalOpen, setIsEditRatesModalOpen] = useState(false);
  const [tempPointRates, setTempPointRates] = useState<PointRatesConfig>(pointRates);
  const [activeHabitMenuId, setActiveHabitMenuId] = useState<string | null>(null);

  const handleSavePointRates = () => {
    const cleanRates: PointRatesConfig = {
      habitPts: Math.max(0, Math.floor(Number(tempPointRates.habitPts) || 0)),
      priorityPts: Math.max(0, Math.floor(Number(tempPointRates.priorityPts) || 0)),
      milestonePts: Math.max(0, Math.floor(Number(tempPointRates.milestonePts) || 0)),
      dailyBonusPts: Math.max(0, Math.floor(Number(tempPointRates.dailyBonusPts) || 0)),
    };
    setPointRates(cleanRates);
    if (cleanRates.dailyBonusPts === 0) {
      setLastBonusDate('');
      try {
        localStorage.removeItem(`${HABITS_STORAGE_KEY}-bonus-date`);
      } catch {}
    }
    try {
      localStorage.setItem('sreesh-habit-point-rates-v1', JSON.stringify(cleanRates));
    } catch {}
    setIsEditRatesModalOpen(false);
    triggerCelebration();
    showPointsFeedback('✨ Reward Point rates updated!', 0, 'earn');
  };

  const handleResetPointRates = () => {
    setTempPointRates(DEFAULT_POINT_RATES);
  };

  const [showBonusToast, setShowBonusToast] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePriorityMenuId, setActivePriorityMenuId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'daily' | 'routine' | 'goal'>('daily');
  const [newRoutineDetail, setNewRoutineDetail] = useState('');
  const [newRoutineEmoji, setNewRoutineEmoji] = useState('✨');
  const [newRoutineColor, setNewRoutineColor] = useState<'mint' | 'lavender' | 'sky' | 'peach'>('mint');
  const [newTaskTime, setNewTaskTime] = useState('4:00 PM');
  const [newGoalTimeline, setNewGoalTimeline] = useState('30 days left');
  const [newGoalMilestones, setNewGoalMilestones] = useState('');
  const [editingHabit, setEditingHabit] = useState<HabitItemDef | null>(null);
  const [editingGoalArc, setEditingGoalArc] = useState<GoalArcDef | null>(null);
  const [isPerkModalOpen, setIsPerkModalOpen] = useState(false);
  const [editingPerk, setEditingPerk] = useState<any | null>(null);
  const [perkTitle, setPerkTitle] = useState('');
  const [perkCost, setPerkCost] = useState('300');
  const [perkDesc, setPerkDesc] = useState('');
  const [perkEmoji, setPerkEmoji] = useState('🎁');
  const [perkColor, setPerkColor] = useState<'lavender' | 'mint' | 'peach'>('lavender');

  const [bazaarPerks, setBazaarPerks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sreesh-bazaar-perks-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_BAZAAR_PERKS;
  });
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('high');

  // Daily Habits List (zero dummy items)
  const [habitsList, setHabitsList] = useState<HabitItemDef[]>(() => {
    try {
      const saved = localStorage.getItem('sreesh-habits-list-v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Today's & Advance Priorities stored locally (seeded with previous week tasks)
  const [prioritiesList, setPrioritiesList] = useState<PriorityTaskDef[]>(() => {
    const seed = getSeedPriorities(todayKey());
    try {
      const saved = localStorage.getItem('sreesh-priorities-list-v2');
      if (saved) {
        const parsed: PriorityTaskDef[] = JSON.parse(saved);
        const prevWeekMon = addDays(startOfWeek(todayKey(), 1), -7);
        const hasPrevWeekTasks = parsed.some(
          (p) => p.id?.startsWith('seed-pw-') || (p.date && p.date >= prevWeekMon && p.date < startOfWeek(todayKey(), 1))
        );
        if (!hasPrevWeekTasks) {
          return [...seed, ...parsed];
        }
        return parsed;
      }
    } catch {}
    return seed;
  });

  // Long-Term Goal Arcs (zero dummy items)
  const [goalArcs, setGoalArcs] = useState<GoalArcDef[]>(() => {
    try {
      const saved = localStorage.getItem('sreesh-goal-arcs-v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Dynamic user tasks from props
  const userDailyTodos = useMemo(() => {
    return todos.filter(
      (t) => (t.type === 'daily' || !t.type) && t.status !== 'archived'
    );
  }, [todos]);

  // Unified display priorities for activeDateKey:
  const displayPriorities = useMemo(() => {
    const local = prioritiesList
      .filter((p) => (p.date || TODAY) === activeDateKey)
      .map((p) => ({ ...p, date: p.date || TODAY, isExternalTodo: false }));

    const external = userDailyTodos
      .filter((t) => (t.date || TODAY) === activeDateKey)
      .filter((t) => !local.some(l => l.id === t.id || l.text.trim().toLowerCase() === t.text.trim().toLowerCase()))
      .map((t) => ({
        id: t.id,
        priority: (t.priority === 'low' ? 'gentle' : (t.priority || 'medium')) as 'high' | 'medium' | 'gentle',
        time: 'Scheduled',
        text: t.text,
        completed: !!t.completed,
        date: t.date || TODAY,
        isExternalTodo: true,
      }));

    return [...local, ...external];
  }, [prioritiesList, userDailyTodos, activeDateKey, TODAY]);

  // Combined counts for progress calculation
  const totalRoutines = habitsList.length;
  const completedRoutines = habitsList.filter((h) => h.completed).length;
  const remainingRoutines = totalRoutines - completedRoutines;

  const remainingPriorities = useMemo(() => {
    return displayPriorities.filter((p) => !p.completed).length;
  }, [displayPriorities]);

  const focusPercent = totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 75;
  const progressOffset = 175.9 - (175.9 * (focusPercent / 100));

  // Dynamic 7-day configuration where today gets the active glowing purple pill design with 🌟
  const daysConfig = useMemo(() => {
    const dayDefs = [
      { key: 'MON', short: 'M', full: 'Monday' },
      { key: 'TUE', short: 'T', full: 'Tuesday' },
      { key: 'WED', short: 'W', full: 'Wednesday' },
      { key: 'THU', short: 'T', full: 'Thursday' },
      { key: 'FRI', short: 'F', full: 'Friday' },
      { key: 'SAT', short: 'S', full: 'Saturday' },
      { key: 'SUN', short: 'S', full: 'Sunday' },
    ];

    return dayDefs.map((d) => {
      const dateKey = dayDateMap[d.key];
      const isToday = dateKey === TODAY;
      const isPast = isBefore(dateKey, TODAY);
      const label = isToday ? d.key : d.short;

      return {
        key: d.key,
        dateKey,
        label,
        isToday,
        completed: isPast,
        icon: isToday ? '🌟' : isPast ? 'check_circle' : '•',
        fullName: d.full,
        desc: isToday
          ? `${d.full} (Today): ${completedRoutines} of ${totalRoutines} completed (${focusPercent}%)`
          : isPast
          ? `${d.full}: Logged routines (100% ★) · ${formatDisplayDate(dateKey)}`
          : `${d.full}: Upcoming rituals & planning · ${formatDisplayDate(dateKey)}`,
      };
    });
  }, [dayDateMap, TODAY, completedRoutines, totalRoutines, focusPercent]);

  // Toggle daily habit (awards +habitPts on completion, -habitPts if undone)
  const handleToggleHabit = (id: string) => {
    setHabitsList((prev) => {
      const targetHabit = prev.find((h) => h.id === id);
      const willBeCompleted = !targetHabit?.completed;
      const pts = pointRates.habitPts;

      if (willBeCompleted) {
        triggerCelebration();
        updateGlowPoints(pts);
        showPointsFeedback(`🌟 Completed "${targetHabit?.title || 'Habit'}"! +${pts} Glow Points!`, pts, 'earn');
      } else {
        playPopSound();
        updateGlowPoints(-pts);
        showPointsFeedback(`Marked "${targetHabit?.title || 'Habit'}" pending (-${pts} Glow Points)`, -pts, 'redeem');
      }

      const next = prev.map((h) => {
        if (h.id === id) {
          return {
            ...h,
            completed: willBeCompleted,
            badge: willBeCompleted ? 'Completed!' : '✨ Pending',
            badgeBg: willBeCompleted ? h.btnBgDone : 'bg-surface-card text-tertiary',
          };
        }
        return h;
      });
      try {
        localStorage.setItem('sreesh-habits-list-v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Toggle priority task (awards +priorityPts on completion, -priorityPts if undone)
  const handleTogglePriority = (id: string, isExternal?: boolean) => {
    const pts = pointRates.priorityPts;
    if (isExternal) {
      onToggleTodo(id);
      const item = displayPriorities.find((p) => p.id === id);
      const willBeCompleted = !item?.completed;
      if (willBeCompleted) {
        triggerCelebration();
        updateGlowPoints(pts);
        showPointsFeedback(`🎯 Completed priority task! +${pts} Glow Points!`, pts, 'earn');
      } else {
        playPopSound();
        updateGlowPoints(-pts);
        showPointsFeedback(`Marked priority pending (-${pts} Glow Points)`, -pts, 'redeem');
      }
      return;
    }

    setPrioritiesList((prev) => {
      const item = prev.find((p) => p.id === id);
      const willBeCompleted = !item?.completed;

      if (willBeCompleted) {
        triggerCelebration();
        updateGlowPoints(pts);
        showPointsFeedback(`🎯 Completed priority task! +${pts} Glow Points!`, pts, 'earn');
      } else {
        playPopSound();
        updateGlowPoints(-pts);
        showPointsFeedback(`Marked priority pending (-${pts} Glow Points)`, -pts, 'redeem');
      }

      const next = prev.map((p) => {
        if (p.id === id) {
          return { ...p, completed: willBeCompleted };
        }
        return p;
      });
      try {
        localStorage.setItem('sreesh-priorities-list-v2', JSON.stringify(next));
      } catch {}
      return next;
    });

    const matchingTodo = userDailyTodos.find(
      (t) => t.id === id || t.text.trim().toLowerCase() === displayPriorities.find((p) => p.id === id)?.text.trim().toLowerCase()
    );
    if (matchingTodo) {
      onToggleTodo(matchingTodo.id);
    }
  };

  // Delete priority task
  const handleDeletePriority = (id: string, isExternal?: boolean) => {
    playPopSound();
    if (isExternal) {
      onDeleteTodo(id);
      return;
    }

    setPrioritiesList((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try { localStorage.setItem('sreesh-priorities-list-v2', JSON.stringify(next)); } catch {}
      return next;
    });

    const matchingTodo = userDailyTodos.find(t => t.id === id || t.text.trim().toLowerCase() === displayPriorities.find(p => p.id === id)?.text.trim().toLowerCase());
    if (matchingTodo) {
      onDeleteTodo(matchingTodo.id);
    }
  };

  // Postpone priority task to tomorrow or future date
  const handlePostponePriority = (id: string, daysAhead = 1) => {
    playPopSound();
    const nextDate = addDays(activeDateKey, daysAhead);
    setPrioritiesList((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, date: nextDate, time: formatDisplayDate(nextDate) } : p));
      try { localStorage.setItem('sreesh-priorities-list-v2', JSON.stringify(next)); } catch {}
      return next;
    });
    triggerCelebration();
  };

  // Toggle goal subtask (awards +milestonePts on milestone achieved, -milestonePts if undone)
  const handleToggleGoalSubtask = (goalId: string, subtaskId: string) => {
    const pts = pointRates.milestonePts;
    setGoalArcs((prev) => {
      const next = prev.map((g) => {
        if (g.id === goalId) {
          const targetSubtask = g.subtasks.find((st) => st.id === subtaskId);
          const willBeCompleted = !targetSubtask?.completed;

          if (willBeCompleted) {
            triggerCelebration();
            updateGlowPoints(pts);
            showPointsFeedback(`🏆 Goal milestone achieved! +${pts} Glow Points!`, pts, 'earn');
          } else {
            playPopSound();
            updateGlowPoints(-pts);
            showPointsFeedback(`Milestone marked pending (-${pts} Glow Points)`, -pts, 'redeem');
          }

          const nextSubtasks = g.subtasks.map((st) => {
            if (st.id === subtaskId) {
              return { ...st, completed: willBeCompleted };
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
      });
      try {
        localStorage.setItem('sreesh-goal-arcs-v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Claim or Unclaim daily streak bonus (+dailyBonusPts once per day)
  const handleClaimBonus = () => {
    const bonus = pointRates.dailyBonusPts;
    if (bonus <= 0) return;

    if (hasClaimedTodayBonus) {
      // Allow unclaiming / resetting bonus
      playPopSound();
      updateGlowPoints(-bonus);
      setLastBonusDate('');
      try {
        localStorage.removeItem(`${HABITS_STORAGE_KEY}-bonus-date`);
      } catch {}
      showPointsFeedback(`Reset Daily Streak Bonus (-${bonus} Glow Points)`, -bonus, 'redeem');
      return;
    }

    updateGlowPoints(bonus);
    setLastBonusDate(TODAY);
    try {
      localStorage.setItem(`${HABITS_STORAGE_KEY}-bonus-date`, TODAY);
    } catch {}
    triggerCelebration();
    showPointsFeedback(`🎉 Claimed +${bonus} Daily Streak Bonus into your Vault!`, bonus, 'earn');
  };

  // Redeem bazaar perk with point deduction & balance check
  const handleRedeemPerk = (perkId: string, cost: number) => {
    const perk = bazaarPerks.find((p) => p.id === perkId);
    if (!perk) return;

    if (glowPoints < cost) {
      playPopSound();
      showPointsFeedback(
        `🔒 Need ${cost - glowPoints} more Glow Points for "${perk.title}". Complete habits to earn points!`,
        cost - glowPoints,
        'redeem'
      );
      return;
    }

    // Deduct points from vault
    updateGlowPoints(-cost);

    // Update perk claim tracking (increment count and record date)
    setBazaarPerks((prev) => {
      const next = prev.map((p) => {
        if (p.id === perkId) {
          const newCount = (p.redeemedCount || 0) + 1;
          return {
            ...p,
            redeemedCount: newCount,
            lastRedeemedDate: TODAY,
            unlocked: true,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('sreesh-bazaar-perks-v2', JSON.stringify(next));
      } catch {}
      return next;
    });

    triggerCelebration();
    showPointsFeedback(`🎉 Redeemed "${perk.title}"! (-${cost} pts) Enjoy your reward! ✨`, cost, 'redeem');
  };

  const handleDeletePerk = (id: string) => {
    playPopSound();
    setBazaarPerks((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try { localStorage.setItem('sreesh-bazaar-perks-v2', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSavePerk = () => {
    if (!perkTitle.trim()) return;
    const costNum = parseInt(perkCost.replace(/[^0-9]/g, ''), 10) || 100;
    const colorClasses = {
      lavender: { bgClass: 'bg-lavender-subtle/70', accentColor: 'text-primary' },
      mint: { bgClass: 'bg-mint-subtle/70', accentColor: 'text-secondary' },
      peach: { bgClass: 'bg-peach-subtle/70', accentColor: 'text-tertiary' },
    };
    const c = colorClasses[perkColor] || colorClasses.lavender;

    if (editingPerk) {
      setBazaarPerks((prev) => {
        const next = prev.map((p) =>
          p.id === editingPerk.id
            ? { ...p, title: perkTitle.trim(), detail: perkDesc.trim() || p.detail, cost: costNum, emoji: perkEmoji.trim() || '🎁', ...c }
            : p
        );
        try { localStorage.setItem('sreesh-bazaar-perks-v2', JSON.stringify(next)); } catch {}
        return next;
      });
      setEditingPerk(null);
    } else {
      const newP = {
        id: 'perk-' + Date.now(),
        title: perkTitle.trim(),
        detail: perkDesc.trim() || 'Custom sanctuary reward',
        cost: costNum,
        emoji: perkEmoji.trim() || '🎁',
        ...c,
        unlocked: false,
      };
      setBazaarPerks((prev) => {
        const next = [...prev, newP];
        try { localStorage.setItem('sreesh-bazaar-perks-v2', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    setPerkTitle('');
    setPerkDesc('');
    setIsPerkModalOpen(false);
    triggerCelebration();
  };

  // Clear completed priorities on active date
  const handleClearDone = () => {
    setPrioritiesList((prev) => prev.filter((p) => {
      const pDate = p.date || TODAY;
      return !(pDate === activeDateKey && p.completed);
    }));
    if (onArchiveCompletedDaily) {
      onArchiveCompletedDaily(activeDateKey);
    }
    playPopSound();
  };

  // Delete habit routine
  const handleDeleteHabit = (id: string) => {
    playPopSound();
    setHabitsList((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try { localStorage.setItem('sreesh-habits-list-v2', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Delete goal arc
  const handleDeleteGoalArc = (id: string) => {
    playPopSound();
    setGoalArcs((prev) => {
      const next = prev.filter((g) => g.id !== id);
      try { localStorage.setItem('sreesh-goal-arcs-v2', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Add new habit or task
  const handleCreateItem = () => {
    const text = newTaskInput.trim();
    if (!text) return;

    if (addMode === 'routine') {
      const colorConfigs = {
        mint: {
          bgClass: 'bg-mint-subtle/80 text-on-secondary-container',
          watermark: 'water_drop',
          watermarkColor: 'text-secondary/10',
          iconBg: 'bg-surface-card',
          iconColor: 'text-secondary',
          btnBgDone: 'bg-secondary text-on-secondary',
        },
        lavender: {
          bgClass: 'bg-lavender-subtle/80 text-on-primary-fixed',
          watermark: 'menu_book',
          watermarkColor: 'text-primary/10',
          iconBg: 'bg-surface-card',
          iconColor: 'text-primary',
          btnBgDone: 'bg-primary text-on-primary',
        },
        sky: {
          bgClass: 'bg-sky-subtle/80 text-on-surface',
          watermark: 'terminal',
          watermarkColor: 'text-sky-accent/10',
          iconBg: 'bg-surface-card',
          iconColor: 'text-sky-accent',
          btnBgDone: 'bg-sky-accent text-on-primary',
        },
        peach: {
          bgClass: 'bg-peach-subtle/90 text-on-tertiary-fixed-variant',
          watermark: 'self_improvement',
          watermarkColor: 'text-tertiary/10',
          iconBg: 'bg-surface-card',
          iconColor: 'text-tertiary',
          btnBgDone: 'bg-tertiary text-on-primary',
        },
      };
      const theme = colorConfigs[newRoutineColor] || colorConfigs.mint;

      if (editingHabit) {
        setHabitsList((prev) => {
          const next = prev.map((h) =>
            h.id === editingHabit.id
              ? {
                  ...h,
                  title: text,
                  detail: newRoutineDetail.trim() || h.detail,
                  emoji: newRoutineEmoji || h.emoji,
                  bgClass: theme.bgClass,
                  watermark: theme.watermark,
                  watermarkColor: theme.watermarkColor,
                  iconColor: theme.iconColor,
                  btnBgDone: theme.btnBgDone,
                }
              : h
          );
          try { localStorage.setItem('sreesh-habits-list-v2', JSON.stringify(next)); } catch {}
          return next;
        });
        setEditingHabit(null);
      } else {
        const newHabit: HabitItemDef = {
          id: 'h-' + Date.now(),
          title: text,
          detail: newRoutineDetail.trim() || 'Daily intentional habit',
          emoji: newRoutineEmoji || '✨',
          badge: '✨ Pending',
          badgeBg: 'bg-surface-card text-tertiary',
          bgClass: theme.bgClass,
          watermark: theme.watermark,
          watermarkColor: theme.watermarkColor,
          iconBg: theme.iconBg,
          iconColor: theme.iconColor,
          btnBgDone: theme.btnBgDone,
          completed: false,
        };

        setHabitsList((prev) => {
          const next = [...prev, newHabit];
          try { localStorage.setItem('sreesh-habits-list-v2', JSON.stringify(next)); } catch {}
          return next;
        });

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
      }
    } else if (addMode === 'goal') {
      const milestonesList = newGoalMilestones
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const subtasks = milestonesList.length > 0
        ? milestonesList.map((m, i) => ({ id: 'st-' + Date.now() + '-' + i, text: m, completed: false }))
        : (editingGoalArc?.subtasks || [
            { id: 'st-' + Date.now() + '-1', text: 'Define roadmap & milestone 1', completed: false },
            { id: 'st-' + Date.now() + '-2', text: 'Execute core build phase', completed: false },
          ]);

      if (editingGoalArc) {
        setGoalArcs((prev) => {
          const next = prev.map((g) =>
            g.id === editingGoalArc.id
              ? {
                  ...g,
                  title: text,
                  emoji: newRoutineEmoji || g.emoji,
                  daysLeft: newGoalTimeline.trim() || g.daysLeft,
                  subtasks,
                  priorityText: newTaskPriority === 'high' ? '🌸 High Priority' : newTaskPriority === 'medium' ? '💜 Medium Priority' : '🌿 Gentle Priority',
                  priorityClass: newTaskPriority === 'high' ? 'bg-peach-subtle text-on-tertiary-fixed-variant' : newTaskPriority === 'medium' ? 'bg-lavender-subtle text-primary' : 'bg-mint-subtle text-secondary',
                }
              : g
          );
          try { localStorage.setItem('sreesh-goal-arcs-v2', JSON.stringify(next)); } catch {}
          return next;
        });
        setEditingGoalArc(null);
      } else {
        const newGoal: GoalArcDef = {
          id: 'g-' + Date.now(),
          title: text,
          emoji: newRoutineEmoji || '🎯',
          priorityText: newTaskPriority === 'high' ? '🌸 High Priority' : newTaskPriority === 'medium' ? '💜 Medium Priority' : '🌿 Gentle Priority',
          priorityClass: newTaskPriority === 'high' ? 'bg-peach-subtle text-on-tertiary-fixed-variant' : newTaskPriority === 'medium' ? 'bg-lavender-subtle text-primary' : 'bg-mint-subtle text-secondary',
          progressPercent: 0,
          progressLabel: `0% completed (0/${subtasks.length} Milestones)`,
          daysLeft: newGoalTimeline.trim() || '30 days left',
          barColor: newTaskPriority === 'high' ? 'bg-tertiary' : 'bg-secondary',
          subtasks,
        };

        setGoalArcs((prev) => {
          const next = [...prev, newGoal];
          try { localStorage.setItem('sreesh-goal-arcs-v2', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    } else {
      // Daily priority or Advance priority task
      const targetDate = newTaskDate || activeDateKey || TODAY;
      const newP: PriorityTaskDef = {
        id: 'p-' + Date.now(),
        priority: newTaskPriority === 'low' ? 'gentle' : newTaskPriority,
        time: targetDate === TODAY ? 'Today' : formatDisplayDate(targetDate),
        text,
        completed: false,
        date: targetDate,
      };

      setPrioritiesList((prev) => {
        const next = [...prev, newP];
        try { localStorage.setItem('sreesh-priorities-list-v2', JSON.stringify(next)); } catch {}
        return next;
      });

      if (onAddTodo) {
        onAddTodo(text, 'daily', newTaskPriority, targetDate, ['priority']);
      }

      // If scheduled for an advance or different date, switch active date
      if (targetDate !== activeDateKey && onSelectDate) {
        onSelectDate(targetDate);
      }
    }

    setNewTaskInput('');
    setNewRoutineDetail('');
    setNewGoalMilestones('');
    setIsAddModalOpen(false);
    triggerCelebration();
    return;
  };

  return (
    <div className="bg-canvas-bg font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen">
      
      {/* ======================================================== */}
      {/* 1. FIXED TOP HEADER MATCHING STITCH 1:1                  */}
      {/* ======================================================== */}
      <header className={`fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}>
        <div className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-space-sm w-full max-w-7xl mx-auto">
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
        <div className="flex flex-col w-full px-4 sm:px-6 lg:px-10 space-y-space-lg w-full max-w-7xl mx-auto">
          
          {/* Top Overview: Progress Card + Week at a Glance (2 columns on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md lg:gap-space-lg items-stretch mt-2">
            {/* Section 1: Gamified Header / Progress Card */}
            <section className="relative overflow-hidden bg-surface-card rounded-3xl p-space-lg shadow-sm border border-border-subtle flex flex-col justify-between">
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
                    <span className="text-on-surface font-semibold">
                      {(streakState?.currentStreak || 0) > 0 ? `${streakState?.currentStreak} Day Streak` : '0 Day Streak'}
                    </span>
                    <span className="text-on-surface-variant font-normal">
                      {(streakState?.currentStreak || 0) > 0 ? '· Keep it up!' : '· Ready to begin'}
                    </span>
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
            <section className="bg-surface-card rounded-3xl p-space-md shadow-sm border border-border-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm px-1 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center bg-surface-container-low border border-border-subtle rounded-xl p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={handlePrevWeek}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container active:scale-90 text-on-surface transition-all cursor-pointer"
                      title="Previous week"
                      aria-label="Previous week"
                    >
                      <span className="material-symbols-outlined text-[17px] leading-none">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container active:scale-90 text-on-surface transition-all cursor-pointer"
                      title="Next week"
                      aria-label="Next week"
                    >
                      <span className="material-symbols-outlined text-[17px] leading-none">chevron_right</span>
                    </button>
                  </div>
                  <span className="font-label-md text-label-md font-semibold text-on-surface whitespace-nowrap">
                    Week {displayedWeekNumber} · Habit Journey
                  </span>
                  {weekOffset !== 0 && (
                    <button
                      type="button"
                      onClick={handleResetToCurrentWeek}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs"
                      title="Return to current week (Today)"
                    >
                      <span>↺</span> This Week
                    </button>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-mint-subtle px-2 py-0.5 rounded-full font-bold">
                  <span>★</span> {
                    weekOffset < 0 
                      ? '100% Logged' 
                      : weekOffset > 0 
                      ? 'Upcoming Plan' 
                      : (daysConfig.findIndex((d) => d.isToday) >= 5 ? '100% on Mon–Fri' : '100% on Mon–Thu')
                  }
                </span>
              </div>
              <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                {daysConfig.map((d) => {
                  const isSelected = selectedDay === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        playPopSound();
                        setSelectedDay(d.key);
                        const targetDate = dayDateMap[d.key];
                        if (onSelectDate && targetDate) {
                          onSelectDate(targetDate);
                        }
                      }}
                      className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                        d.isToday
                          ? isSelected
                            ? 'bg-primary text-on-primary shadow-md scale-105 ring-2 ring-primary-fixed'
                            : 'bg-primary/90 text-on-primary shadow-sm'
                          : isSelected
                          ? 'bg-mint-subtle text-secondary ring-2 ring-secondary font-bold scale-105'
                          : d.completed
                          ? 'bg-mint-subtle/70 text-on-secondary-container hover:bg-mint-subtle'
                          : 'bg-surface-container text-on-surface-variant opacity-75 hover:opacity-100'
                      }`}
                      title={d.desc}
                    >
                      <span className="font-label-sm text-label-sm font-semibold">{d.label}</span>
                      {d.isToday ? (
                        <span className="text-[13px] mt-1 font-bold">🌟</span>
                      ) : d.completed ? (
                        <span className="material-symbols-outlined text-[15px] mt-1 font-bold">check_circle</span>
                      ) : (
                        <span className="font-body-sm text-body-sm mt-1">•</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Interactive Day Status Banner */}
              <div className="p-2 rounded-xl bg-surface-container-low text-[11px] text-on-surface-variant flex items-center justify-between border border-border-subtle/50">
                <span className="flex items-center gap-1 font-medium">
                  <span>📅</span>
                  <span>
                    {(() => {
                      const activeConfig = daysConfig.find((d) => d.key === selectedDay);
                      if (!activeConfig) return 'Habits view';
                      if (activeConfig.isToday) {
                        return `${activeConfig.fullName} (Today): ${completedRoutines}/${totalRoutines} done (${focusPercent}%) - Keep glowing!`;
                      }
                      if (activeConfig.completed) {
                        return `${activeConfig.fullName}: Logged routines (100% ★) · ${formatDisplayDate(activeConfig.dateKey)}`;
                      }
                      return `${activeConfig.fullName}: Planned rituals & sanctuary planning · ${formatDisplayDate(activeConfig.dateKey)}`;
                    })()}
                  </span>
                </span>
                <span className="text-primary font-bold text-[10px]">
                  {dayDateMap[selectedDay] === TODAY ? 'Active' : isBefore(dayDateMap[selectedDay], TODAY) ? 'Logged' : 'Upcoming'}
                </span>
              </div>
            </div>
            </section>
          </div>

          {/* Main Workspace: Daily Habits + Priorities (2 columns on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md lg:gap-space-lg items-start">
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
              {habitsList.length === 0 && (
                <div className="p-6 bg-surface-card rounded-2xl border border-dashed border-border-subtle text-center text-xs text-on-surface-variant space-y-1">
                  <p className="font-semibold text-on-surface">No daily habits yet</p>
                  <p>Tap + below or Organize to add your first intentional habit!</p>
                </div>
              )}
              {habitsList.map((habit) => (
                <div 
                  key={habit.id}
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`habit-item relative ${habit.bgClass} rounded-2xl p-space-md transition-all duration-300 shadow-sm border border-border-subtle cursor-pointer select-none active:scale-[0.99] hover:shadow-md ${
                    activeHabitMenuId === habit.id ? 'z-50' : 'z-0'
                  }`}
                  title={habit.completed ? 'Click anywhere to mark pending' : 'Click anywhere to mark completed!'}
                >
                  {/* Isolated Watermark container with overflow-hidden so the dropdown never gets clipped */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none select-none">
                    <div className={`absolute -right-3 -bottom-4 ${habit.watermarkColor}`}>
                      <span className="material-symbols-outlined text-[80px]">{habit.watermark}</span>
                    </div>
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
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Combined Edit & Delete dropdown trigger (small single button) */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPopSound();
                            setActiveHabitMenuId(activeHabitMenuId === habit.id ? null : habit.id);
                          }}
                          className="w-7 h-7 rounded-full bg-surface-card/70 hover:bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shadow-2xs"
                          title="Habit Options (Edit / Delete)"
                        >
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>

                        {activeHabitMenuId === habit.id && (
                          <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setActiveHabitMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface-card rounded-2xl shadow-2xl border border-border-subtle p-1.5 min-w-[140px] text-xs space-y-1 animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPopSound();
                                  setActiveHabitMenuId(null);
                                  setEditingHabit(habit);
                                  setAddMode('routine');
                                  setNewTaskInput(habit.title);
                                  setNewRoutineDetail(habit.detail);
                                  setNewRoutineEmoji(habit.emoji);
                                  setIsAddModalOpen(true);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-lavender-subtle hover:text-primary flex items-center gap-1.5 cursor-pointer font-medium"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                <span>Edit Habit</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPopSound();
                                  setActiveHabitMenuId(null);
                                  handleDeleteHabit(habit.id);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-peach-subtle hover:text-tertiary flex items-center gap-1.5 cursor-pointer text-tertiary font-medium"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                <span>Delete Habit</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Tick / Mark complete button at the very END */}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHabit(habit.id);
                        }}
                        className={`habit-toggle w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform cursor-pointer ${
                          habit.completed 
                            ? habit.btnBgDone 
                            : 'bg-surface-card text-tertiary border border-border-subtle hover:border-primary/50'
                        }`}
                        title={habit.completed ? 'Completed' : 'Mark complete'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {habit.completed ? 'check' : 'radio_button_unchecked'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Quick Task Priorities Section */}
          <section className="space-y-space-md">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface font-fraunces">
                  {activeDateKey === TODAY 
                    ? "Today's Priorities" 
                    : isAfter(activeDateKey, TODAY) 
                    ? "Advance Priorities" 
                    : "Priorities Log"}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                  activeDateKey === TODAY
                    ? 'bg-sunshine-subtle text-sunshine-accent'
                    : isAfter(activeDateKey, TODAY)
                    ? 'bg-mint-subtle text-secondary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {activeDateKey === TODAY 
                    ? `${remainingPriorities} Remaining` 
                    : isAfter(activeDateKey, TODAY)
                    ? `${remainingPriorities} Scheduled (${formatDisplayDate(activeDateKey)})`
                    : remainingPriorities === 0 && displayPriorities.length > 0
                    ? `All Done ✨ (${displayPriorities.length} Tasks)`
                    : `${remainingPriorities} Incomplete`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {displayPriorities.some(p => p.completed) && (
                  <button 
                    onClick={handleClearDone}
                    className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors cursor-pointer"
                  >
                    Clear Done
                  </button>
                )}
                <button
                  onClick={() => {
                    playPopSound();
                    setAddMode('daily');
                    setNewTaskDate(activeDateKey);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-xs font-bold hover:bg-primary-container active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Set Priority</span>
                </button>
              </div>
            </div>

            {/* Task Cards Container */}
            <div className="space-y-2.5">
              {displayPriorities.length === 0 && (
                <div className="p-6 bg-surface-card rounded-2xl border border-dashed border-border-subtle text-center text-xs text-on-surface-variant space-y-2">
                  <div className="text-2xl">🌱</div>
                  <p className="font-semibold text-on-surface">
                    {activeDateKey === TODAY 
                      ? "No priority tasks set for today" 
                      : isAfter(activeDateKey, TODAY)
                      ? `No advance priorities scheduled for ${formatDisplayDate(activeDateKey)}`
                      : `No priorities recorded for ${formatDisplayDate(activeDateKey)}`}
                  </p>
                  <p className="text-[11px]">
                    {isAfter(activeDateKey, TODAY)
                      ? "Plan ahead! Set high-impact priorities before the day arrives."
                      : "Tap below to add what matters most!"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setAddMode('daily');
                      setNewTaskDate(activeDateKey);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
                  >
                    <span>+ Set Priority for {activeDateKey === TODAY ? 'Today' : formatDisplayDate(activeDateKey)}</span>
                  </button>
                </div>
              )}

              {displayPriorities.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => handleTogglePriority(task.id, task.isExternalTodo)}
                  className={`task-card relative flex items-start gap-3.5 p-space-md rounded-2xl shadow-sm transition-all duration-200 border border-border-subtle cursor-pointer select-none active:scale-[0.99] hover:shadow-md ${
                    activePriorityMenuId === task.id ? 'z-50' : 'z-0'
                  } ${
                    task.completed 
                      ? 'bg-surface-container-low opacity-75' 
                      : 'bg-surface-card'
                  }`}
                  title={task.completed ? 'Click anywhere to mark pending' : 'Click anywhere to mark completed!'}
                >
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePriority(task.id, task.isExternalTodo);
                    }}
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
                      {task.date && task.date !== TODAY && (
                        <span className="font-label-sm text-[11px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary flex items-center gap-1">
                          <span>📅</span> {formatDisplayDate(task.date)}
                        </span>
                      )}
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
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playPopSound();
                        setActivePriorityMenuId(activePriorityMenuId === task.id ? null : task.id);
                      }}
                      className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer rounded-full hover:bg-surface-container"
                      title="Options"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                    {activePriorityMenuId === task.id && (
                      <>
                        <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setActivePriorityMenuId(null); }} />
                        <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface-card rounded-2xl shadow-2xl border border-border-subtle p-1.5 min-w-[170px] text-xs space-y-1 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            handleTogglePriority(task.id, task.isExternalTodo);
                            setActivePriorityMenuId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-surface-container flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">{task.completed ? 'undo' : 'check'}</span>
                          <span>{task.completed ? 'Mark Undone' : 'Mark Done'}</span>
                        </button>
                        {!task.isExternalTodo && (
                          <>
                            <button
                              onClick={() => {
                                handlePostponePriority(task.id, 1);
                                setActivePriorityMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-surface-container flex items-center gap-1.5 cursor-pointer text-primary font-medium"
                            >
                              <span className="material-symbols-outlined text-[15px]">event_repeat</span>
                              <span>Postpone to Tomorrow</span>
                            </button>
                            <button
                              onClick={() => {
                                handlePostponePriority(task.id, 7);
                                setActivePriorityMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-surface-container flex items-center gap-1.5 cursor-pointer text-primary font-medium"
                            >
                              <span className="material-symbols-outlined text-[15px]">next_plan</span>
                              <span>Shift to Next Week (+7d)</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            handleDeletePriority(task.id, task.isExternalTodo);
                            setActivePriorityMenuId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-peach-subtle text-tertiary flex items-center gap-1.5 cursor-pointer font-semibold"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Long-Term Goals + Cozy Reward Bazaar (2 columns on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md lg:gap-space-lg items-start">
          {/* Section 5: Long-Term Goals (3 Active Arcs) */}
          <section className="space-y-space-md">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Long-Term Goals</span>
                <span className="px-2 py-0.5 rounded-full bg-lavender-subtle text-primary font-label-sm text-label-sm font-bold">
                  {goalArcs.length} Active Arcs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    playPopSound();
                    setEditingGoalArc(null);
                    setAddMode('goal');
                    setNewTaskInput('');
                    setNewGoalTimeline('30 days left');
                    setNewGoalMilestones('');
                    setIsAddModalOpen(true);
                  }}
                  className="font-label-sm text-label-sm text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>New Goal</span>
                </button>
                <button 
                  onClick={() => {
                    playPopSound();
                    setIsAddModalOpen(true);
                  }}
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Q3 Vision ✨</span>
                </button>
              </div>
            </div>

            <div className="space-y-space-sm">
              {goalArcs.length === 0 && (
                <div className="p-6 bg-surface-card rounded-2xl border border-dashed border-border-subtle text-center text-xs text-on-surface-variant space-y-1">
                  <p className="font-semibold text-on-surface">No long-term goals yet</p>
                  <p>Tap + New Goal above to create milestone arcs for big dreams!</p>
                </div>
              )}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold shrink-0 ${arc.priorityClass}`}>
                        {arc.priorityText}
                      </span>
                      <button
                        onClick={() => {
                          playPopSound();
                          setEditingGoalArc(arc);
                          setAddMode('goal');
                          setNewTaskInput(arc.title);
                          setNewRoutineEmoji(arc.emoji);
                          setNewGoalTimeline(arc.daysLeft);
                          setNewGoalMilestones(arc.subtasks.map((s) => s.text).join(', '));
                          setIsAddModalOpen(true);
                        }}
                        className="w-7 h-7 rounded-full hover:bg-lavender-subtle hover:text-primary flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors active:scale-95"
                        title="Edit goal arc"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteGoalArc(arc.id)}
                        className="w-7 h-7 rounded-full hover:bg-peach-subtle hover:text-tertiary flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors active:scale-95"
                        title="Delete goal arc"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sunshine-subtle text-sunshine-accent flex items-center justify-center text-2xl shadow-sm shrink-0">
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="font-label-sm text-[11px] text-on-surface-variant">
                      ✨ +{pointRates.habitPts}/habit · +{pointRates.priorityPts}/priority · +{pointRates.milestonePts}/milestone{pointRates.dailyBonusPts > 0 ? ` · +${pointRates.dailyBonusPts} daily bonus` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        playPopSound();
                        setTempPointRates(pointRates);
                        setIsEditRatesModalOpen(true);
                      }}
                      className="font-label-sm text-[10px] text-primary font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors shadow-2xs"
                      title="Edit Reward Point Values"
                    >
                      <span className="material-symbols-outlined text-[12px]">tune</span>
                      <span>Edit Rates</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Claim Streak Bonus Button (Only rendered if daily bonus rate > 0) */}
              {pointRates.dailyBonusPts > 0 && (
                <button 
                  id="claim-bonus-btn"
                  onClick={handleClaimBonus}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-label-sm text-xs font-bold shadow-sm transition-all cursor-pointer ${
                    hasClaimedTodayBonus 
                      ? 'bg-surface-container-high text-secondary border border-secondary/30 hover:bg-surface-container-highest active:scale-95' 
                      : 'bg-primary text-on-primary hover:bg-primary-container hover:scale-105 active:scale-95 shadow-md'
                  }`}
                  title={hasClaimedTodayBonus ? 'Claimed today (Click to unclaim/reset)' : `Claim +${pointRates.dailyBonusPts} Streak Bonus`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {hasClaimedTodayBonus ? 'check_circle' : 'stars'}
                  </span>
                  <span>{hasClaimedTodayBonus ? '✓ Claimed Today' : `Claim +${pointRates.dailyBonusPts} Streak Bonus`}</span>
                </button>
              )}
            </div>

            {/* Interactive Points Toast Feedback Banner */}
            {pointsToast && (
              <div 
                id="points-feedback-toast" 
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-label-sm text-xs shadow-sm transition-all duration-300 animate-fadeIn ${
                  pointsToast.type === 'earn'
                    ? 'bg-mint-subtle text-on-secondary-container border border-secondary/20'
                    : 'bg-peach-subtle text-on-tertiary-container border border-tertiary/20'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <span>{pointsToast.type === 'earn' ? '🎉' : '✨'}</span>
                  <span>{pointsToast.message}</span>
                </span>
                <span className="font-bold shrink-0 ml-2">Vault: {glowPoints} Pts</span>
              </div>
            )}

            {/* Cozy Reward Bazaar Sub-grid (Add, Edit, Claim & Delete Rewards) */}
            <div className="pt-2 border-t border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                    Cozy Reward Bazaar
                  </span>
                  <p className="font-body-sm text-[11px] text-on-surface-variant hidden sm:block">
                    Redeem your hard-earned Glow Points for cozy self-care treats.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setEditingPerk(null);
                      setPerkTitle('');
                      setPerkCost('50');
                      setPerkDesc('');
                      setPerkEmoji('🎁');
                      setIsPerkModalOpen(true);
                    }}
                    className="font-label-sm text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>New Reward</span>
                  </button>
                  <span className="font-label-sm text-xs text-on-surface-variant">· {bazaarPerks.length} Perks</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {bazaarPerks.length === 0 && (
                  <div className="col-span-1 sm:col-span-3 p-4 bg-surface-container-low rounded-2xl border border-dashed border-border-subtle text-center text-xs text-on-surface-variant">
                    No custom perks yet. Click <span className="font-semibold text-primary">+ New Reward</span> to create incentives for your glow points!
                  </div>
                )}
                {bazaarPerks.map((perk) => {
                  const canAfford = glowPoints >= perk.cost;
                  return (
                    <div 
                      key={perk.id} 
                      className={`p-3 rounded-2xl ${perk.bgClass || 'bg-lavender-subtle/70'} flex flex-col justify-between gap-2.5 border border-border-subtle group hover:border-primary/40 transition-all shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{perk.emoji}</span>
                          <div className="flex items-center gap-1">
                            <span className={`font-label-sm text-[10px] font-bold ${perk.accentColor || 'text-primary'} bg-surface-card px-2 py-0.5 rounded-full shadow-2xs`}>
                              {perk.cost} Pts
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                playPopSound();
                                setEditingPerk(perk);
                                setPerkTitle(perk.title);
                                setPerkCost(String(perk.cost));
                                setPerkDesc(perk.detail);
                                setPerkEmoji(perk.emoji);
                                setIsPerkModalOpen(true);
                              }}
                              className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors text-[10px] cursor-pointer"
                              title="Edit Perk"
                            >
                              <span className="material-symbols-outlined text-[12px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePerk(perk.id)}
                              className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:text-tertiary transition-colors text-[10px] cursor-pointer"
                              title="Delete Perk"
                            >
                              <span className="material-symbols-outlined text-[12px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="font-headline-sm text-[13px] text-on-surface mt-1.5 leading-tight font-semibold font-fraunces">
                          {perk.title}
                        </p>
                        <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">{perk.detail}</p>
                        {perk.redeemedCount > 0 && (
                          <div className="mt-1 text-[10px] font-semibold text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">stars</span>
                            <span>Claimed {perk.redeemedCount}×</span>
                          </div>
                        )}
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleRedeemPerk(perk.id, perk.cost)}
                        className={`w-full py-2 px-3 text-center rounded-xl font-label-sm text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          canAfford
                            ? 'bg-primary text-on-primary hover:bg-primary-container hover:shadow-md'
                            : 'bg-surface-card/90 text-on-surface-variant border border-border-subtle hover:bg-surface-container-high'
                        }`}
                        title={canAfford ? `Claim "${perk.title}" for ${perk.cost} Pts` : `Need ${perk.cost - glowPoints} more Glow Points to claim`}
                      >
                        {canAfford ? (
                          <>
                            <span>Claim for {perk.cost} Pts</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>
                            <span>Need {perk.cost - glowPoints} more pts</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

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
        <div role="dialog" aria-modal="true" data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
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
                  <span className="font-bold text-xs text-secondary">
                    {(streakState?.currentStreak || 0) > 0 ? `🔥 ${streakState?.currentStreak} Day Streak Active` : '🌱 Ready for Day 1'}
                  </span>
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

      {/* Add / Edit Reward Perk Modal */}
      {isPerkModalOpen && (
        <div role="dialog" aria-modal="true" data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface font-fraunces">
                  {editingPerk ? 'Edit Reward Perk' : 'New Sanctuary Reward'}
                </h3>
              </div>
              <button 
                onClick={() => setIsPerkModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">Customize incentives in your Cozy Reward Bazaar.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Perk Title</label>
                <input
                  type="text"
                  placeholder="e.g. Matcha Latte Break, Boba Tea, Game Block"
                  value={perkTitle}
                  onChange={(e) => setPerkTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Description / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Guilt-free offline treat, 30m unwind"
                  value={perkDesc}
                  onChange={(e) => setPerkDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Glow Points Cost</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={perkCost}
                    onChange={(e) => setPerkCost(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="🎁"
                    value={perkEmoji}
                    onChange={(e) => setPerkEmoji(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Color Palette</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lavender', label: '💜 Lavender' },
                    { id: 'mint', label: '🌱 Mint' },
                    { id: 'peach', label: '🌸 Peach' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPerkColor(c.id as any)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        perkColor === c.id
                          ? 'bg-lavender-subtle border-primary text-primary shadow-xs'
                          : 'bg-surface-container border-border-subtle text-on-surface-variant'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
              {editingPerk && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeletePerk(editingPerk.id);
                    setIsPerkModalOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-full bg-peach-subtle text-tertiary font-bold text-xs hover:bg-peach-subtle/80 cursor-pointer"
                >
                  Delete 🗑️
                </button>
              )}
              <button
                type="button"
                onClick={handleSavePerk}
                className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
              >
                {editingPerk ? 'Save Perk' : 'Create Perk ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Point Rates Modal */}
      {isEditRatesModalOpen && (
        <div role="dialog" aria-modal="true" data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface font-fraunces">
                  Customize Point Rewards
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditRatesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Set how many Glow Points are awarded for each healthy habit, priority, milestone, and streak bonus.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  🌟 Habit Routine Completion
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={tempPointRates.habitPts}
                    onChange={(e) => setTempPointRates(prev => ({ ...prev, habitPts: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full px-3.5 py-2 pr-20 rounded-xl bg-surface-container-low border border-border-subtle text-xs font-semibold focus:outline-none focus:border-primary"
                    placeholder="20"
                  />
                  <span className="absolute right-3 text-[11px] text-on-surface-variant font-medium pointer-events-none">pts / habit</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  🎯 Priority Task Completion
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={tempPointRates.priorityPts}
                    onChange={(e) => setTempPointRates(prev => ({ ...prev, priorityPts: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full px-3.5 py-2 pr-20 rounded-xl bg-surface-container-low border border-border-subtle text-xs font-semibold focus:outline-none focus:border-primary"
                    placeholder="15"
                  />
                  <span className="absolute right-3 text-[11px] text-on-surface-variant font-medium pointer-events-none">pts / priority</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  🏆 Goal Milestone Completion
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={tempPointRates.milestonePts}
                    onChange={(e) => setTempPointRates(prev => ({ ...prev, milestonePts: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full px-3.5 py-2 pr-24 rounded-xl bg-surface-container-low border border-border-subtle text-xs font-semibold focus:outline-none focus:border-primary"
                    placeholder="25"
                  />
                  <span className="absolute right-3 text-[11px] text-on-surface-variant font-medium pointer-events-none">pts / milestone</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  ✨ Daily Streak Bonus
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={tempPointRates.dailyBonusPts}
                    onChange={(e) => setTempPointRates(prev => ({ ...prev, dailyBonusPts: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full px-3.5 py-2 pr-20 rounded-xl bg-surface-container-low border border-border-subtle text-xs font-semibold focus:outline-none focus:border-primary"
                    placeholder="50"
                  />
                  <span className="absolute right-3 text-[11px] text-on-surface-variant font-medium pointer-events-none">pts / day</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleResetPointRates}
                className="text-xs text-on-surface-variant hover:text-primary font-bold cursor-pointer underline"
              >
                Reset Defaults
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditRatesModalOpen(false)}
                  className="py-2 px-3 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePointRates}
                  className="py-2 px-4 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
                >
                  Save Rates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ADD HABIT OR TASK MODAL                                */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div role="dialog" aria-modal="true" data-modal="true" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
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
                Priority / Advance
              </button>
              <button
                onClick={() => setAddMode('routine')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  addMode === 'routine' ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                Daily Habit
              </button>
              <button
                onClick={() => setAddMode('goal')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  addMode === 'goal' ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                Long-Term Goal
              </button>
            </div>

            {/* Task Title Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  {addMode === 'routine' ? 'Habit / Routine Title' : addMode === 'goal' ? 'Long-Term Goal Title' : 'Priority Task Title'}
                </label>
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder={
                    addMode === 'routine'
                      ? 'e.g., Morning 2.5L Water, Read 20 pages'
                      : addMode === 'goal'
                      ? 'e.g., Master TypeScript & Next.js'
                      : 'e.g., Deploy mobile app to Vercel'
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-lowest"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateItem();
                  }}
                />
              </div>

              {addMode === 'routine' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Subtitle / Goal Target</label>
                    <input
                      type="text"
                      value={newRoutineDetail}
                      onChange={(e) => setNewRoutineDetail(e.target.value)}
                      placeholder="e.g., 8 glasses logged · Hydrated & glowing"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Emoji Icon</label>
                      <input
                        type="text"
                        value={newRoutineEmoji}
                        onChange={(e) => setNewRoutineEmoji(e.target.value)}
                        placeholder="e.g. 💧, 📖, 🧘, ✨"
                        className="w-full px-3 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Color Theme</label>
                      <select
                        value={newRoutineColor}
                        onChange={(e) => setNewRoutineColor(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest font-medium"
                      >
                        <option value="mint">🌱 Mint Clean</option>
                        <option value="lavender">💜 Lavender Focus</option>
                        <option value="sky">💻 Sky Tech</option>
                        <option value="peach">🌸 Peach Warmth</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {addMode === 'daily' && (
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-on-surface-variant">
                        Scheduled Date
                      </label>
                      <span className="text-[11px] font-semibold text-primary">
                        {newTaskDate === TODAY 
                          ? 'Today' 
                          : isAfter(newTaskDate, TODAY) 
                          ? `Advance (+${diffInDays(newTaskDate, TODAY)}d)` 
                          : formatDisplayDate(newTaskDate)}
                      </span>
                    </div>
                    
                    {/* Quick Date Pills */}
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setNewTaskDate(TODAY)}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                          newTaskDate === TODAY
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container border-border-subtle text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTaskDate(addDays(TODAY, 1))}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                          newTaskDate === addDays(TODAY, 1)
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container border-border-subtle text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTaskDate(addDays(TODAY, 2))}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                          newTaskDate === addDays(TODAY, 2)
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container border-border-subtle text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        +2 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTaskDate(addDays(TODAY, 7))}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                          newTaskDate === addDays(TODAY, 7)
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container border-border-subtle text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        +7 Days
                      </button>
                    </div>

                    <input
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest font-medium text-on-surface"
                    />
                  </div>
                </div>
              )}

              {addMode === 'goal' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Timeline / Target Date</label>
                    <input
                      type="text"
                      value={newGoalTimeline}
                      onChange={(e) => setNewGoalTimeline(e.target.value)}
                      placeholder="e.g., 42 days left, Target Nov 2026"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Initial Milestones (comma-separated)</label>
                    <input
                      type="text"
                      value={newGoalMilestones}
                      onChange={(e) => setNewGoalMilestones(e.target.value)}
                      placeholder="e.g. Build middleware, Test endpoints, Ship release"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border-subtle text-xs bg-surface-container-lowest"
                    />
                  </div>
                </>
              )}
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
              {addMode === 'daily'
                ? newTaskDate === TODAY
                  ? "Add to Today's Priorities ✨"
                  : `Schedule for ${formatDisplayDate(newTaskDate)} ✨`
                : addMode === 'routine'
                ? 'Save Daily Habit ✨'
                : 'Create Goal Arc ✨'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
