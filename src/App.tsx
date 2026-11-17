import { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Sparkles, FolderPlus, Folder, ExternalLink, GripVertical, Star, Paperclip, Check, Copy, Edit3, Trash2, LayoutGrid, Link2, BookOpen, RotateCcw } from 'lucide-react';

import type { 
  LinkItem, 
  CategoryInfo, 
  Attachment, 
  TodoItem, 
  NoteItem, 
  WorkspaceView, 
  ActivityEvent, 
  StreakState, 
  DayLog, 
  RoutineItem 
} from './types';
import { 
  loadLinks, 
  saveLinks, 
  loadCategories, 
  saveCategories, 
  loadTodos, 
  saveTodos, 
  loadNotes, 
  saveNotes, 
  loadActivityEvents, 
  saveActivityEvents, 
  logActivity, 
  loadDayLogs, 
  saveDayLog, 
  saveDayLogs, 
  loadStreakState, 
  saveStreakState, 
  loadRoutines, 
  saveRoutines, 
  runDataMigration, 
  purgeAllSampleData, 
  isSampleItem, 
  isPreinstalledCategory,
  loadCustomBackground,
  saveCustomBackgroundImage,
  saveBackgroundSettings,
  type BackgroundSettings,
  DEFAULT_CATEGORIES, 
  INITIAL_LINKS, 
  INITIAL_TODOS, 
  INITIAL_NOTES 
} from './services/storage';
import { normalizeUrl, generateSuggestedTitle, getFaviconUrl, extractDomain, formatRelativeTime } from './utils/urlHelper';
import { triggerPartyPop, playPopSound } from './utils/delight';
import { todayKey, addDays, toLocalDateKey } from './utils/dates';

import { Header } from './components/Header';
import { QuickAddBar } from './components/QuickAddBar';
import { CategoryBundleSquare } from './components/CategoryBundleSquare';
import { StandaloneLinkCard } from './components/StandaloneLinkCard';
import { FolderGridPopup } from './components/FolderGridPopup';
import { EditCategoryModal } from './components/EditCategoryModal';
import { LinkModal } from './components/LinkModal';
import { DetailModal } from './components/DetailModal';
import { ExportImportModal } from './components/ExportImportModal';
import { PwaPrompt } from './components/PwaPrompt';
import { AttachmentViewerModal } from './components/AttachmentViewerModal';
import { NotebookArea } from './components/NotebookArea';
import { DesignGuideModal } from './components/DesignGuideModal';

import { GoalModal } from './components/GoalModal';
import { ExtendDeadlineModal } from './components/ExtendDeadlineModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { DailyHistoryTimelineModal } from './components/DailyHistoryTimelineModal';
import { DayInspectionDrawer } from './components/DayInspectionDrawer';
import { InsightsModal } from './components/InsightsModal';
import { WeeklyReviewModal } from './components/WeeklyReviewModal';
import { UnfinishedRolloverSheet } from './components/UnfinishedRolloverSheet';
import { WallpaperModal } from './components/WallpaperModal';
import { SyncModal } from './components/SyncModal';
import { 
  syncWithCloud, 
  initRealtimeSync, 
  subscribeToSyncStatus, 
  subscribeToWallpaper,
  type SyncStatusState 
} from './services/syncService';

