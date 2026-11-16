import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import type { TodoItem, DayLog } from '../types';
import { 
  todayKey, 
  addDays, 
  diffInDays, 
  parseLocalDateKey, 
  startOfWeek, 
  endOfWeek,
  isBefore,
  isAfter,
  toLocalDateKey
} from '../utils/dates';
import { playPopSound } from '../utils/delight';

interface DailyHistoryTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: TodoItem[];
  dayLogs: Record<string, DayLog>;
  onSelectDate: (date: string) => void;
}

type TimeRangeFilter = 'this_week' | 'this_month' | 'last_30_days' | 'all';

export const DailyHistoryTimelineModal: React.FC<DailyHistoryTimelineModalProps> = ({
  isOpen,
  onClose,
  todos,
  dayLogs,
  onSelectDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('this_month');
  const [onlyUnfinished, setOnlyUnfinished] = useState(false);

  const today = todayKey();

  // Aggregate daily tasks by date
  const dateGroups = useMemo(() => {
    const map: Record<string, TodoItem[]> = {};

    todos.forEach((t) => {
      if ((t.type || 'permanent') === 'daily' && t.date) {
        if (!map[t.date]) map[t.date] = [];
        map[t.date].push(t);
      }
    });

    // Determine min and max range based on filter
    const now = new Date();
    let minDateKey = '2000-01-01';

    if (timeRange === 'this_week') {
      minDateKey = startOfWeek(today);
    } else if (timeRange === 'this_month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      minDateKey = toLocalDateKey(firstOfMonth);
    } else if (timeRange === 'last_30_days') {
      minDateKey = addDays(today, -30);
    }

    // Filter keys
    let keys = Object.keys(map).sort().reverse();

    if (minDateKey !== '2000-01-01') {
      keys = keys.filter((k) => k >= minDateKey);
    }

    // Filter by unfinished
    if (onlyUnfinished) {
      keys = keys.filter((k) => {
        const items = map[k] || [];
        return items.some((t) => !t.completed);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      keys = keys.filter((k) => {
        const items = map[k] || [];
        return items.some((t) => t.text.toLowerCase().includes(q));
      });
    }

    // Group into weeks
    const weekGroups: { weekLabel: string; days: { date: string; items: TodoItem[]; log?: DayLog }[] }[] = [];
    const weekMap: Record<string, { date: string; items: TodoItem[]; log?: DayLog }[]> = {};

    keys.forEach((k) => {
      const wStart = startOfWeek(k);
      const wEnd = endOfWeek(k);
      const label = `${wStart} to ${wEnd}`;
      if (!weekMap[label]) {
        weekMap[label] = [];
      }
      weekMap[label].push({
        date: k,
        items: map[k] || [],
        log: dayLogs[k],
      });
    });

    Object.entries(weekMap).forEach(([label, days]) => {
      weekGroups.push({ weekLabel: label, days });
    });

    return weekGroups;
  }, [todos, dayLogs, timeRange, onlyUnfinished, searchQuery, today]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[90vh] bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Calendar size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main leading-tight">
                Daily History & Timeline
              </h2>
              <span className="text-[11px] text-muted">
                Review past achievements, reflections and tasks
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
            aria-label="Close history"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="p-3.5 border-b border-subtle bg-sunken/40 space-y-2.5">
          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past tasks..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          {/* Range Pills and Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1">
              {(['this_week', 'this_month', 'last_30_days', 'all'] as const).map((r) => {
                const labels: Record<TimeRangeFilter, string> = {
                  this_week: 'This Week',
                  this_month: 'This Month',
                  last_30_days: 'Last 30d',
                  all: 'All Time',
                };
                const isSelected = timeRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setTimeRange(r);
                      playPopSound();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-on-accent shadow-2xs'
                        : 'bg-surface hover:bg-sunken border border-subtle text-muted'
                    }`}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyUnfinished}
                onChange={(e) => setOnlyUnfinished(e.target.checked)}
                className="rounded border-border-input text-accent focus:ring-accent"
              />
              <span>Unfinished only</span>
            </label>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {dateGroups.length === 0 ? (
            <div className="text-center py-10 text-faint space-y-1">
              <Clock size={28} className="mx-auto text-muted/40 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-muted">No past task records found</p>
              <p className="text-[11px]">Tasks will automatically organize here as each day completes.</p>
            </div>
          ) : (
            dateGroups.map((group, gIdx) => (
              <div key={group.weekLabel} className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-faint px-1">
                  Week of {group.days[0]?.date ? new Date(parseLocalDateKey(group.days[0].date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </div>

                <div className="space-y-2">
                  {group.days.map(({ date, items, log }) => {
                    const d = parseLocalDateKey(date);
                    const formattedDate = d.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    const isToday = date === today;
                    const doneCount = items.filter((t) => t.completed).length;
                    const totalCount = items.length;
                    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                    const unfinishedItems = items.filter((t) => !t.completed);

                    return (
                      <div
                        key={date}
                        onClick={() => {
                          onSelectDate(date);
                          playPopSound();
                          onClose();
                        }}
                        className={`group p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none hover:shadow-soft active:scale-98 ${
                          isToday
                            ? 'bg-accent-soft/30 border-accent/40'
                            : 'bg-surface hover:bg-sunken border-subtle'
                        }`}
                      >
                        {/* Day Row Header */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-main">
                              {formattedDate}
                            </span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 rounded-md bg-accent text-on-accent text-[9px] font-extrabold uppercase">
                                Today
                              </span>
                            )}
                            {log?.mood && (
                              <span className="text-xs select-none">
                                {log.mood === 5 ? '🌸' : log.mood === 4 ? '☀️' : log.mood === 3 ? '🌿' : log.mood === 2 ? '⛅' : '🌧️'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-muted">
                              {doneCount}/{totalCount} done
                            </span>
                            <ArrowRight size={13} className="text-muted group-hover:text-accent transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>

                        {/* Thin Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-sunken overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct === 100 ? 'bg-success' : 'bg-accent'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Reflection or Unfinished Preview */}
                        {log?.reflection ? (
                          <p className="text-[11px] text-muted line-clamp-1 italic mb-1">
                            "{log.reflection}"
                          </p>
                        ) : null}

                        {unfinishedItems.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-faint line-clamp-1">
                            <span className="font-bold text-warning-text shrink-0">Unfinished:</span>
                            <span className="truncate">{unfinishedItems.map((u) => u.text).join(' · ')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-subtle bg-sunken/40 flex items-center justify-between text-xs text-muted">
          <span>Tap any day to view or edit</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
