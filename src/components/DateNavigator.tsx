import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Sparkles,
  History
} from 'lucide-react';
import { 
  formatNavigatorDate, 
  addDays, 
  todayKey, 
  parseLocalDateKey, 
  toLocalDateKey 
} from '../utils/dates';
import type { TodoItem } from '../types';
import { playPopSound } from '../utils/delight';

interface DateNavigatorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todos: TodoItem[];
  isPastReadOnly: boolean;
  onTogglePastReadOnly: () => void;
  onOpenHistoryTimeline: () => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onSelectDate,
  todos,
  isPastReadOnly,
  onTogglePastReadOnly,
  onOpenHistoryTimeline,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const today = todayKey();
  const dateInfo = formatNavigatorDate(selectedDate);

  // Keyboard navigation: ArrowLeft/Right and 'T' for Today
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelectDate(addDays(selectedDate, -1));
        playPopSound();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelectDate(addDays(selectedDate, 1));
        playPopSound();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onSelectDate(today);
        playPopSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, onSelectDate, today]);

  // Click outside to close calendar popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  // Compute tasks metadata for the calendar dots
  const taskMap = React.useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    todos.forEach((t) => {
      if ((t.type || 'permanent') === 'daily' && t.date) {
        if (!map[t.date]) map[t.date] = { total: 0, done: 0 };
        map[t.date].total++;
        if (t.completed) map[t.date].done++;
      }
    });
    return map;
  }, [todos]);

  // Calendar popover month state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = parseLocalDateKey(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Calendar grid computation
  const calendarGrid = React.useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for 1st of month: 0=Sun, 1=Mon, ..., 6=Sat
    // We use Monday-first: 0=Mon ... 6=Sun
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: { key: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Leading days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        key: toLocalDateKey(prevDate),
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const curDate = new Date(year, month, d);
      days.push({
        key: toLocalDateKey(curDate),
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Trailing days from next month to fill 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        key: toLocalDateKey(nextDate),
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarMonth]);

  return (
    <div className="relative mb-4">
      {/* 1. Main Navigation Bar with 44px Touch Targets */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-sunken border border-subtle shadow-2xs">
        
        {/* Previous Day Button */}
        <button
          type="button"
          onClick={() => {
            onSelectDate(addDays(selectedDate, -1));
            playPopSound();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface hover:bg-sunken border border-subtle text-muted hover:text-main shadow-2xs transition active:scale-95 cursor-pointer"
          aria-label="Previous day"
          title="Previous day (Left Arrow)"
        >
          <ChevronLeft size={18} className="stroke-[2.5]" />
        </button>

        {/* Center: Date Title, Subtitle, and Calendar Popover Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsCalendarOpen(!isCalendarOpen);
            playPopSound();
          }}
          className="flex-1 mx-2 min-h-[44px] px-3 py-1.5 flex flex-col items-center justify-center rounded-xl hover:bg-surface/80 transition cursor-pointer select-none"
          aria-expanded={isCalendarOpen}
          aria-label="Select date from calendar"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-main tracking-tight">
              {dateInfo.title}
            </span>
            <Calendar size={13} className="text-accent stroke-[2.2]" />
          </div>
          {dateInfo.subtitle && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-faint">
              {dateInfo.subtitle}
            </span>
          )}
        </button>

        {/* Right Action Group: Today Jump + Next Day */}
        <div className="flex items-center gap-1">
          {/* Quick jump to Today if not on today */}
          {!dateInfo.isToday && (
            <button
              type="button"
              onClick={() => {
                onSelectDate(today);
                playPopSound();
              }}
              className="min-h-[44px] px-2.5 py-1 rounded-xl bg-accent-soft text-accent-text text-xs font-bold border border-accent/20 hover:bg-accent hover:text-on-accent transition active:scale-95 cursor-pointer flex items-center gap-1"
              title="Jump to Today (T key)"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Today</span>
            </button>
          )}

          {/* History Timeline Button */}
          <button
            type="button"
            onClick={() => {
              onOpenHistoryTimeline();
              playPopSound();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface hover:bg-sunken border border-subtle text-muted hover:text-main shadow-2xs transition active:scale-95 cursor-pointer"
            aria-label="Daily history timeline"
            title="View Daily History & Timeline"
          >
            <History size={16} className="stroke-[2.2]" />
          </button>

          {/* Next Day Button */}
          <button
            type="button"
            onClick={() => {
              onSelectDate(addDays(selectedDate, 1));
              playPopSound();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface hover:bg-sunken border border-subtle text-muted hover:text-main shadow-2xs transition active:scale-95 cursor-pointer"
            aria-label="Next day"
            title="Next day (Right Arrow)"
          >
            <ChevronRight size={18} className="stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* 2. Past Day Read-Only Banner / Notice with 1-Click Override */}
      {dateInfo.isPast && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-sunken border border-subtle flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-muted min-w-0">
            {isPastReadOnly ? (
              <Lock size={13} className="text-accent shrink-0" />
            ) : (
              <Unlock size={13} className="text-warning-text shrink-0" />
            )}
            <span className="truncate">
              {isPastReadOnly
                ? 'Viewing past day (read-only history)'
                : 'Editing enabled for this past day'}
            </span>
          </div>

          <button
            type="button"
            onClick={onTogglePastReadOnly}
            className="text-[11px] font-bold text-accent hover:underline shrink-0 ml-2 cursor-pointer"
          >
            {isPastReadOnly ? 'Edit this day' : 'Lock day'}
          </button>
        </div>
      )}

      {/* 3. Future Day Notice */}
      {dateInfo.isFuture && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-accent-soft/60 border border-accent/20 flex items-center gap-2 text-xs text-accent-text animate-in fade-in duration-150">
          <Sparkles size={13} className="text-accent shrink-0" />
          <span>Planning ahead for future day</span>
        </div>
      )}

      {/* 4. Calendar Popover Dropdown (Mobile-Friendly Grid) */}
      {isCalendarOpen && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 right-0 sm:left-auto sm:right-auto sm:w-80 mt-2 z-40 bg-surface border border-border-strong rounded-2xl shadow-raised p-3.5 text-main animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Month Header with Controls */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-subtle">
            <button
              type="button"
              onClick={() => {
                setCalendarMonth((prev) => {
                  const d = new Date(prev.year, prev.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                });
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-bold text-main">
              {new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>

            <button
              type="button"
              onClick={() => {
                setCalendarMonth((prev) => {
                  const d = new Date(prev.year, prev.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                });
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels (Mon-Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-faint mb-1">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((day) => {
              const isSelected = day.key === selectedDate;
              const isDayToday = day.key === today;
              const tasks = taskMap[day.key];
              const hasTasks = Boolean(tasks && tasks.total > 0);
              const allDone = hasTasks && tasks!.done === tasks!.total;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => {
                    onSelectDate(day.key);
                    setIsCalendarOpen(false);
                    playPopSound();
                  }}
                  className={`relative h-9 flex flex-col items-center justify-center rounded-xl text-xs transition active:scale-90 cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-on-accent font-extrabold shadow-soft'
                      : isDayToday
                      ? 'bg-accent-soft text-accent-text font-bold border border-accent/30'
                      : day.isCurrentMonth
                      ? 'text-main hover:bg-sunken'
                      : 'text-faint/40 hover:bg-sunken'
                  }`}
                >
                  <span className="leading-none">{day.dayNum}</span>

                  {/* Activity Dot */}
                  {hasTasks && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected
                          ? 'bg-on-accent'
                          : allDone
                          ? 'bg-success'
                          : 'bg-accent'
                      }`}
                      title={`${tasks!.done}/${tasks!.total} tasks completed`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer jump to today */}
          <div className="pt-2.5 mt-2.5 border-t border-subtle flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
                onSelectDate(today);
                setIsCalendarOpen(false);
                playPopSound();
              }}
              className="text-accent font-bold hover:underline cursor-pointer"
            >
              Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
            </button>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="text-muted hover:text-main cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