export function App() {
  // Main Data States
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>(DEFAULT_CATEGORIES);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('links');
  const [isLoading, setIsLoading] = useState(true);

  // Date, Streaks & Activity Log
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>({});
  const [streakState, setStreakState] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    freezesRemaining: 1,
    frozenDates: [],
  });
  const [routines, setRoutines] = useState<RoutineItem[]>([]);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Active Dragging Link ID & Category Dragging State
  const [activeDraggingLinkId, setActiveDraggingLinkId] = useState<string | null>(null);
  const [isDraggingAnyCategory, setIsDraggingAnyCategory] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoArchive, setUndoArchive] = useState<{
    archivedIds: string[];
    message: string;
    timeoutId: any;
  } | null>(null);

  // Dark/Light Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sreeshspace_theme');
    if (saved) return saved === 'dark';
    return false; // Calm Oat & Sage light default
  });

  // Accent Theme (honey, sage, peach, wisteria, sky)
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    return localStorage.getItem('sreeshspace_accent') || 'honey';
  });

  // Modals & Viewers
  const [isDesignGuideOpen, setIsDesignGuideOpen] = useState(false);
  const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');
  const [prefilledCategory, setPrefilledCategory] = useState<string>('');
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [detailLink, setDetailLink] = useState<LinkItem | null>(null);
  const [folderModalCategory, setFolderModalCategory] = useState<CategoryInfo | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPwaPromptOpen, setIsPwaPromptOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // To-Do, Goals & Habits Specific Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [activeGoalForModal, setActiveGoalForModal] = useState<TodoItem | null>(null);
  const [extendingGoal, setExtendingGoal] = useState<TodoItem | null>(null);
  const [focusTask, setFocusTask] = useState<TodoItem | null>(null);
  const [isHistoryTimelineOpen, setIsHistoryTimelineOpen] = useState(false);
  const [inspectingDateKey, setInspectingDateKey] = useState<string | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [rolloverCandidateTasks, setRolloverCandidateTasks] = useState<TodoItem[]>([]);

  // Custom Wallpaper & Opacity
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>({
    opacity: 0.25,
    blur: 0,
    enabled: true,
  });
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

  // Cloud Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncStatusState>('synced');
  const syncDebounceTimer = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshDataFromStorage = async () => {
    try {
      const [
        loadedLinks,
        loadedCats,
        loadedTodos,
        loadedNotes,
        loadedEvents,
        loadedDayLogs,
        loadedStreak,
        loadedRoutines,
        loadedBgData,
      ] = await Promise.all([
        loadLinks(),
        loadCategories(),
        loadTodos(),
        loadNotes(),
        loadActivityEvents(),
        loadDayLogs(),
        loadStreakState(),
        loadRoutines(),
        loadCustomBackground(),
      ]);
      setLinks(loadedLinks);
      setCategories(loadedCats.filter((c) => !isPreinstalledCategory(c)));
      setTodos(loadedTodos);
      setNotes(loadedNotes);
      setEvents(loadedEvents);
      setDayLogs(loadedDayLogs);
      if (loadedStreak) setStreakState(loadedStreak);
      setRoutines(loadedRoutines);
      if (loadedBgData) {
        setCustomBgImage(loadedBgData.imageUrl);
        setBgSettings(loadedBgData.settings);
      }
    } catch (err) {
      console.error('Failed to refresh data from storage:', err);
    }
  };

  const triggerAutoSync = () => {
    if (syncDebounceTimer.current) {
      clearTimeout(syncDebounceTimer.current);
    }
    syncDebounceTimer.current = setTimeout(() => {
      syncWithCloud({ onMerged: refreshDataFromStorage });
    }, 2500);
  };

  // Cloud Sync setup & background listeners
  useEffect(() => {
    const unsubStatus = subscribeToSyncStatus((status) => {
      setSyncState(status.state);
    });

    const unsubRealtime = initRealtimeSync(() => {
      refreshDataFromStorage();
    });

    const unsubWallpaper = subscribeToWallpaper((wp) => {
      setCustomBgImage(wp.imageUrl);
      setBgSettings({
        opacity: wp.opacity ?? 0.25,
        blur: wp.blur ?? 0,
        enabled: wp.enabled ?? true,
      });
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithCloud({ onMerged: refreshDataFromStorage });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubStatus();
      unsubRealtime();
      unsubWallpaper();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Initial Data Load & Migration
  useEffect(() => {
    async function init() {
      try {
        if (localStorage.getItem('orbit_clean_slate_v5') !== 'true') {
          await purgeAllSampleData();
          const rawCats = await loadCategories();
          const cleanCats = rawCats.filter((c) => !isPreinstalledCategory(c));
          await saveCategories(cleanCats);
          localStorage.setItem('orbit_clean_slate_v5', 'true');
        }
        await runDataMigration();
        const [
          loadedLinks,
          loadedCats,
          loadedTodos,
          loadedNotes,
          loadedEvents,
          loadedDayLogs,
          loadedStreak,
          loadedRoutines,
          loadedBgData,
        ] = await Promise.all([
          loadLinks(),
          loadCategories(),
          loadTodos(),
          loadNotes(),
          loadActivityEvents(),
          loadDayLogs(),
          loadStreakState(),
          loadRoutines(),
          loadCustomBackground(),
        ]);
        const cleanLinks = loadedLinks.filter((l) => !isSampleItem(l));
        const cleanTodos = loadedTodos.filter((t) => !isSampleItem(t));
        const cleanNotes = loadedNotes.filter((n) => !isSampleItem(n));
        const cleanEvents = loadedEvents.filter((e) => !isSampleItem(e));

        if (cleanLinks.length !== loadedLinks.length) await saveLinks(cleanLinks);
        if (cleanTodos.length !== loadedTodos.length) await saveTodos(cleanTodos);
        if (cleanNotes.length !== loadedNotes.length) await saveNotes(cleanNotes);
        if (cleanEvents.length !== loadedEvents.length) await saveActivityEvents(cleanEvents);

        setLinks(cleanLinks);
        setCategories(loadedCats);
        setTodos(cleanTodos);
        setNotes(cleanNotes);
        setEvents(cleanEvents);
        setDayLogs(loadedDayLogs);
        if (loadedStreak) setStreakState(loadedStreak);
        setRoutines(loadedRoutines);
        if (loadedBgData?.imageUrl) setCustomBgImage(loadedBgData.imageUrl);
        if (loadedBgData?.settings) setBgSettings(loadedBgData.settings);

        // Check for unfinished yesterday tasks on open
        const yesterday = addDays(todayKey(), -1);
        const unfinishedYesterday = loadedTodos.filter(
          (t) => (t.type || 'permanent') === 'daily' && t.date === yesterday && !t.completed && t.status !== 'archived'
        );
        if (unfinishedYesterday.length > 0) {
          setRolloverCandidateTasks(unfinishedYesterday);
          setIsRolloverOpen(true);
        }

        // Background cloud sync with Supabase
        syncWithCloud({ onMerged: refreshDataFromStorage });
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Midnight rollover watcher & visibility check
  useEffect(() => {
    const handleCheckDayRollover = () => {
      const nowKey = todayKey();
      if (selectedDate !== nowKey && selectedDate === addDays(nowKey, -1)) {
        setSelectedDate(nowKey);
      }
    };
    document.addEventListener('visibilitychange', handleCheckDayRollover);
    const interval = setInterval(handleCheckDayRollover, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleCheckDayRollover);
      clearInterval(interval);
    };
  }, [selectedDate]);

  // Theme & Accent Sync to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('sreeshspace_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('sreeshspace_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentTheme);
    localStorage.setItem('sreeshspace_accent', accentTheme);
  }, [accentTheme]);

  // PWA beforeinstallprompt handler
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Listen to #/design hash navigation for Color Guide modal
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#/design') {
        setIsDesignGuideOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleCloseDesignGuide = () => {
    setIsDesignGuideOpen(false);
    if (window.location.hash === '#/design') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
    setIsPwaPromptOpen(false);
  };

  // Standalone Links Filtered
  const standaloneLinks = useMemo(() => {
    return links.filter(
      (l) => !l.category || l.category === 'Uncategorized' || l.category === ''
    );
  }, [links]);

  // Filtered links by search query
  const searchFilteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return links.filter(
      (l) =>
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.url && l.url.toLowerCase().includes(q)) ||
        (l.category && l.category.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q))
    );
  }, [links, searchQuery]);

  // --- LINK & CATEGORY ACTIONS ---
  const handleQuickAdd = async (url: string) => {
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) return;

    const domain = extractDomain(cleanUrl);
    const suggestedTitle = generateSuggestedTitle(cleanUrl);
    const favicon = getFaviconUrl(cleanUrl);

    const newLink: LinkItem = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: cleanUrl,
      title: suggestedTitle || domain,
      category: 'Uncategorized',
      notes: '',
      pinned: false,
      attachments: [],
      clicks: 0,
      favicon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newLink, ...links];
    setLinks(updated);
    await saveLinks(updated);
    await logActivity('link_added', newLink.id, newLink.title || newLink.url);

    triggerPartyPop('single');
    showToast(`Saved ${newLink.title}! 🌿`);
    triggerAutoSync();
  };

  const handleSaveLink = async (linkData: Partial<LinkItem>) => {
    if (editingLink) {
      const updated = links.map((l) =>
        l.id === editingLink.id
          ? {
              ...l,
              ...linkData,
              updatedAt: new Date().toISOString(),
            }
          : l
      );
      setLinks(updated);
      await saveLinks(updated);
      showToast('Link updated! ✨');
      triggerAutoSync();
    } else {
      const cleanUrl = normalizeUrl(linkData.url || '');
      const domain = extractDomain(cleanUrl);
      const favicon = getFaviconUrl(cleanUrl);

      const newLink: LinkItem = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        url: cleanUrl,
        title: linkData.title || domain || 'Saved Bookmark',
        category: linkData.category || 'Uncategorized',
        notes: linkData.notes || '',
        pinned: Boolean(linkData.pinned),
        attachments: linkData.attachments || [],
        clicks: 0,
        favicon,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newLink, ...links];
      setLinks(updated);
      await saveLinks(updated);
      await logActivity('link_added', newLink.id, newLink.title || newLink.url);
      triggerPartyPop('single');
      showToast('Added bookmark! 🌿');
      triggerAutoSync();
    }

    setIsAddModalOpen(false);
    setEditingLink(null);
  };

  const handleDeleteLink = async (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    await saveLinks(updated);
    if (detailLink && detailLink.id === id) setDetailLink(null);
    showToast('Bookmark deleted');
    triggerAutoSync();
  };

  const handleTogglePin = async (id: string) => {
    const updated = links.map((l) =>
      l.id === id ? { ...l, pinned: !l.pinned, updatedAt: new Date().toISOString() } : l
    );
    setLinks(updated);
    await saveLinks(updated);
  };

  const handleVisitLink = async (link: LinkItem) => {
    const updated = links.map((l) =>
      l.id === link.id ? { ...l, clicks: (l.clicks || 0) + 1 } : l
    );
    setLinks(updated);
    await saveLinks(updated);
    await logActivity('link_opened', link.id, link.title || link.url);
  };

  const handleDropLinkOnCategory = async (linkId: string, categoryName: string) => {
    const targetLink = links.find((l) => l.id === linkId);
    if (!targetLink) return;

    if (targetLink.category === categoryName) return;

    const updated = links.map((l) =>
      l.id === linkId
        ? { ...l, category: categoryName, updatedAt: new Date().toISOString() }
        : l
    );
    setLinks(updated);
    await saveLinks(updated);
    playPopSound();
    triggerPartyPop('single');
    showToast(`Moved "${targetLink.title}" to ${categoryName}! 📁`);
  };

  const handleMoveLinkCategory = async (linkId: string, newCategoryName: string) => {
    const updated = links.map((l) =>
      l.id === linkId
        ? { ...l, category: newCategoryName, updatedAt: new Date().toISOString() }
        : l
    );
    setLinks(updated);
    await saveLinks(updated);
    showToast(`Moved bookmark to ${newCategoryName}`);
  };

  const handleReorderLinksInCategory = async (reorderedLinks: LinkItem[], categoryName: string) => {
    const others = links.filter((l) => l.category !== categoryName);
    const finalLinks = [...reorderedLinks, ...others];
    setLinks(finalLinks);
    await saveLinks(finalLinks);
  };

  const handleReorderCategory = async (fromIndex: number, toIndex: number) => {
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setCategories(reordered);
    await saveCategories(reordered);
  };

  const handleAddCategory = async (newCat: { name: string; color: string; icon: string }) => {
    const cat: CategoryInfo = {
      id: `cat-${Date.now()}`,
      name: newCat.name,
      color: newCat.color,
      icon: newCat.icon,
    };
    const updated = [...categories, cat];
    setCategories(updated);
    await saveCategories(updated);
    showToast(`Created folder "${cat.name}"! 📁`);
  };

  const handleSaveCategory = async (updatedCat: CategoryInfo) => {
    const oldCat = categories.find((c) => c.id === updatedCat.id);
    const updated = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(updated);
    await saveCategories(updated);

    if (oldCat && oldCat.name !== updatedCat.name) {
      const updatedLinks = links.map((l) =>
        l.category === oldCat.name ? { ...l, category: updatedCat.name } : l
      );
      setLinks(updatedLinks);
      await saveLinks(updatedLinks);
    }

    setEditingCategory(null);
    showToast('Folder updated! ✨');
  };

  const handleDeleteCategory = async (catId: string, deleteLinksInCat: boolean = false) => {
    const catToDelete = categories.find((c) => c.id === catId);
    if (!catToDelete) return;

    const updatedCats = categories.filter((c) => c.id !== catId);
    setCategories(updatedCats);
    await saveCategories(updatedCats);

    if (deleteLinksInCat) {
      const updatedLinks = links.filter((l) => l.category !== catToDelete.name);
      setLinks(updatedLinks);
      await saveLinks(updatedLinks);
    } else {
      const updatedLinks = links.map((l) =>
        l.category === catToDelete.name ? { ...l, category: 'Uncategorized' } : l
      );
      setLinks(updatedLinks);
      await saveLinks(updatedLinks);
    }

    showToast(`Folder removed. Bookmarks moved to canvas.`);
  };

  // --- TO-DO, GOALS & HABITS HANDLERS ---

  // Add Daily or Permanent task
  const handleAddTodo = async (
    text: string, 
    type: 'daily' | 'permanent' = 'daily', 
    priority: 'low' | 'medium' | 'high' = 'medium',
    dateKey?: string,
    tags?: string[]
  ) => {
    const date = type === 'daily' ? (dateKey || selectedDate) : undefined;
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      type,
      date,
      startDate: type === 'permanent' ? todayKey() : undefined,
      status: 'active',
      progressMode: 'checklist',
      progress: 0,
      subtasks: [],
      extensions: [],
      completed: false,
      priority,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    const updated = [newTodo, ...todos];
    setTodos(updated);
    await saveTodos(updated);

    const eventType = type === 'daily' ? 'task_added' : 'goal_created';
    await logActivity(eventType, newTodo.id, text, { priority, date });
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);

    triggerPartyPop('single');
    showToast(`Added ${type === 'daily' ? 'daily task' : 'master goal'} "${text}"! 📋`);
    triggerAutoSync();
  };

  // Toggle Complete / Incomplete
  const handleToggleTodo = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;
    const nowIso = new Date().toISOString();

    const updated = todos.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        completed: nextCompleted,
        completedAt: nextCompleted ? nowIso : undefined,
        status: (nextCompleted ? 'completed' : 'active') as any,
        progress: t.type === 'permanent' ? (nextCompleted ? 100 : t.progress) : t.progress,
      };
    });

    setTodos(updated);
    await saveTodos(updated);

    const isDaily = (target.type || 'permanent') === 'daily';
    const eventType = nextCompleted 
      ? (isDaily ? 'task_completed' : 'goal_completed')
      : 'task_uncompleted';

    await logActivity(eventType, target.id, target.text);
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);

    if (nextCompleted) {
      triggerPartyPop('single');
      playPopSound();
      showToast(`Completed "${target.text}"! 🎉`);

      // Update streak state
      const today = todayKey();
      if (streakState.lastActiveDate !== today) {
        const nextStreak = streakState.currentStreak + 1;
        const newStreak: StreakState = {
          ...streakState,
          currentStreak: nextStreak,
          longestStreak: Math.max(streakState.longestStreak, nextStreak),
          totalActiveDays: streakState.totalActiveDays + 1,
          lastActiveDate: today,
        };
        setStreakState(newStreak);
        await saveStreakState(newStreak);
      }
    }
    triggerAutoSync();
  };

  // Delete Todo (removes task and cleans up any related activity events)
  const handleDeleteTodo = async (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    await saveTodos(updated);

    // Filter out activity events for the deleted task
    const freshEvents = await loadActivityEvents();
    const cleanEvents = freshEvents.filter((e) => e.refId !== id && !e.type.includes('deleted'));
    await saveActivityEvents(cleanEvents);
    setEvents(cleanEvents);

    showToast('Task removed');
    triggerAutoSync();
  };

  // Archive completed daily tasks with 10-second Undo toast
  const handleArchiveCompletedDaily = async (dateKey: string) => {
    const toArchive = todos.filter(
      (t) => (t.type || 'permanent') === 'daily' && (t.date === dateKey || (!t.date && dateKey === todayKey())) && t.completed && t.status !== 'archived'
    );
    if (toArchive.length === 0) return;

    const toArchiveIds = new Set(toArchive.map((t) => t.id));
    const updated = todos.map((t) => (toArchiveIds.has(t.id) ? { ...t, status: 'archived' as const } : t));
    setTodos(updated);
    await saveTodos(updated);

    if (undoArchive?.timeoutId) clearTimeout(undoArchive.timeoutId);
    const timeoutId = setTimeout(() => setUndoArchive(null), 10000);

    setUndoArchive({
      archivedIds: Array.from(toArchiveIds),
      message: `Archived ${toArchive.length} completed task${toArchive.length > 1 ? 's' : ''}`,
      timeoutId,
    });
  };

  // Archive completed permanent goals with 10-second Undo toast
  const handleArchiveCompletedPermanent = async () => {
    const toArchive = todos.filter((t) => t.type === 'permanent' && t.completed && t.status !== 'archived');
    if (toArchive.length === 0) return;

    const toArchiveIds = new Set(toArchive.map((t) => t.id));
    const updated = todos.map((t) => (toArchiveIds.has(t.id) ? { ...t, status: 'archived' as const } : t));
    setTodos(updated);
    await saveTodos(updated);

    if (undoArchive?.timeoutId) clearTimeout(undoArchive.timeoutId);
    const timeoutId = setTimeout(() => setUndoArchive(null), 10000);

    setUndoArchive({
      archivedIds: Array.from(toArchiveIds),
      message: `Archived ${toArchive.length} completed goal${toArchive.length > 1 ? 's' : ''}`,
      timeoutId,
    });
  };

  // Handle Undo for Archive
  const handleUndoArchive = async () => {
    if (!undoArchive) return;
    const ids = new Set(undoArchive.archivedIds);
    const restored = todos.map((t) => (ids.has(t.id) ? { ...t, status: 'completed' as const } : t));
    setTodos(restored);
    await saveTodos(restored);
    if (undoArchive.timeoutId) clearTimeout(undoArchive.timeoutId);
    setUndoArchive(null);
    showToast('Restored archived items! ↩️');
  };

  // Reorder todos (liquid drag-and-drop)
  const handleReorderTodos = async (reordered: TodoItem[]) => {
    setTodos(reordered);
    await saveTodos(reordered);
  };

  // Subtask Toggle on Goal
  const handleToggleSubtask = async (goalId: string, subtaskId: string) => {
    const goal = todos.find((t) => t.id === goalId);
    if (!goal) return;

    const subtasks = goal.subtasks || [];
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId
        ? {
            ...st,
            done: !st.done,
            doneAt: !st.done ? new Date().toISOString() : undefined,
          }
        : st
    );

    const totalSub = updatedSubtasks.length;
    const doneSub = updatedSubtasks.filter((s) => s.done).length;
    const progress = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : goal.progress || 0;
    const isCompleted = totalSub > 0 && doneSub === totalSub;

    const updated = todos.map((t) =>
      t.id === goalId
        ? {
            ...t,
            subtasks: updatedSubtasks,
            progress,
            completed: isCompleted,
            status: (isCompleted ? 'completed' : 'active') as any,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
          }
        : t
    );

    setTodos(updated);
    await saveTodos(updated);

    const stItem = updatedSubtasks.find((s) => s.id === subtaskId);
    if (stItem?.done) {
      await logActivity('subtask_done', goalId, `Subtask: "${stItem.text}" in "${goal.text}"`);
      const freshEvents = await loadActivityEvents();
      setEvents(freshEvents);
      playPopSound();
    }
  };

  // Create or update Master Goal
  const handleSaveGoal = async (goalData: Partial<TodoItem>) => {
    if (activeGoalForModal) {
      // Editing existing goal
      const updated = todos.map((t) =>
        t.id === activeGoalForModal.id
          ? {
              ...t,
              ...goalData,
            }
          : t
      );
      setTodos(updated);
      await saveTodos(updated);
      showToast('Master goal updated! ✨');
    } else {
      // Create new goal
      const newGoal: TodoItem = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: goalData.text || 'Master Goal',
        type: 'permanent',
        priority: goalData.priority || 'medium',
        startDate: goalData.startDate || todayKey(),
        endDate: goalData.endDate,
        status: 'active',
        progressMode: goalData.progressMode || 'checklist',
        progress: goalData.progress || 0,
        subtasks: goalData.subtasks || [],
        extensions: [],
        tags: goalData.tags || [],
        notes: goalData.notes,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [newGoal, ...todos];
      setTodos(updated);
      await saveTodos(updated);
      await logActivity('goal_created', newGoal.id, newGoal.text, { endDate: newGoal.endDate });
      const freshEvents = await loadActivityEvents();
      setEvents(freshEvents);

      triggerPartyPop('single');
      showToast(`Created master goal "${newGoal.text}"! 🎯`);
    }

    setIsGoalModalOpen(false);
    setActiveGoalForModal(null);
  };

  // Extend Goal Deadline
  const handleExtendGoal = async (goalId: string, newEndDate: string, reason?: string) => {
    const goal = todos.find((t) => t.id === goalId);
    if (!goal) return;

    const extension = {
      from: goal.endDate || todayKey(),
      to: newEndDate,
      reason,
      at: new Date().toISOString(),
    };

    const updated = todos.map((t) =>
      t.id === goalId
        ? {
            ...t,
            endDate: newEndDate,
            extensions: [...(t.extensions || []), extension],
          }
        : t
    );

    setTodos(updated);
    await saveTodos(updated);
    await logActivity('goal_extended', goalId, `Extended "${goal.text}" to ${newEndDate}`, { reason });
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);

    setExtendingGoal(null);
    showToast(`Extended deadline to ${newEndDate}! 📅`);
  };

  // Focus Timer Session Completed
  const handleFinishFocusSession = async (taskId: string, durationMinutes: number) => {
    const task = todos.find((t) => t.id === taskId);
    const title = task ? task.text : 'Focus session';

    await logActivity('focus_session', taskId, `Focus Session (${durationMinutes}m): "${title}"`, { minutes: durationMinutes });
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);

    // Update streak day
    const today = todayKey();
    if (streakState.lastActiveDate !== today) {
      const nextStreak = streakState.currentStreak + 1;
      const newStreak: StreakState = {
        ...streakState,
        currentStreak: nextStreak,
        longestStreak: Math.max(streakState.longestStreak, nextStreak),
        totalActiveDays: streakState.totalActiveDays + 1,
        lastActiveDate: today,
      };
      setStreakState(newStreak);
      await saveStreakState(newStreak);
    }

    setFocusTask(null);
    triggerPartyPop('grand');
    showToast(`Great work! Logged ${durationMinutes}m focus session! 🧘`);
  };

  // Apply Streak Freeze
  const handleApplyStreakFreeze = async (dateToFreeze: string) => {
    if (streakState.freezesRemaining <= 0) return;
    if (streakState.frozenDates?.includes(dateToFreeze)) return;

    const nextFreezes = streakState.freezesRemaining - 1;
    const nextFrozenDates = [...(streakState.frozenDates || []), dateToFreeze];
    const newStreak: StreakState = {
      ...streakState,
      freezesRemaining: nextFreezes,
      frozenDates: nextFrozenDates,
    };
    setStreakState(newStreak);
    await saveStreakState(newStreak);
    showToast(`Streak freeze applied for ${dateToFreeze}! ❄️`);
  };

  // Rollover Unfinished Tasks Handlers
  const handleCarrySelectedRollover = async (selectedIds: string[]) => {
    const today = todayKey();
    const selSet = new Set(selectedIds);

    const updated = todos.map((t) => {
      if (!selSet.has(t.id)) return t;
      return {
        ...t,
        date: today,
        carriedFrom: t.date || addDays(today, -1),
        carryCount: (t.carryCount || 0) + 1,
      };
    });

    setTodos(updated);
    await saveTodos(updated);
    setIsRolloverOpen(false);
    showToast(`Carried over ${selectedIds.length} tasks to today! ☀️`);
  };

  const handleLeaveBehindRollover = () => {
    setIsRolloverOpen(false);
  };

  // Copy yesterday's task list to today
  const handleCopyYesterdayList = async () => {
    const yesterday = addDays(todayKey(), -1);
    const yesterdayTasks = todos.filter(
      (t) => (t.type || 'permanent') === 'daily' && t.date === yesterday && t.status !== 'archived'
    );
    if (yesterdayTasks.length === 0) {
      showToast('No tasks recorded for yesterday.');
      return;
    }

    const today = todayKey();
    const copiedTasks: TodoItem[] = yesterdayTasks.map((t) => ({
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: t.text,
      type: 'daily',
      priority: t.priority,
      date: today,
      completed: false,
      status: 'active',
      carriedFrom: yesterday,
      originId: t.id,
      carryCount: (t.carryCount || 0) + 1,
      subtasks: (t.subtasks || []).map((s) => ({ ...s, done: false, doneAt: undefined })),
      createdAt: new Date().toISOString(),
    }));

    const updated = [...copiedTasks, ...todos];
    setTodos(updated);
    await saveTodos(updated);
    showToast(`Copied ${copiedTasks.length} tasks from yesterday! 📋`);
  };

  // DayLog reflection & mood updates
  const handleSaveDayLog = async (dateKey: string, updates: Partial<DayLog>) => {
    const existing = dayLogs[dateKey] || { date: dateKey, planned: 0, completed: 0 };
    const merged: DayLog = { ...existing, ...updates };
    const nextLogs = { ...dayLogs, [dateKey]: merged };
    setDayLogs(nextLogs);
    await saveDayLog(dateKey, merged);
  };

  // Sunday Weekly Review save priorities
  const handleSaveNextWeekPriorities = async (priorities: string[]) => {
    const nextMon = addDays(todayKey(), 1);
    const newItems: TodoItem[] = priorities.map((p) => ({
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: p,
      type: 'daily',
      priority: 'high',
      date: nextMon,
      completed: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    }));

    const updated = [...newItems, ...todos];
    setTodos(updated);
    await saveTodos(updated);
    showToast('Scheduled top priorities for next week! 🚀');
  };

  // --- NOTE HANDLERS ---
  const handleAddNote = async (newNote: { 
    title: string; 
    content: string; 
    highlight?: string;
    color: string; 
    pinned: boolean;
    attachments?: Attachment[];
  }) => {
    const item: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newNote.title,
      content: newNote.content,
      highlight: newNote.highlight,
      color: newNote.color,
      pinned: newNote.pinned,
      attachments: newNote.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [item, ...notes];
    setNotes(updated);
    await saveNotes(updated);
    await logActivity('note_added', item.id, item.title);
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);

    showToast(`Saved note "${item.title}"! 📝`);
    triggerAutoSync();
  };

  const handleUpdateNote = async (updatedNote: NoteItem) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    await saveNotes(updated);
    await logActivity('note_edited', updatedNote.id, updatedNote.title);
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);

    showToast('Note updated! ✨');
    triggerAutoSync();
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    await saveNotes(updated);
    showToast('Note deleted');
    triggerAutoSync();
  };

  const handleReorderNotes = async (reordered: NoteItem[]) => {
    setNotes(reordered);
    await saveNotes(reordered);
    triggerAutoSync();
  };

  // Import Backup
  const handleImportData = async (data: { 
    links: LinkItem[]; 
    categories: CategoryInfo[];
    todos?: TodoItem[];
    notes?: NoteItem[];
  }) => {
    const existingUrls = new Set(links.map((l) => l.url.toLowerCase()));
    const newItems = data.links.filter((l) => !existingUrls.has(l.url.toLowerCase()));
    const finalLinks = [...newItems, ...links];

    const existingCats = new Set(categories.map((c) => c.name.toLowerCase()));
    const newCats = data.categories.filter((c) => !existingCats.has(c.name.toLowerCase()));
    const finalCats = [...categories, ...newCats];

    setLinks(finalLinks);
    setCategories(finalCats);
    await saveLinks(finalLinks);
    await saveCategories(finalCats);

    if (data.todos && Array.isArray(data.todos)) {
      setTodos(data.todos);
      await saveTodos(data.todos);
    }
    if (data.notes && Array.isArray(data.notes)) {
      setNotes(data.notes);
      await saveNotes(data.notes);
    }

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    showToast('Import successful! 🎉');
  };

  // Clear all data to fresh empty canvas
  const handleResetData = async () => {
    setLinks([]);
    setCategories(DEFAULT_CATEGORIES);
    setTodos([]);
    setNotes([]);
    setEvents([]);
    setDayLogs({});
    const cleanStreak: StreakState = {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      freezesRemaining: 1,
      frozenDates: [],
    };
    setStreakState(cleanStreak);
    await saveLinks([]);
    await saveCategories(DEFAULT_CATEGORIES);
    await saveTodos([]);
    await saveNotes([]);
    await saveActivityEvents([]);
    await saveDayLogs({});
    await saveStreakState(cleanStreak);
    triggerAutoSync();
    showToast('All sample data removed. Clean canvas ready! 🌿');
  };

  // Clear all master goals
  const handleClearAllGoals = async () => {
    const updated = todos.filter((t) => t.type !== 'permanent');
    setTodos(updated);
    await saveTodos(updated);
    triggerAutoSync();
    showToast('Cleared all master goals 🎯');
  };

  // Wallpaper handlers
  const handleSaveCustomBgImage = async (dataUrl: string | null) => {
    setCustomBgImage(dataUrl);
    await saveCustomBackgroundImage(dataUrl);
    triggerAutoSync();
    if (dataUrl) {
      showToast('Custom wallpaper updated and synced! 🖼️');
    } else {
      showToast('Wallpaper removed. Restored cozy theme.');
    }
  };

  const handleUpdateBgSettings = (newSettings: BackgroundSettings) => {
    setBgSettings(newSettings);
    saveBackgroundSettings(newSettings);
    triggerAutoSync();
  };

  return (
    <div className="min-h-screen bg-page text-main flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden">
      
      {/* Full-Screen Custom Wallpaper Layer (Controlled Opacity & Blur) */}
      {customBgImage && bgSettings.enabled && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-300"
          style={{
            backgroundImage: `url(${customBgImage})`,
            opacity: bgSettings.opacity,
            filter: bgSettings.blur > 0 ? `blur(${bgSettings.blur}px)` : undefined,
            transform: bgSettings.blur > 0 ? 'scale(1.04)' : undefined,
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={() => {
            setEditingLink(null);
            setPrefilledUrl('');
            setPrefilledCategory('Uncategorized');
            setIsAddModalOpen(true);
          }}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenPwaGuide={() => setIsPwaPromptOpen(true)}
          onOpenDesignGuide={() => setIsDesignGuideOpen(true)}
          onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          totalCount={links.length}
        />

      {/* Floating Toast Notification / Undo Toast */}
      {undoArchive ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-raised text-main border border-border-strong px-4 py-2.5 rounded-2xl shadow-raised text-xs sm:text-sm font-semibold backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{undoArchive.message}</span>
          <button
            type="button"
            onClick={handleUndoArchive}
            className="flex items-center gap-1 text-accent font-extrabold hover:underline cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Undo</span>
          </button>
        </div>
      ) : toastMessage ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-raised text-main border border-border-strong px-4 py-2 rounded-2xl shadow-raised text-xs sm:text-sm font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      ) : null}

      {/* Main Single Screen Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-7 space-y-5 sm:space-y-6">
        
        {/* Quick Add Bar */}
        <QuickAddBar
          onQuickAdd={handleQuickAdd}
          onOpenDetailedModal={(url) => {
            setEditingLink(null);
            setPrefilledUrl(url || '');
            setPrefilledCategory('Uncategorized');
            setIsAddModalOpen(true);
          }}
        />

        {/* IF SEARCHING: Show Live Search Results */}
        {searchQuery.trim() ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-main">
                Search results for "{searchQuery}" ({searchFilteredLinks.length})
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-accent font-semibold hover:underline"
              >
                Clear search
              </button>
            </div>

            {searchFilteredLinks.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-surface border border-subtle">
                <p className="text-sm font-bold text-main mb-1">
                  No matching links found
                </p>
                <p className="text-xs text-faint">
                  Try searching with a different keyword or clear search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4.5">
                {searchFilteredLinks.map((link) => (
                  <StandaloneLinkCard
                    key={link.id}
                    link={link}
                    onSelect={(l) => setDetailLink(l)}
                    onTogglePin={handleTogglePin}
                    onVisit={handleVisitLink}
                    onOpenAttachment={(att) => setActiveAttachment(att)}
                    onDragStart={(e, id) => {
                      setActiveDraggingLinkId(id);
                      e.dataTransfer.setData('text/plain', id);
                      e.dataTransfer.setData('application/link-id', id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setActiveDraggingLinkId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MAIN WORKSPACE CANVAS: VIEW SWITCHER + LINKS + NOTEBOOK & TASKS */
          <div className="space-y-5 sm:space-y-6">

            {/* Workspace View Switcher: Links vs Habits & Tasks */}
            <div className="flex items-center justify-between gap-2 p-1 sm:p-1.5 rounded-2xl bg-sunken border border-subtle">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setWorkspaceView('links')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                    workspaceView === 'links'
                      ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Link2 size={13} className="stroke-[2.2]" />
                  <span>Links ({links.length})</span>
                </button>
                <button
                  onClick={() => setWorkspaceView('notebook')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                    workspaceView === 'notebook'
                      ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <BookOpen size={13} className="stroke-[2.2]" />
                  <span>Habits & Tasks ({todos.filter(t => !t.completed && t.status !== 'archived').length})</span>
                </button>
              </div>
            </div>
            
            {/* 1. LINKS SECTION (Category Bundles + Loose Bookmarks) */}
            {(workspaceView === 'links' || workspaceView === 'both') && (
              <div className="space-y-3.5 sm:space-y-4">
                {/* Toolbar Header with Small "+ New Folder" Button */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🔗</span>
                    <h2 className="font-extrabold text-base sm:text-lg text-main">
                      Links
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sunken text-muted font-mono font-bold">
                      {links.length}
                    </span>
                  </div>

                  {/* Small cute button on the side to create a category */}
                  <button
                    onClick={() => {
                      const name = prompt('Enter a name for the new folder:');
                      if (name && name.trim()) {
                        handleAddCategory({
                          name: name.trim(),
                          color: 'sage',
                          icon: '📁',
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-sunken border border-subtle text-xs font-bold text-accent shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[38px]"
                  >
                    <Plus size={13} className="stroke-[2.5]" />
                    <span>New Folder</span>
                  </button>
                </div>

                {/* UNIFIED SYMMETRICAL GRID: Category Squares AND Standalone Bookmarks all in one view! */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4.5">
                  
                  {/* Category Bundle Squares */}
                  {categories.map((category, index) => (
                    <CategoryBundleSquare
                      key={category.id || category.name}
                      category={category}
                      links={links}
                      index={index}
                      activeDraggingLinkId={activeDraggingLinkId}
                      onOpenFolder={(cat) => setFolderModalCategory(cat)}
                      onEditCategory={(cat) => setEditingCategory(cat)}
                      onDropLink={handleDropLinkOnCategory}
                      onReorderCategory={handleReorderCategory}
                      onStartDragCategory={() => setIsDraggingAnyCategory(true)}
                      onEndDragCategory={() => setIsDraggingAnyCategory(false)}
                      isDraggingAnyCategory={isDraggingAnyCategory}
                    />
                  ))}

                  {/* Standalone Bookmarks sitting right in the same canvas */}
                  {standaloneLinks.map((link) => (
                    <StandaloneLinkCard
                      key={link.id}
                      link={link}
                      onSelect={(l) => setDetailLink(l)}
                      onTogglePin={handleTogglePin}
                      onVisit={handleVisitLink}
                      onOpenAttachment={(att) => setActiveAttachment(att)}
                      onDragStart={(e, id) => {
                        setActiveDraggingLinkId(id);
                        e.dataTransfer.setData('text/plain', id);
                        e.dataTransfer.setData('application/link-id', id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setActiveDraggingLinkId(null)}
                    />
                  ))}

                </div>
              </div>
            )}

            {/* 2. NOTEBOOK & TASKS SECTION: Daily Focus + Permanent Goals + Detailed GitHub Heatmap + Scratchpad Notes */}
            {(workspaceView === 'both' || workspaceView === 'notebook') && (
              <div className="pt-2">
                <NotebookArea
                  links={links}
                  todos={todos}
                  notes={notes}
                  events={events}
                  streakState={streakState}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => setSelectedDate(d)}
                  dayLogs={dayLogs}
                  onSaveDayLog={handleSaveDayLog}
                  onAddTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onArchiveCompletedDaily={handleArchiveCompletedDaily}
                  onArchiveCompletedPermanent={handleArchiveCompletedPermanent}
                  onReorderTodos={handleReorderTodos}
                  onOpenHistoryTimeline={() => setIsHistoryTimelineOpen(true)}
                  onOpenCreateGoal={() => {
                    setActiveGoalForModal(null);
                    setIsGoalModalOpen(true);
                  }}
                  onOpenEditGoal={(goal) => {
                    setActiveGoalForModal(goal);
                    setIsGoalModalOpen(true);
                  }}
                  onOpenExtendGoal={(goal) => setExtendingGoal(goal)}
                  onStartFocusSession={(task) => setFocusTask(task)}
                  onToggleSubtask={handleToggleSubtask}
                  onCopyYesterdayList={handleCopyYesterdayList}
                  onInspectDay={(dateKey) => setInspectingDateKey(dateKey)}
                  onOpenInsights={() => setIsInsightsOpen(true)}
                  onOpenWeeklyReview={() => setIsWeeklyReviewOpen(true)}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onReorderNotes={handleReorderNotes}
                  onOpenAttachment={(att) => setActiveAttachment(att)}
                  onClearAllGoals={handleClearAllGoals}
                />
              </div>
            )}

          </div>
        )}



      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => {
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory('Uncategorized');
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-5 right-5 sm:hidden z-40 w-13 h-13 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-raised active:scale-95 transition-transform"
        aria-label="Add Bookmark"
      >
        <Plus size={24} className="stroke-[2.5]" />
      </button>

      {/* MODALS */}

      {/* 1. Goal Creation / Editing Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setActiveGoalForModal(null);
        }}
        onSave={handleSaveGoal}
        goal={activeGoalForModal}
      />

      {/* 2. Extend Deadline Modal */}
      <ExtendDeadlineModal
        isOpen={Boolean(extendingGoal)}
        goal={extendingGoal}
        onClose={() => setExtendingGoal(null)}
        onExtend={handleExtendGoal}
      />

      {/* 3. Pomodoro Focus Timer Modal */}
      <FocusTimerModal
        isOpen={Boolean(focusTask)}
        task={focusTask}
        onClose={() => setFocusTask(null)}
        onCompleteSession={handleFinishFocusSession}
      />

      {/* 4. Daily History Timeline Modal */}
      <DailyHistoryTimelineModal
        isOpen={isHistoryTimelineOpen}
        onClose={() => setIsHistoryTimelineOpen(false)}
        todos={todos}
        dayLogs={dayLogs}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setIsHistoryTimelineOpen(false);
        }}
      />

      {/* 5. Day Inspection Drawer (Bottom Sheet on Mobile) */}
      <DayInspectionDrawer
        isOpen={Boolean(inspectingDateKey)}
        dateKey={inspectingDateKey}
        onClose={() => setInspectingDateKey(null)}
        events={events}
        dayLog={inspectingDateKey ? dayLogs[inspectingDateKey] : undefined}
        dayTodos={todos.filter(t => t.date === inspectingDateKey || (inspectingDateKey === todayKey() && !t.date))}
        onGoToDay={(date: string) => {
          setSelectedDate(date);
          setInspectingDateKey(null);
        }}
      />

      {/* 6. Deep Insights Modal */}
      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        events={events}
        todos={todos}
        dayLogs={dayLogs}
        streakState={streakState}
        onApplyFreeze={handleApplyStreakFreeze}
      />

      {/* 7. Weekly Sunday Review Modal */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        onClose={() => setIsWeeklyReviewOpen(false)}
        todos={todos}
        onAddNextWeekPriorities={handleSaveNextWeekPriorities}
      />

      {/* 8. Unfinished Rollover Sheet (Bottom Sheet on Mobile) */}
      <UnfinishedRolloverSheet
        isOpen={isRolloverOpen}
        yesterdayTasks={rolloverCandidateTasks}
        yesterdayDateStr={addDays(todayKey(), -1)}
        onClose={() => setIsRolloverOpen(false)}
        onCarryOver={handleCarrySelectedRollover}
        onLeaveBehind={handleLeaveBehindRollover}
      />

      {/* Link Creation / Editing Modal */}
      <LinkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory('');
        }}
        onSave={handleSaveLink}
        initialData={editingLink}
        categories={categories}
        onAddCategory={handleAddCategory}
        defaultUrl={prefilledUrl}
        defaultCategory={prefilledCategory}
      />

      {/* Link Detail Reader Modal */}
      <DetailModal
        link={detailLink}
        onClose={() => setDetailLink(null)}
        onEdit={(l) => {
          setDetailLink(null);
          setEditingLink(l);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteLink}
        onTogglePin={handleTogglePin}
        onVisit={handleVisitLink}
        onOpenAttachment={(att) => setActiveAttachment(att)}
        categories={categories}
      />

      {/* Category Square Folder POPUP */}
      <FolderGridPopup
        category={folderModalCategory}
        links={links}
        allCategories={categories}
        onClose={() => setFolderModalCategory(null)}
        onOpenLinkDetail={(l) => {
          setFolderModalCategory(null);
          setDetailLink(l);
        }}
        onEditLink={(l) => {
          setEditingLink(l);
          setIsAddModalOpen(true);
        }}
        onDeleteLink={handleDeleteLink}
        onTogglePin={handleTogglePin}
        onVisitLink={handleVisitLink}
        onOpenAttachment={(att) => setActiveAttachment(att)}
        onAddNewLinkToCategory={(catName) => {
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory(catName);
          setIsAddModalOpen(true);
        }}
        onEditCategory={(cat) => setEditingCategory(cat)}
        onMoveLinkCategory={handleMoveLinkCategory}
        onReorderLinksInCategory={(reorderedLinks) => {
          if (folderModalCategory) {
            handleReorderLinksInCategory(reorderedLinks, folderModalCategory.name);
          }
        }}
      />

      {/* Top-Level High-Z Attachment Viewer */}
      <AttachmentViewerModal
        attachment={activeAttachment}
        onClose={() => setActiveAttachment(null)}
      />

      {/* Edit / Rename Category Modal */}
      <EditCategoryModal
        isOpen={Boolean(editingCategory)}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSave={handleSaveCategory}
        onDelete={(id) => handleDeleteCategory(id, false)}
      />

      {/* Backup and Sync Modal */}
      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        links={links}
        categories={categories}
        todos={todos}
        notes={notes}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      {/* PWA / App Install Modal */}
      <PwaPrompt
        isOpen={isPwaPromptOpen}
        onClose={() => setIsPwaPromptOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallClick={handleInstallPwa}
      />

      {/* Colour Guide & Design System Modal */}
      <DesignGuideModal
        isOpen={isDesignGuideOpen}
        onClose={handleCloseDesignGuide}
        currentAccent={accentTheme}
        onSelectAccent={(acc) => setAccentTheme(acc)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Custom Wallpaper & Opacity Modal */}
      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        currentImage={customBgImage}
        settings={bgSettings}
        onSaveImage={handleSaveCustomBgImage}
        onUpdateSettings={handleUpdateBgSettings}
      />

      {/* Supabase Cloud Sync & Mobile Pairing Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataRefreshed={refreshDataFromStorage}
        onToast={showToast}
      />

      </div>
    </div>
  );
}

export default App;
