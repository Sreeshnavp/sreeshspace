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

const MS: Array<[number, string, number]> = [
  [3, 'Starter', 30],
  [7, 'Week Warrior', 70],
  [14, 'Habit Builder', 150],
  [30, 'Monthly Master', 300],
  [60, 'Unstoppable', 600],
  [100, 'Legend', 1000]
];

const LV: Array<[number, string, string]> = [
  [0, 'Seedling', '🌱'],
  [100, 'Sprout', '🌿'],
  [250, 'Sapling', '🪴'],
  [500, 'Bloom', '🌸'],
  [900, 'Grove', '🌳'],
  [1500, 'Evergreen', '🌲']
];

const MOOD_MAP: Array<{ emoji: string; label: string; score: 2 | 3 | 4 | 5 }> = [
  { emoji: '🌿', label: 'Steady', score: 4 },
  { emoji: '🌞', label: 'Great', score: 5 },
  { emoji: '😴', label: 'Tired', score: 3 },
  { emoji: '🌧️', label: 'Tough', score: 2 }
];

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
}) => {
  const TODAY = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Local persistent orbit state (score, claim records, rewards, point settings)
  const [orbitData, setOrbitData] = useState<{
    score: number;
    cl: { d: Record<string, number>; m: Record<number, number> };
    pts: { l: number; n: number; h: number };
    rewards: HabitReward[];
  }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HABITS_STORAGE_KEY) || '{}');
      return {
        score: typeof saved.score === 'number' ? saved.score : 0,
        cl: saved.cl || { d: {}, m: {} },
        pts: saved.pts || { l: 5, n: 10, h: 15 },
        rewards: Array.isArray(saved.rewards) && saved.rewards.length > 0 
          ? saved.rewards 
          : [
              { id: 'r1', n: 'Movie night 🍿', p: 300 },
              { id: 'r2', n: 'Treat day 🍰', p: 600 }
            ],
      };
    } catch {
      return {
        score: 0,
        cl: { d: {}, m: {} },
        pts: { l: 5, n: 10, h: 15 },
        rewards: [
          { id: 'r1', n: 'Movie night 🍿', p: 300 },
          { id: 'r2', n: 'Treat day 🍰', p: 600 }
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
  const [addMode, setAddMode] = useState<'once' | 'routine'>('once');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskViewTab, setTaskViewTab] = useState<'all' | 'routine' | 'today'>('all');
  const [isManageRoutinesOpen, setIsManageRoutinesOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [reflectionSavedNotice, setReflectionSavedNotice] = useState(false);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [timelineHint, setTimelineHint] = useState<string>('');
  const [goalsView, setGoalsView] = useState<'cards' | 'time'>('cards');
  const [goalsFilter, setGoalsFilter] = useState<'all' | 'active' | 'done'>('all');
  
  // Heatmap scroll ref to automatically show current day
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  // New reward inputs
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPts, setNewRewardPts] = useState('');

  // New goal inputs
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'task' | 'routine' | 'reward' | 'goal' } | null>(null);

  // Sound & confetti delight helper
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#2C5A45', '#FFD27A', '#F6A25B', '#8FC3A5', '#FFF1CC']
      });
    } catch {}
  };

  // =========================================================================
  // PURE HABIT & TASK STREAK CALCULATION (NO EXTERNAL MENUS / LINKS / NOTES)
  // =========================================================================
  const { curStreak, bestStreak, totalActiveDays, isTodayActive, activeDatesSet } = useMemo(() => {
    const activeDates = new Set<string>();

    // 1. Completed daily tasks
    todos.forEach((t) => {
      if (t.completed && (t.type === 'daily' || !t.type) && t.status !== 'archived') {
        const d = t.completedAt?.slice(0, 10) || t.date || t.createdAt.slice(0, 10);
        if (d) activeDates.add(d);
      }
    });

    // 2. DayLogs completed counts
    Object.entries(dayLogs).forEach(([k, log]) => {
      if (log.completed && log.completed > 0) {
        activeDates.add(k);
      }
    });

    const isTodayActive = activeDates.has(TODAY);

    // Calculate current streak
    let cur = 0;
    let checkDate = TODAY;
    if (!isTodayActive) {
      // If not active today, check if yesterday was active to keep streak alive
      const yesterday = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
      checkDate = yesterday;
    }

    while (activeDates.has(checkDate)) {
      cur++;
      const prevDate = new Date(new Date(checkDate).getTime() - 864e5).toLocaleDateString('en-CA');
      checkDate = prevDate;
    }

    // Calculate best streak
    const sortedDates = Array.from(activeDates).sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;

    sortedDates.forEach((d) => {
      if (prev) {
        const expectedNext = new Date(new Date(prev).getTime() + 864e5).toLocaleDateString('en-CA');
        run = d === expectedNext ? run + 1 : 1;
      } else {
        run = 1;
      }
      prev = d;
      if (run > best) best = run;
    });

    return {
      curStreak: cur,
      bestStreak: Math.max(best, cur),
      totalActiveDays: activeDates.size,
      isTodayActive,
      activeDatesSet: activeDates
    };
  }, [todos, dayLogs, TODAY]);

  // Milestone info
  const nextMilestone = MS.find((m) => m[0] > curStreak) || MS[MS.length - 1];
  const prevMilestone = [...MS].reverse().find((m) => m[0] <= curStreak);

  // Daily focus tasks for selectedDate
  const dailyTodos = useMemo(() => {
    return todos.filter((t) => (t.type === 'daily' || !t.type) && t.status !== 'archived');
  }, [todos]);

  const selectedDateTasks = useMemo(() => {
    return dailyTodos.filter((t) => {
      const itemDate = t.date || t.createdAt.slice(0, 10);
      return itemDate === selectedDate || (itemDate < selectedDate && selectedDate <= TODAY && !t.completed);
    });
  }, [dailyTodos, selectedDate, TODAY]);

  // =========================================================================
  // FIXED ROUTINES: ONLY SHOW ON OR AFTER THE DAY THEY WERE ADDED (from <= selectedDate)
  // =========================================================================
  const routineTasks = useMemo(() => {
    return routines
      .filter((r) => {
        const fromDate = r.startDate || r.createdAt.slice(0, 10);
        return fromDate <= selectedDate;
      })
      .map((r) => {
        const existingDaily = dailyTodos.find(
          (t) => t.recurringId === r.id && (t.date === selectedDate || t.createdAt.slice(0, 10) === selectedDate)
        );
        return {
          id: existingDaily ? existingDaily.id : r.id,
          routineId: r.id,
          text: r.text,
          completed: existingDaily ? existingDaily.completed : false,
          priority: r.priority || 'medium',
          isRoutine: true,
          tag: r.tags?.[0] || 'routine',
          carried: false
        };
      });
  }, [routines, dailyTodos, selectedDate]);

  // Standalone one-off daily tasks
  const standaloneTasks = useMemo(() => {
    return selectedDateTasks
      .filter((t) => !t.recurringId)
      .map((t) => ({
        id: t.id,
        routineId: undefined,
        text: t.text,
        completed: t.completed,
        priority: t.priority,
        isRoutine: false,
        tag: t.tags?.[0] || '',
        carried: (t.date || t.createdAt.slice(0, 10)) < selectedDate
      }));
  }, [selectedDateTasks, selectedDate]);

  // Combined visible tasks
  const combinedTasks = useMemo(() => {
    return [...routineTasks, ...standaloneTasks];
  }, [routineTasks, standaloneTasks]);

  const totalTasksCount = combinedTasks.length;
  const doneTasksCount = combinedTasks.filter((t) => t.completed).length;
  const remainingCount = totalTasksCount - doneTasksCount;
  const focusPercent = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  const routineDoneCount = routineTasks.filter((t) => t.completed).length;
  const standaloneDoneCount = standaloneTasks.filter((t) => t.completed).length;

  // Master goals
  const masterGoals = useMemo(() => {
    return todos.filter((t) => t.type === 'permanent');
  }, [todos]);

  const filteredGoals = useMemo(() => {
    let list = masterGoals;
    if (goalsFilter === 'active') list = list.filter((g) => !g.completed);
    if (goalsFilter === 'done') list = list.filter((g) => g.completed);
    if (goalsView === 'time') {
      list = [...list].sort((a, b) => (a.endDate || '9999') > (b.endDate || '9999') ? 1 : -1);
    }
    return list;
  }, [masterGoals, goalsFilter, goalsView]);

  // Points calculation for tasks
  const getTaskPoints = (priority: string) => {
    if (priority === 'high') return orbitData.pts.h;
    if (priority === 'low') return orbitData.pts.l;
    return orbitData.pts.n;
  };

  const todayBasePoints = useMemo(() => {
    return combinedTasks
      .filter((t) => t.completed)
      .reduce((acc, t) => acc + getTaskPoints(t.priority), 0);
  }, [combinedTasks, orbitData.pts]);

  const streakBonusPoints = Math.min(curStreak * 2, 40);
  const totalDailyReward = todayBasePoints + streakBonusPoints;
  const isDailyRewardReady = totalTasksCount > 0 && doneTasksCount === totalTasksCount && !orbitData.cl.d[TODAY];
  const isDailyRewardClaimed = !!orbitData.cl.d[TODAY];

  // Score level info
  const scoreLevelIdx = useMemo(() => {
    const idx = LV.length - 1 - [...LV].reverse().findIndex((l) => orbitData.score >= l[0]);
    return idx >= 0 ? idx : 0;
  }, [orbitData.score]);

  const currentLevel = LV[scoreLevelIdx];
  const nextLevel = LV[scoreLevelIdx + 1];

  // 18-week activity timeline generation
  const timelineWeeks = useMemo(() => {
    const now = new Date(TODAY);
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 17 * 7);
    const weeks: Array<Array<{ dateKey: string; actsCount: number; isToday: boolean; isFuture: boolean }>> = [];

    // Map completed acts per date from completed tasks & dayLogs
    const actsMap: Record<string, number> = {};
    todos.forEach((t) => {
      if (t.completed && (t.type === 'daily' || !t.type) && t.status !== 'archived') {
        const k = t.completedAt?.slice(0, 10) || t.date || t.createdAt.slice(0, 10);
        if (k) actsMap[k] = (actsMap[k] || 0) + 1;
      }
    });
    Object.entries(dayLogs).forEach(([k, log]) => {
      if (log.completed) {
        actsMap[k] = Math.max(actsMap[k] || 0, log.completed);
      }
    });

    for (let w = 0; w < 18; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const curDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + w * 7 + d);
        const k = curDate.toLocaleDateString('en-CA');
        const isFuture = k > TODAY;
        const actsCount = actsMap[k] || 0;
        days.push({
          dateKey: k,
          actsCount,
          isToday: k === TODAY,
          isFuture
        });
      }
      weeks.push(days);
    }
    return weeks;
  }, [TODAY, todos, dayLogs]);

  // Set default timeline hint to CURRENT DAY (Today)
  useEffect(() => {
    const todayTasksDone = todos.filter((t) => 
      t.completed && (t.type === 'daily' || !t.type) && 
      (t.completedAt?.slice(0, 10) === TODAY || t.date === TODAY || t.createdAt.slice(0, 10) === TODAY)
    ).length;
    const dObj = new Date(TODAY);
    setTimelineHint(
      `${dObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} · ${todayTasksDone > 0 ? `${todayTasksDone} tasks logged` : 'No activity yet'} (Today)`
    );
  }, [TODAY, todos]);

  // Scroll heatmap to right on initial mount so today is visible
  useEffect(() => {
    if (heatmapScrollRef.current) {
      heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth;
    }
  }, []);

  // Overall statistics for the 6 cards
  const totalLoggedActs = useMemo(() => {
    return todos.filter((t) => t.completed).length;
  }, [todos]);

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

  // Insights computations
  const insightsData = useMemo(() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    let totalActive = 0;
    let totalTasks = 0;

    activeDatesSet.forEach((k) => {
      const [y, m, d] = k.split('-').map(Number);
      const dayIdx = new Date(y, m - 1, d).getDay();
      dayCounts[dayIdx]++;
      totalActive++;
    });

    todos.forEach((t) => {
      if (t.completed) totalTasks++;
    });

    const maxDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    const strongestDay = dayNames[maxDayIdx >= 0 ? maxDayIdx : 1];
    const avgTasks = totalActive > 0 ? (totalTasks / totalActive).toFixed(1) : '1.0';

    let last7Active = 0;
    const now = new Date(TODAY);
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toLocaleDateString('en-CA');
      if (activeDatesSet.has(d)) {
        last7Active++;
      }
    }

    return {
      strongestDay,
      avgTasks,
      last7Active,
      totalActive
    };
  }, [activeDatesSet, todos, TODAY]);

  // Handlers for Add Task / Fixed Routine
  const handleAddTask = () => {
    let text = newTaskInput.trim();
    if (!text) return;

    let priority: 'low' | 'medium' | 'high' = newTaskPriority;
    let tag = '';

    text = text.replace(/!(high|h|low|l|med|medium|normal)\b/i, (_, p) => {
      priority = /^h/i.test(p) ? 'high' : /^l/i.test(p) ? 'low' : 'medium';
      return '';
    }).replace(/#(\w+)/, (_, x) => {
      tag = x;
      return '';
    }).trim() || 'Untitled task';

    if (addMode === 'routine') {
      if (onSaveRoutine) {
        onSaveRoutine({
          id: 'routine-' + Date.now(),
          text,
          priority,
          frequency: 'daily',
          startDate: selectedDate, // Routine starts from the day it is created!
          createdAt: new Date().toISOString()
        });
      }
    } else {
      onAddTodo(text, 'daily', priority, selectedDate, tag ? [tag] : undefined);
    }

    setNewTaskInput('');
  };

  // Toggle task or routine
  const handleToggleTask = (task: typeof combinedTasks[0]) => {
    if (task.isRoutine && task.routineId) {
      const existing = dailyTodos.find((t) => 
        t.recurringId === task.routineId && (t.date === selectedDate || t.createdAt.slice(0, 10) === selectedDate)
      );
      if (existing) {
        onToggleTodo(existing.id);
      } else {
        onAddTodo(task.text, 'daily', task.priority as any, selectedDate, task.tag ? [task.tag] : undefined);
      }
    } else {
      onToggleTodo(task.id);
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'task') {
      onDeleteTodo(itemToDelete.id);
    } else if (itemToDelete.type === 'routine' && onDeleteRoutine) {
      onDeleteRoutine(itemToDelete.id);
    } else if (itemToDelete.type === 'reward') {
      const updatedRewards = orbitData.rewards.filter((r: HabitReward) => r.id !== itemToDelete.id);
      saveOrbitData({ rewards: updatedRewards });
    } else if (itemToDelete.type === 'goal') {
      onDeleteTodo(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // Set / Save Reflection handler
  const handleSaveReflection = () => {
    setReflectionSavedNotice(true);
    setIsEditingReflection(false);
    triggerCelebration();
    setTimeout(() => setReflectionSavedNotice(false), 2500);
  };

  // Claim daily reward
  const handleClaimDailyReward = () => {
    if (!isDailyRewardReady) return;
    const newCl = { ...orbitData.cl, d: { ...orbitData.cl.d, [TODAY]: totalDailyReward } };
    saveOrbitData({
      score: orbitData.score + totalDailyReward,
      cl: newCl
    });
    triggerCelebration();
  };

  // Claim milestone bonus
  const handleClaimMilestone = (days: number, pts: number) => {
    if (curStreak < days || orbitData.cl.m[days]) return;
    const newCl = { ...orbitData.cl, m: { ...orbitData.cl.m, [days]: 1 } };
    saveOrbitData({
      score: orbitData.score + pts,
      cl: newCl
    });
    triggerCelebration();
  };

  // Add reward
  const handleAddReward = () => {
    const name = newRewardName.trim();
    const pts = parseInt(newRewardPts, 10);
    if (!name || isNaN(pts) || pts <= 0) return;
    const newReward = { id: 'r-' + Date.now(), n: name, p: pts };
    saveOrbitData({ rewards: [...orbitData.rewards, newReward] });
    setNewRewardName('');
    setNewRewardPts('');
  };

  // Claim reward
  const handleClaimReward = (rewardId: string) => {
    const reward = orbitData.rewards.find((r: HabitReward) => r.id === rewardId);
    if (!reward || reward.c || orbitData.score < reward.p) return;
    const updated = orbitData.rewards.map((r: HabitReward) => 
      r.id === rewardId ? { ...r, c: TODAY } : r
    );
    saveOrbitData({ rewards: updated });
    triggerCelebration();
  };

  // Add master goal
  const handleAddGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;
    onAddTodo(title, 'permanent', 'medium', newGoalDeadline || undefined);
    setNewGoalTitle('');
    setNewGoalDeadline('');
  };

  // Date formatted for navigator
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const dayLabel = selectedDate === TODAY 
    ? 'Today' 
    : selectedDate === new Date(Date.now() - 864e5).toLocaleDateString('en-CA')
    ? 'Yesterday'
    : selectedDateObj.toLocaleDateString('en-IN', { weekday: 'long' });

  const dateSubLabel = selectedDateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="habits-container">
      <div className="wrap">
        
        {/* Header with Avatar and Date */}
        <header className="head">
          <div className="logo">
            <img src={avatarImg} alt="Sreeshnav" />
          </div>
          <div>
            <h1>Habits &amp; Tasks</h1>
            <p>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </header>

        {/* Hero Card */}
        <section className="card hero">
          <div className="top">
            <div className="flame" aria-hidden="true">🔥</div>
            <div>
              <div className="big">
                <span className="num">{curStreak}</span> <small>days</small>
                <span className={`badge ${isTodayActive ? '' : curStreak > 0 ? 'risk' : ''}`}>
                  {isTodayActive ? 'Active streak' : curStreak > 0 ? 'At risk' : 'Start today'}
                </span>
              </div>
              <p>
                {doneTasksCount > 0 
                  ? `${doneTasksCount} of ${totalTasksCount} tasks done today` 
                  : curStreak > 0 
                  ? 'Complete one task today to keep your streak alive.' 
                  : 'Complete a task today to start your streak.'}
              </p>
            </div>
          </div>

          {/* Milestone Progress Box */}
          <div className="ms">
            <b>{prevMilestone ? prevMilestone[1] : 'Getting started'} 🏅</b>
            <small>
              {curStreak >= nextMilestone[0] 
                ? 'Top level reached' 
                : `${nextMilestone[0] - curStreak}d to the ${nextMilestone[0]}-day ${nextMilestone[1]} badge`}
            </small>
            <div className="gbar">
              <i style={{ width: `${Math.min(100, (curStreak / nextMilestone[0]) * 100)}%` }}></i>
            </div>
          </div>

          {/* Quick Action Buttons: Combined Insights & Review Modal + Celebrate */}
          <div className="acts">
            <button 
              className="pill" 
              onClick={() => setIsInsightsModalOpen(true)}
            >
              📊 Insights &amp; Review
            </button>
            <button className="btn" onClick={triggerCelebration}>
              🎉 Celebrate!
            </button>
          </div>
        </section>

        {/* 6 Rotating Pastel Stats Cards */}
        <div className="stats span" style={{ marginBottom: '18px' }}>
          <div className="st">
            <span>🔥 Streak</span>
            <b className="num">{curStreak}d</b>
            <em>{isTodayActive ? 'Active' : curStreak > 0 ? 'At risk' : 'Paused'}</em>
          </div>
          <div className="st">
            <span>🏆 Best streak</span>
            <b className="num">{bestStreak}d</b>
            <em>Days</em>
          </div>
          <div className="st">
            <span>🎯 Today’s focus</span>
            <b className="num">{focusPercent}%</b>
            <em>{doneTasksCount}/{totalTasksCount}</em>
          </div>
          <div className="st">
            <span>🏅 Target level</span>
            <b className="num">{nextMilestone[0]}d</b>
            <em>Days</em>
          </div>
          <div className="st">
            <span>📈 Consistency</span>
            <b className="num">{consistencyRate}%</b>
            <em>{consistencyRate >= 70 ? 'Strong' : consistencyRate >= 40 ? 'Rhythm' : 'Building'}</em>
          </div>
          <div className="st">
            <span>✅ Total acts</span>
            <b className="num">{totalLoggedActs}</b>
            <em>Logged</em>
          </div>
        </div>

        {/* 18-Week Activity Timeline Heatmap (Auto-scrolled to Current Day) */}
        <div className="card span" style={{ marginBottom: '18px' }}>
          <div className="rw">
            <h2>Activity timeline 🗓️</h2>
            <small className="sm">18 weeks</small>
          </div>
          <div className="hs" ref={heatmapScrollRef}>
            <div className="hm">
              {/* Day Labels */}
              <div className="hl">
                <small></small>
                {'SMTWTFS'.split('').map((ch, idx) => (
                  <small key={idx}>{ch}</small>
                ))}
              </div>
              {/* 18 Column Weeks */}
              {timelineWeeks.map((week, wIdx) => {
                const monthLabel = week[0]?.dateKey 
                  ? new Date(week[0].dateKey).toLocaleDateString('en-IN', { month: 'short' }) 
                  : '';
                const showMonth = wIdx === 0 || (wIdx > 0 && timelineWeeks[wIdx - 1][0]?.dateKey.slice(5, 7) !== week[0]?.dateKey.slice(5, 7));

                return (
                  <div key={wIdx} className="hc">
                    <small>{showMonth ? monthLabel : ''}</small>
                    {week.map((day, dIdx) => {
                      const levelClass = day.actsCount >= 5 
                        ? 'l3' 
                        : day.actsCount >= 3 
                        ? 'l2' 
                        : day.actsCount >= 1 
                        ? 'l1' 
                        : '';
                      return (
                        <button
                          key={dIdx}
                          className={`${day.isFuture ? 'fu' : levelClass}${day.isToday ? ' td' : ''}`}
                          onClick={() => {
                            if (day.isFuture) return;
                            const dObj = new Date(day.dateKey);
                            setTimelineHint(
                              `${dObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} · ${day.actsCount > 0 ? `${day.actsCount} tasks logged` : 'No activity'}${day.isToday ? ' (Today)' : ''}`
                            );
                            onSelectDate(day.dateKey);
                          }}
                          aria-label={`${day.dateKey}: ${day.actsCount} acts`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hint">{timelineHint}</div>
        </div>

        {/* Main 2-Column Responsive Layout */}
        <main className="grid">
          
          {/* LEFT COLUMN: Daily focus ☀️ */}
          <div className="card" id="focus">
            <div className="rw">
              <div>
                <h2>Daily focus ☀️</h2>
                <small className="sm">{doneTasksCount}/{totalTasksCount} completed</small>
              </div>
              <span className="pc">{focusPercent}%</span>
            </div>

            {/* Day Navigator */}
            <div className="dnav">
              <button 
                className="ib" 
                onClick={() => {
                  const prev = new Date(selectedDateObj.getTime() - 864e5).toLocaleDateString('en-CA');
                  onSelectDate(prev);
                }}
                aria-label="Previous day"
              >
                ‹
              </button>
              <div>
                <b>{dayLabel}</b>
                <small>{dateSubLabel}</small>
              </div>
              <span>
                <button 
                  className="ib" 
                  onClick={() => onSelectDate(TODAY)}
                  disabled={selectedDate === TODAY}
                  aria-label="Jump to today"
                  title="Jump to today"
                  style={{ marginRight: '6px' }}
                >
                  ↺
                </button>
                <button 
                  className="ib" 
                  onClick={() => {
                    if (selectedDate >= TODAY) return;
                    const next = new Date(selectedDateObj.getTime() + 864e5).toLocaleDateString('en-CA');
                    onSelectDate(next);
                  }}
                  disabled={selectedDate >= TODAY}
                  aria-label="Next day"
                >
                  ›
                </button>
              </span>
            </div>

            {/* Mode Chips: Today only vs Fixed routine */}
            <div className="chips">
              <button 
                className="chip" 
                aria-pressed={addMode === 'once'}
                onClick={() => setAddMode('once')}
              >
                ☀️ Today only
              </button>
              <button 
                className="chip" 
                aria-pressed={addMode === 'routine'}
                onClick={() => setAddMode('routine')}
              >
                🔁 Fixed routine (every day)
              </button>
            </div>

            {/* Priority Selector (Applicable to both Today's Tasks and Fixed Routines) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mute)' }}>Priority:</span>
              <button
                type="button"
                className={`p-chip high ${newTaskPriority === 'high' ? 'active' : ''}`}
                onClick={() => setNewTaskPriority('high')}
              >
                🔴 High (+15 pts)
              </button>
              <button
                type="button"
                className={`p-chip medium ${newTaskPriority === 'medium' ? 'active' : ''}`}
                onClick={() => setNewTaskPriority('medium')}
              >
                🟡 Medium (+10 pts)
              </button>
              <button
                type="button"
                className={`p-chip low ${newTaskPriority === 'low' ? 'active' : ''}`}
                onClick={() => setNewTaskPriority('low')}
              >
                🟢 Low (+5 pts)
              </button>
            </div>

            {/* Add Task Input */}
            <div className="add">
              <input 
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                }}
                placeholder={
                  addMode === 'routine' 
                    ? `Add fixed routine (starts from ${dayLabel})...` 
                    : "Add a task (try: read book !high #study)"
                }
                aria-label="New task"
              />
              <button className="btn" onClick={handleAddTask} style={{ padding: '11px 16px' }}>
                Add
              </button>
            </div>

            {/* Manage Fixed Routines Toggle */}
            <div className="ft" style={{ border: 0, marginTop: '8px', padding: 0 }}>
              <span>🔁 Routines appear every day (from creation date)</span>
              <button 
                className="mgb" 
                onClick={() => setIsManageRoutinesOpen(!isManageRoutinesOpen)}
              >
                {isManageRoutinesOpen ? '✕ Close routines' : `＋ Manage fixed routines (${routines.length})`}
              </button>
            </div>

            {/* Expandable Routines List */}
            {isManageRoutinesOpen && (
              <div style={{ marginTop: '10px' }}>
                {routines.length === 0 ? (
                  <div className="empty">No routines yet. Pick “Fixed routine” and add one.</div>
                ) : (
                  routines.map((r) => (
                    <div key={r.id} className="add" style={{ marginTop: '6px' }}>
                      <input 
                        value={r.text}
                        onChange={(e) => {
                          if (onSaveRoutine) {
                            onSaveRoutine({ ...r, text: e.target.value.slice(0, 60) });
                          }
                        }}
                        aria-label="Routine name"
                      />
                      <button 
                        className="x" 
                        onClick={() => setItemToDelete({ id: r.id, name: r.text, type: 'routine' })}
                        aria-label="Remove routine"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Task Section Filter Tabs for Easy Access */}
            <div className="chips" style={{ marginTop: '16px', marginBottom: '4px' }}>
              <button
                className="chip"
                aria-pressed={taskViewTab === 'all'}
                onClick={() => setTaskViewTab('all')}
              >
                All ({totalTasksCount})
              </button>
              <button
                className="chip"
                aria-pressed={taskViewTab === 'routine'}
                onClick={() => setTaskViewTab('routine')}
              >
                🔁 Fixed ({routineTasks.length})
              </button>
              <button
                className="chip"
                aria-pressed={taskViewTab === 'today'}
                onClick={() => setTaskViewTab('today')}
              >
                ☀️ Today's ({standaloneTasks.length})
              </button>
            </div>

            {/* Visible Tasks List with Clear Section Separation */}
            <div style={{ marginTop: '10px' }}>
              {combinedTasks.length === 0 ? (
                <div className="empty">Nothing planned. Add a task above 🌱</div>
              ) : (
                <>
                  {/* Fixed Routines Section */}
                  {(taskViewTab === 'all' || taskViewTab === 'routine') && routineTasks.length > 0 && (
                    <div className="task-section">
                      <div className="task-section-header">
                        <span>🔁 Fixed Habits &amp; Routines</span>
                        <span className="count-pill">{routineDoneCount}/{routineTasks.length} done</span>
                      </div>
                      {routineTasks.map((t) => (
                        <div key={t.id} className="task">
                          <button 
                            className="ck" 
                            aria-pressed={t.completed}
                            disabled={selectedDate > TODAY}
                            onClick={() => handleToggleTask(t)}
                            aria-label={`Mark ${t.text} done`}
                          >
                            {t.completed ? '✓' : ''}
                          </button>
                          <div className={`t ${t.completed ? 'dn' : ''}`}>
                            {t.text}
                            <div>
                              <span className="tg">🔁 Fixed routine</span>
                              {t.priority === 'high' ? (
                                <span className="tg h">High</span>
                              ) : t.priority === 'low' ? (
                                <span className="tg l">Low</span>
                              ) : (
                                <span className="tg">Med</span>
                              )}
                              {t.tag && <span className="tg p">#{t.tag}</span>}
                              <span className="tg">+{getTaskPoints(t.priority)}</span>
                            </div>
                          </div>
                          <button 
                            className="x" 
                            onClick={() => setItemToDelete({ id: t.id, name: t.text, type: 'routine' })}
                            aria-label={`Remove ${t.text}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Today's Tasks Section */}
                  {(taskViewTab === 'all' || taskViewTab === 'today') && standaloneTasks.length > 0 && (
                    <div className="task-section">
                      <div className="task-section-header" style={{ marginTop: taskViewTab === 'all' && routineTasks.length > 0 ? '16px' : '4px' }}>
                        <span>☀️ Today's Tasks</span>
                        <span className="count-pill">{standaloneDoneCount}/{standaloneTasks.length} done</span>
                      </div>
                      {standaloneTasks.map((t) => (
                        <div key={t.id} className="task">
                          <button 
                            className="ck" 
                            aria-pressed={t.completed}
                            disabled={selectedDate > TODAY}
                            onClick={() => handleToggleTask(t)}
                            aria-label={`Mark ${t.text} done`}
                          >
                            {t.completed ? '✓' : ''}
                          </button>
                          <div className={`t ${t.completed ? 'dn' : ''}`}>
                            {t.text}
                            <div>
                              {t.carried && <span className="tg c">Carried</span>}
                              {t.priority === 'high' ? (
                                <span className="tg h">High</span>
                              ) : t.priority === 'low' ? (
                                <span className="tg l">Low</span>
                              ) : (
                                <span className="tg">Med</span>
                              )}
                              {t.tag && <span className="tg p">#{t.tag}</span>}
                              <span className="tg">+{getTaskPoints(t.priority)}</span>
                            </div>
                          </div>
                          <button 
                            className="x" 
                            onClick={() => setItemToDelete({ id: t.id, name: t.text, type: 'task' })}
                            aria-label={`Remove ${t.text}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state when tab filter returns 0 */}
                  {taskViewTab === 'routine' && routineTasks.length === 0 && (
                    <div className="empty">No fixed routines active for this day.</div>
                  )}
                  {taskViewTab === 'today' && standaloneTasks.length === 0 && (
                    <div className="empty">No one-off tasks added for today.</div>
                  )}
                </>
              )}
            </div>

            {/* List Footer with remaining and archive */}
            <div className="ft">
              <span>{remainingCount} remaining</span>
              {onArchiveCompletedDaily && (
                <button 
                  onClick={() => onArchiveCompletedDaily(selectedDate)}
                  disabled={doneTasksCount === 0}
                  style={{ opacity: doneTasksCount === 0 ? 0.4 : 1, cursor: doneTasksCount === 0 ? 'default' : 'pointer' }}
                >
                  Archive completed ({doneTasksCount})
                </button>
              )}
            </div>

            {/* Reflection 🌿: Separate Saved View Card vs Active Edit Form */}
            {(() => {
              const currentDayLog = dayLogs[selectedDate];
              const hasSavedReflection = Boolean(currentDayLog?.reflection?.trim() || currentDayLog?.mood);
              const activeMoodObj = MOOD_MAP.find((m) => m.score === currentDayLog?.mood);

              if (hasSavedReflection && !isEditingReflection) {
                return (
                  <div className="saved-reflection-card" id="habit-reflection-box">
                    <div className="rw" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b>Daily Reflection 🌿</b>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(44,154,107,0.15)', color: '#2C9A6B', fontWeight: 700 }}>
                          Saved ✨
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '5px 12px', fontSize: '12.5px' }}
                        onClick={() => setIsEditingReflection(true)}
                      >
                        ✎ Edit
                      </button>
                    </div>

                    {activeMoodObj && (
                      <div style={{ margin: '8px 0 10px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '4px 12px', 
                          borderRadius: '999px', 
                          background: 'var(--card)', 
                          fontSize: '13px', 
                          fontWeight: 600,
                          border: '1px solid var(--line)'
                        }}>
                          {activeMoodObj.emoji} Mood: {activeMoodObj.label}
                        </span>
                      </div>
                    )}

                    {currentDayLog?.reflection?.trim() ? (
                      <div style={{ 
                        background: 'var(--card)', 
                        padding: '12px 14px', 
                        borderRadius: '14px', 
                        border: '1px solid var(--line)',
                        fontSize: '13.5px',
                        lineHeight: 1.5,
                        color: 'var(--ink)',
                        fontStyle: 'italic',
                        whiteSpace: 'pre-wrap'
                      }}>
                        "{currentDayLog.reflection.trim()}"
                      </div>
                    ) : (
                      <div className="sm" style={{ fontStyle: 'italic' }}>
                        No written notes added for this reflection.
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div 
                  id="habit-reflection-box" 
                  style={{ marginTop: '16px', padding: '16px', borderRadius: '22px', background: 'var(--c4)' }}
                >
                  <div className="rw">
                    <b>Daily Reflection 🌿 {hasSavedReflection && <span style={{ fontSize: '11px', color: 'var(--mute)' }}>(Editing)</span>}</b>
                    {reflectionSavedNotice && (
                      <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 700 }}>
                        Reflection saved ✨
                      </span>
                    )}
                  </div>
                  <div className="moods">
                    {MOOD_MAP.map((m) => {
                      const isSelected = dayLogs[selectedDate]?.mood === m.score;
                      return (
                        <button
                          key={m.label}
                          aria-pressed={isSelected}
                          onClick={() => {
                            onSaveDayLog(selectedDate, { mood: isSelected ? undefined : m.score });
                          }}
                        >
                          {m.emoji} {m.label}
                        </button>
                      );
                    })}
                  </div>
                  <textarea 
                    rows={3}
                    value={dayLogs[selectedDate]?.reflection || ''}
                    onChange={(e) => onSaveDayLog(selectedDate, { reflection: e.target.value })}
                    placeholder="How did this day go? Write a line or two."
                    aria-label="Reflection"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    {hasSavedReflection && (
                      <button
                        type="button"
                        className="chip"
                        onClick={() => setIsEditingReflection(false)}
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      className="btn" 
                      onClick={handleSaveReflection}
                      style={{ padding: '9px 18px', fontSize: '13.5px' }}
                    >
                      Set Reflection 🌿
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RIGHT COLUMN: SCORE, REWARDS & MASTER GOALS */}
          <div className="side">
            
            {/* 1. My Score ⭐ Card */}
            <div className="card" id="claim">
              <div className="rw">
                <div>
                  <h2>My score ⭐</h2>
                  <div className="lv">{currentLevel[2]} {currentLevel[1]}</div>
                </div>
                <div className="score num">{orbitData.score}</div>
              </div>

              {/* Level Progress Bar */}
              <div className="gbar" style={{ background: 'var(--bg2)', marginTop: '10px' }}>
                <i 
                  style={{ 
                    width: `${nextLevel ? Math.min(100, ((orbitData.score - currentLevel[0]) / (nextLevel[0] - currentLevel[0])) * 100) : 100}%` 
                  }}
                />
              </div>
              <div className="lv">
                {nextLevel ? `${nextLevel[0] - orbitData.score} points to ${nextLevel[2]} ${nextLevel[1]}` : 'Top level. Amazing!'}
              </div>

              {/* Daily Reward Box */}
              <div className="claimbox">
                <b>Daily reward</b>
                <p>
                  {isDailyRewardClaimed ? (
                    `Claimed +${orbitData.cl.d[TODAY]} today. Come back tomorrow! 🌙`
                  ) : isDailyRewardReady ? (
                    <span>All {totalTasksCount} tasks done: {todayBasePoints} task points + {streakBonusPoints} streak bonus = <b>{totalDailyReward}</b>.</span>
                  ) : (
                    `Finish all ${totalTasksCount} tasks to unlock. ${doneTasksCount}/${totalTasksCount} done.`
                  )}
                </p>
                <button 
                  className="btn" 
                  disabled={!isDailyRewardReady}
                  onClick={handleClaimDailyReward}
                >
                  {isDailyRewardClaimed ? 'Claimed ✓' : isDailyRewardReady ? `Claim +${totalDailyReward} points` : 'Locked 🔒'}
                </button>
              </div>

              {/* Milestone Badges Grid */}
              <div className="mss">
                {MS.map(([mDays, mTitle, mBonus]) => {
                  const claimed = !!orbitData.cl.m[mDays];
                  const ready = curStreak >= mDays;

                  if (claimed) {
                    return (
                      <div key={mDays} className="mi done">
                        <b>{mDays}d ✓</b>
                        +{mBonus}
                      </div>
                    );
                  }
                  if (ready) {
                    return (
                      <button 
                        key={mDays} 
                        className="mi ok" 
                        onClick={() => handleClaimMilestone(mDays, mBonus)}
                      >
                        <b>{mDays}d</b>
                        Claim +{mBonus}
                      </button>
                    );
                  }
                  return (
                    <div key={mDays} className="mi">
                      <b>{mDays}d 🔒</b>
                      +{mBonus}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Score Goals 🎁 Card */}
            <div className="card">
              <h2>Score goals 🎁</h2>
              <small className="sm">Pick a score to reach and a reward for yourself.</small>
              
              <div style={{ marginTop: '8px' }}>
                {orbitData.rewards.length === 0 ? (
                  <div className="empty">Set a score you want to reach and a reward for it ✨</div>
                ) : (
                  [...orbitData.rewards].sort((a, b) => a.p - b.p).map((r) => {
                    const ready = orbitData.score >= r.p;
                    return (
                      <div key={r.id} className="rr">
                        <div className="rw">
                          <b>{r.n}</b>
                          <span className="num">{r.p} pts</span>
                        </div>
                        <div className="gbar" style={{ background: 'var(--card)' }}>
                          <i style={{ width: `${Math.min(100, (orbitData.score / r.p) * 100)}%` }} />
                        </div>
                        <div className="rw" style={{ marginTop: '8px' }}>
                          <small className="sm">
                            {r.c 
                              ? `Claimed ${r.c} 🎉` 
                              : ready 
                              ? 'Ready to claim!' 
                              : `${r.p - orbitData.score} points to go`}
                          </small>
                          <span>
                            {!r.c && ready && (
                              <button 
                                className="mini" 
                                onClick={() => handleClaimReward(r.id)}
                                style={{ marginRight: '6px' }}
                              >
                                🎁 Claim
                              </button>
                            )}
                            <button 
                              className="x" 
                              onClick={() => setItemToDelete({ id: r.id, name: r.n, type: 'reward' })}
                              aria-label="Remove reward"
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Reward Inputs */}
              <div className="add">
                <input 
                  value={newRewardName}
                  onChange={(e) => setNewRewardName(e.target.value)}
                  placeholder="Reward (e.g. Movie night 🍿)" 
                  aria-label="Reward name"
                />
                <input 
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={newRewardPts}
                  onChange={(e) => setNewRewardPts(e.target.value)}
                  placeholder="Points" 
                  style={{ maxWidth: '92px' }} 
                  aria-label="Points needed"
                />
                <button className="btn" onClick={handleAddReward} style={{ padding: '11px 16px' }}>
                  Add
                </button>
              </div>

              {/* Point Rules Collapsible */}
              <details>
                <summary>Point rules ⚙️</summary>
                <div className="rules">
                  <label>
                    Low task
                    <input 
                      type="number" 
                      min="0"
                      value={orbitData.pts.l}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        saveOrbitData({ pts: { ...orbitData.pts, l: val } });
                      }}
                    />
                  </label>
                  <label>
                    Normal
                    <input 
                      type="number" 
                      min="0"
                      value={orbitData.pts.n}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        saveOrbitData({ pts: { ...orbitData.pts, n: val } });
                      }}
                    />
                  </label>
                  <label>
                    High
                    <input 
                      type="number" 
                      min="0"
                      value={orbitData.pts.h}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        saveOrbitData({ pts: { ...orbitData.pts, h: val } });
                      }}
                    />
                  </label>
                </div>
              </details>
            </div>

            {/* 3. Master Goals 🎯 Card */}
            <div className="card">
              <div className="rw">
                <div>
                  <h2>Master goals 🎯</h2>
                  <small className="sm">
                    {masterGoals.filter((g) => !g.completed).length} active · {masterGoals.filter((g) => g.completed).length} completed
                  </small>
                </div>
                <div className="chips">
                  <button 
                    className="chip" 
                    aria-pressed={goalsView === 'cards'}
                    onClick={() => setGoalsView('cards')}
                  >
                    Cards
                  </button>
                  <button 
                    className="chip" 
                    aria-pressed={goalsView === 'time'}
                    onClick={() => setGoalsView('time')}
                  >
                    Timeline
                  </button>
                </div>
              </div>

              {/* Filter Chips: All, Active, Completed */}
              <div className="chips" style={{ marginTop: '12px' }}>
                <button 
                  className="chip" 
                  aria-pressed={goalsFilter === 'all'}
                  onClick={() => setGoalsFilter('all')}
                >
                  All
                </button>
                <button 
                  className="chip" 
                  aria-pressed={goalsFilter === 'active'}
                  onClick={() => setGoalsFilter('active')}
                >
                  Active
                </button>
                <button 
                  className="chip" 
                  aria-pressed={goalsFilter === 'done'}
                  onClick={() => setGoalsFilter('done')}
                >
                  Completed
                </button>
              </div>

              {/* Add Master Goal Input */}
              <div className="add">
                <input 
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="New goal (e.g. Launch my channel)" 
                  aria-label="Goal title"
                />
                <input 
                  type="date"
                  className="gi"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  style={{ maxWidth: '150px' }} 
                  aria-label="Deadline"
                />
                <button className="btn" onClick={handleAddGoal} style={{ padding: '11px 16px' }}>
                  Add
                </button>
              </div>

              {/* Goals Rendering (Cards vs Timeline) */}
              <div style={{ marginTop: '10px' }}>
                {filteredGoals.length === 0 ? (
                  <div className="empty">No goals here yet. Add one with a deadline 🎯</div>
                ) : goalsView === 'time' ? (
                  <div className="tl">
                    {filteredGoals.map((g) => {
                      const pct = g.completed ? 100 : (g.progress || (g.subtasks && g.subtasks.length > 0 
                        ? Math.round((g.subtasks.filter((s) => s.done).length / g.subtasks.length) * 100) 
                        : 0));
                      const dueDays = g.endDate 
                        ? Math.round((new Date(g.endDate).getTime() - new Date(TODAY).getTime()) / 864e5) 
                        : null;
                      const dueText = dueDays === null 
                        ? 'No deadline' 
                        : dueDays > 1 
                        ? `${dueDays} days left` 
                        : dueDays === 1 
                        ? 'Due tomorrow' 
                        : dueDays === 0 
                        ? 'Due today' 
                        : 'Overdue';

                      return (
                        <div key={g.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <button 
                            className="ck" 
                            aria-pressed={g.completed}
                            onClick={() => onToggleTodo(g.id)}
                            aria-label={`Toggle ${g.text}`}
                            style={{ flexShrink: 0, marginTop: '2px' }}
                          >
                            {g.completed ? '✓' : ''}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ textDecoration: g.completed ? 'line-through' : 'none' }}>{g.text}</b>
                            <div className="sm">
                              {g.completed ? 'Completed 🎉 +50 pts' : `${dueText} · ${pct}%`}
                            </div>
                            <div className="gbar" style={{ background: 'var(--card)' }}>
                              <i style={{ width: `${pct}%`, background: g.completed ? 'var(--green, #2C9A6B)' : undefined }} />
                            </div>
                          </div>
                          <button 
                            className="x" 
                            onClick={() => setItemToDelete({ id: g.id, name: g.text, type: 'goal' })}
                            aria-label="Remove goal"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  filteredGoals.map((g) => {
                    const pct = g.completed ? 100 : (g.progress || (g.subtasks && g.subtasks.length > 0 
                      ? Math.round((g.subtasks.filter((s) => s.done).length / g.subtasks.length) * 100) 
                      : 0));
                    const dueDays = g.endDate 
                      ? Math.round((new Date(g.endDate).getTime() - new Date(TODAY).getTime()) / 864e5) 
                      : null;
                    const dueText = dueDays === null 
                      ? 'No deadline' 
                      : dueDays > 1 
                      ? `${dueDays} days left` 
                      : dueDays === 1 
                      ? 'Due tomorrow' 
                      : dueDays === 0 
                      ? 'Due today' 
                      : 'Overdue';

                    return (
                      <div key={g.id} className="gc">
                        <div className="rw" style={{ alignItems: 'flex-start', gap: '10px' }}>
                          <button 
                            className="ck" 
                            aria-pressed={g.completed}
                            onClick={() => onToggleTodo(g.id)}
                            aria-label={`Toggle ${g.text}`}
                            style={{ flexShrink: 0, marginTop: '2px' }}
                          >
                            {g.completed ? '✓' : ''}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="rw" style={{ justifyContent: 'space-between', marginBottom: '2px' }}>
                              <b style={{ fontSize: '14.5px', textDecoration: g.completed ? 'line-through' : 'none' }}>
                                {g.text}
                              </b>
                              {onOpenEditGoal && (
                                <button
                                  type="button"
                                  className="mini"
                                  onClick={() => onOpenEditGoal(g)}
                                  style={{ padding: '2px 8px', fontSize: '11px', marginLeft: '6px' }}
                                  title="Edit goal"
                                >
                                  ✎ Edit
                                </button>
                              )}
                            </div>
                            <div className="sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                              {g.completed ? (
                                <span className="tg" style={{ background: '#DDF0E5', color: '#2C5A45', fontWeight: 700 }}>
                                  Completed 🎉 +50 pts
                                </span>
                              ) : (
                                <>
                                  <span className={`tg ${dueDays !== null && dueDays <= 0 ? 'h' : ''}`}>
                                    {dueText}
                                  </span>
                                  <span>·</span>
                                  <span>{pct}% progress</span>
                                </>
                              )}
                            </div>
                            <div className="gbar" style={{ background: 'var(--card)', marginTop: '8px' }}>
                              <i style={{ width: `${pct}%`, background: g.completed ? 'var(--green, #2C9A6B)' : undefined }} />
                            </div>
                            {!g.completed && (
                              <div className="rw" style={{ marginTop: '10px' }}>
                                <span className="chips">
                                  <button 
                                    className="mini" 
                                    onClick={() => onToggleTodo(g.id)}
                                  >
                                    Mark Done ✓
                                  </button>
                                </span>
                              </div>
                            )}
                          </div>
                          <button 
                            className="x" 
                            onClick={() => setItemToDelete({ id: g.id, name: g.text, type: 'goal' })}
                            aria-label="Remove goal"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Combined Insights & Review Popup Modal */}
      {isInsightsModalOpen && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInsightsModalOpen(false);
          }}
        >
          <div className="panel animate-in slide-in-from-bottom duration-200" style={{ maxWidth: '500px' }}>
            <div className="rw">
              <h2>Insights &amp; Review 📊</h2>
              <button className="x" onClick={() => setIsInsightsModalOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* Quick Stats Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <div style={{ background: 'var(--c1)', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600 }}>🔥 Habit Streak</span>
                <b style={{ display: 'block', fontSize: '22px', fontFamily: 'Fredoka, sans-serif' }}>{curStreak} Days</b>
              </div>
              <div style={{ background: 'var(--c3)', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600 }}>🎯 Consistency</span>
                <b style={{ display: 'block', fontSize: '22px', fontFamily: 'Fredoka, sans-serif' }}>{consistencyRate}%</b>
              </div>
            </div>

            {/* Insights Tips */}
            <div style={{ marginTop: '8px' }}>
              <div className="it">
                <span className="it-icon">📅</span>
                <p className="it-text">
                  Your strongest day is <b>{insightsData.strongestDay}</b>.
                </p>
              </div>
              <div className="it">
                <span className="it-icon">⚡</span>
                <p className="it-text">
                  You log <b>{insightsData.avgTasks}</b> tasks on active days.
                </p>
              </div>
              <div className="it">
                <span className="it-icon">🗓️</span>
                <p className="it-text">
                  Active on <b>{insightsData.last7Active} of the last 7</b> days.
                </p>
              </div>
              <div className="it">
                <span className="it-icon">🌱</span>
                <p className="it-text">
                  <b>{insightsData.totalActive}</b> total active habit days recorded.
                </p>
              </div>
            </div>

            {/* Reflection Review for Selected Date */}
            <div style={{ marginTop: '10px', padding: '14px', borderRadius: '18px', background: 'var(--c4)', border: '1px solid var(--line)' }}>
              <div className="rw">
                <b style={{ fontSize: '14px' }}>Reflection for {dayLabel} 🌿</b>
                <span style={{ fontSize: '12px', color: 'var(--mute)' }}>{dateSubLabel}</span>
              </div>
              <div className="moods" style={{ margin: '10px 0 8px' }}>
                {MOOD_MAP.map((m) => {
                  const isSelected = dayLogs[selectedDate]?.mood === m.score;
                  return (
                    <button
                      key={m.label}
                      aria-pressed={isSelected}
                      onClick={() => {
                        onSaveDayLog(selectedDate, { mood: isSelected ? undefined : m.score });
                      }}
                    >
                      {m.emoji} {m.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={3}
                value={dayLogs[selectedDate]?.reflection || ''}
                onChange={(e) => onSaveDayLog(selectedDate, { reflection: e.target.value })}
                placeholder="How did this day go? Write a line or two."
                aria-label="Reflection"
                style={{ width: '100%', fontSize: '14px', padding: '10px 12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  className="btn" 
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => {
                    handleSaveReflection();
                    setIsInsightsModalOpen(false);
                  }}
                >
                  Set Reflection &amp; Close ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Sheet */}
      {itemToDelete && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setItemToDelete(null);
          }}
        >
          <div className="panel animate-in slide-in-from-bottom duration-200" style={{ maxWidth: '400px' }}>
            <div className="rw">
              <h2 style={{ fontSize: '18px' }}>Delete {itemToDelete.type}? 🗑️</h2>
              <button className="x" onClick={() => setItemToDelete(null)} aria-label="Cancel">✕</button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '16px',
              background: 'var(--sun)',
              border: '1px solid var(--line)',
              margin: '4px 0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--card)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '20px',
                flex: 'none',
                boxShadow: 'var(--shadow)'
              }}>
                {itemToDelete.type === 'routine' ? '🔁' : itemToDelete.type === 'reward' ? '🎁' : itemToDelete.type === 'goal' ? '🎯' : '✅'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{itemToDelete.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--mute)' }}>{itemToDelete.type}</div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--mute)', margin: '2px 0 6px', lineHeight: 1.45 }}>
              Are you sure you want to delete this {itemToDelete.type}?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                style={{
                  font: 'inherit',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  font: 'inherit',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #F59AB1, #D6456B)',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(214, 69, 107, 0.35)'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
