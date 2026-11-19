import { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Sparkles, FolderPlus, Folder, ExternalLink, GripVertical, Star, Paperclip, Check, Copy, Edit3, Trash2, LayoutGrid, Link2, BookOpen, RotateCcw, Wallet, Palette, Film } from 'lucide-react';

import type { 
  LinkItem, 
  CategoryInfo, 
  Attachment, 
  TodoItem, 
  NoteItem, 
  SketchItem,
  WorkspaceView, 
  ActivityEvent, 
  StreakState, 
  DayLog, 
  RoutineItem,
  FinanceTransaction,
  FinanceCategory,
  TransactionType,
  ReelItem
} from './types';
import { DEFAULT_FINANCE_CATEGORIES } from './types/finance';
import { 
  loadLinks, 
  saveLinks, 
  loadCategories, 
  saveCategories, 
  loadTodos, 
  saveTodos, 
  loadNotes, 
  saveNotes, 
  loadSketches,
  saveSketches,
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
  loadFinanceTransactions,
  saveFinanceTransactions,
  loadFinanceCategories,
  saveFinanceCategories,
  loadFinanceCurrency,
  saveFinanceCurrency,
  loadReels,
  saveReels,
  runDataMigration, 
  purgeAllSampleData, 
  isSampleItem, 
  isPreinstalledCategory,
  loadCustomBackground,
  saveCustomBackgroundImage,
  saveBackgroundSettings,
  STORAGE_KEY_CUSTOM_BG,
  STORAGE_KEY_BG_SETTINGS,
  recordTombstone,
  recordTombstones,
  type BackgroundSettings,
  DEFAULT_CATEGORIES, 
  INITIAL_LINKS, 
  INITIAL_TODOS, 
  INITIAL_NOTES 
} from './services/storage';
import { normalizeUrl, generateSuggestedTitle, getFaviconUrl, extractDomain, formatRelativeTime } from './utils/urlHelper';
import { triggerPartyPop, playPopSound } from './utils/delight';
import { todayKey, addDays, toLocalDateKey } from './utils/dates';
import { ensureRoutinesForDate } from './utils/routines';
import { extractInstagramReelInfo, isInstagramReelUrl } from './utils/instagramHelper';

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
import { ReelsArea } from './components/reels/ReelsArea';
import { DesignGuideModal } from './components/DesignGuideModal';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { FinanceNumpadModal } from './components/finance/FinanceNumpadModal';
import { NotesAndSketchpadArea } from './components/NotesAndSketchpadArea';
import { LockScreen } from './components/LockScreen';
import { isDeviceUnlocked, lockDevice } from './utils/security';

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
  const [sketches, setSketches] = useState<SketchItem[]>([]);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('links');
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 Master PIN Security Gate
  const [isLocked, setIsLocked] = useState<boolean>(!isDeviceUnlocked());

  // Swipe Navigation Feedback State
  const [swipePill, setSwipePill] = useState<{ label: string; icon: string } | null>(null);
  const swipePillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [reels, setReels] = useState<ReelItem[]>([]);

  // Finance & Expense Tracking (Mibu)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>(DEFAULT_FINANCE_CATEGORIES);
  const [financeCurrency, setFinanceCurrency] = useState<string>('₹');
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [defaultFinanceType, setDefaultFinanceType] = useState<TransactionType>('expense');
  const [defaultFinanceCategory, setDefaultFinanceCategory] = useState<FinanceCategory | undefined>(undefined);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Link View Mode: 'folders' (categorized) | 'all' (all flat links) | 'starred' (pinned links)
  const [linkView, setLinkView] = useState<'folders' | 'all' | 'starred'>('folders');

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

  // Custom Wallpaper & Opacity (Synchronous zero-latency hydration from local cache)
  const [customBgImage, setCustomBgImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_BG) || null;
    } catch {
      return null;
    }
  });
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BG_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      opacity: 0.25,
      blur: 0,
      enabled: true,
    };
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
        loadedFinances,
        loadedFinanceCats,
        loadedSketches,
        loadedReels,
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
        loadFinanceTransactions(),
        loadFinanceCategories(),
        loadSketches(),
        loadReels(),
      ]);
      setLinks(loadedLinks);
      setCategories(loadedCats.filter((c) => !isPreinstalledCategory(c)));
      
      const { updatedTodos: todosWithRoutines, createdCount: routineCreated } = ensureRoutinesForDate(
        loadedTodos,
        loadedRoutines,
        todayKey()
      );
      setTodos(todosWithRoutines);
      if (routineCreated > 0) {
        await saveTodos(todosWithRoutines);
      }

      setNotes(loadedNotes);
      setSketches(loadedSketches);
      setReels(loadedReels);
      setEvents(loadedEvents);
      setDayLogs(loadedDayLogs);
      const hasValidCompletions = loadedEvents.some((e) =>
        ['task_completed', 'goal_completed', 'focus_session'].includes(e.type)
      );
      if (!hasValidCompletions) {
        setStreakState({
          currentStreak: 0,
          longestStreak: 0,
          totalActiveDays: 0,
          freezesRemaining: 1,
          frozenDates: [],
        });
      } else if (loadedStreak) {
        setStreakState(loadedStreak);
      }
      setRoutines(loadedRoutines);
      setTransactions(loadedFinances);
      if (loadedFinanceCats && loadedFinanceCats.length > 0) {
        setFinanceCategories(loadedFinanceCats);
      }
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
        if (localStorage.getItem('orbit_clean_slate_v6') !== 'true') {
          await purgeAllSampleData();
          const rawCats = await loadCategories();
          const cleanCats = rawCats.filter((c) => !isPreinstalledCategory(c));
          await saveCategories(cleanCats);
          const freshEvents = await loadActivityEvents();
          const validOnly = freshEvents.filter(
            (e) => e && !e.type.includes('deleted') && !e.type.includes('uncompleted') && !isSampleItem(e)
          );
          await saveActivityEvents(validOnly);
          localStorage.setItem('orbit_clean_slate_v6', 'true');
        }
        if (localStorage.getItem('orbit_streak_zero_v10') !== 'true') {
          const zeroStreak: StreakState = {
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 0,
            freezesRemaining: 1,
            frozenDates: [],
            lastActiveDate: undefined,
          };
          await saveStreakState(zeroStreak);
          await saveActivityEvents([]);
          localStorage.setItem('orbit_streak_zero_v10', 'true');
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
          loadedFinances,
          loadedFinanceCats,
          loadedSketches,
          loadedReels,
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
          loadFinanceTransactions(),
          loadFinanceCategories(),
          loadSketches(),
          loadReels(),
        ]);
        const cleanLinks = loadedLinks.filter((l) => !isSampleItem(l));
        const cleanTodos = loadedTodos.filter((t) => !isSampleItem(t));
        const cleanNotes = loadedNotes.filter((n) => !isSampleItem(n));
        const cleanEvents = loadedEvents.filter((e) => !isSampleItem(e));

        if (cleanLinks.length !== loadedLinks.length) await saveLinks(cleanLinks);
        if (cleanTodos.length !== loadedTodos.length) await saveTodos(cleanTodos);
        if (cleanNotes.length !== loadedNotes.length) await saveNotes(cleanNotes);
        if (cleanEvents.length !== loadedEvents.length) await saveActivityEvents(cleanEvents);

        // Ensure routines are present for today on initial startup
        const { updatedTodos: initialTodosWithRoutines, createdCount: routineAdded } = ensureRoutinesForDate(
          cleanTodos,
          loadedRoutines,
          todayKey()
        );
        if (routineAdded > 0) {
          await saveTodos(initialTodosWithRoutines);
        }

        setLinks(cleanLinks);
        setCategories(loadedCats);
        setTodos(initialTodosWithRoutines);
        setNotes(cleanNotes);
        setSketches(loadedSketches);
        setReels(loadedReels);
        setEvents(cleanEvents);
        setDayLogs(loadedDayLogs);
        const hasValidCompletions = cleanEvents.some((e) =>
          ['task_completed', 'goal_completed', 'focus_session'].includes(e.type)
        );
        if (!hasValidCompletions) {
          setStreakState({
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 0,
            freezesRemaining: 1,
            frozenDates: [],
          });
        } else if (loadedStreak) {
          setStreakState(loadedStreak);
        }
        setRoutines(loadedRoutines);
        setTransactions(loadedFinances);
        if (loadedFinanceCats && loadedFinanceCats.length > 0) {
          setFinanceCategories(loadedFinanceCats);
        }
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

  // Ensure scheduled routines are populated whenever selectedDate or routines change
  useEffect(() => {
    if (!routines || routines.length === 0) return;
    setTodos((currentTodos) => {
      const { updatedTodos, createdCount } = ensureRoutinesForDate(currentTodos, routines, selectedDate);
      if (createdCount > 0) {
        saveTodos(updatedTodos);
        return updatedTodos;
      }
      return currentTodos;
    });
  }, [selectedDate, routines]);

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

  // 📲 Mobile PWA Share Target Handler (Instagram Reels & Posts shared to Orbit)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || '';
    const sharedText = params.get('text') || '';
    const sharedTitle = params.get('title') || '';
    const combined = `${sharedTitle} ${sharedText} ${sharedUrl}`.trim();

    if (combined && (sharedUrl || sharedText)) {
      // Check if it's an Instagram Reel or Post
      if (isInstagramReelUrl(combined) || isInstagramReelUrl(sharedUrl) || isInstagramReelUrl(sharedText)) {
        const targetString = sharedUrl && isInstagramReelUrl(sharedUrl) ? `${sharedText} ${sharedUrl}` : combined;
        const parsed = extractInstagramReelInfo(targetString);
        if (parsed) {
          const nowIso = new Date().toISOString();
          const newReel: ReelItem = {
            id: `reel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            url: parsed.canonicalUrl,
            shortcode: parsed.shortcode,
            headline: parsed.suggestedHeadline || sharedTitle || 'Shared Instagram Reel',
            caption: parsed.suggestedCaption || sharedText || undefined,
            author: parsed.author,
            collection: 'General',
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          setReels((prev) => {
            const exists = prev.some((r) => r.shortcode === parsed.shortcode);
            if (exists) return prev;
            const updated = [newReel, ...prev];
            saveReels(updated);
            return updated;
          });

          setWorkspaceView('reels');
          showToast('Saved Instagram Reel to your Vault! 🎬✨');
          triggerPartyPop('single');
          playPopSound();
        }
      }

      // Clean query params from URL bar cleanly without refreshing
      try {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {}
    }
  }, []);

  // ==========================================
  // 📲 GLOBAL SWIPE NAVIGATION ANYWHERE (LINKS <-> HABITS & TASKS <-> REELS <-> FINANCES <-> NOTES & SKETCHPAD)
  // ==========================================
  const WORKSPACE_SECTIONS: WorkspaceView[] = ['links', 'notebook', 'reels', 'finance', 'notes'];

  const showSwipePill = (section: WorkspaceView) => {
    const config: Record<WorkspaceView, { label: string; icon: string }> = {
      links: { label: 'Links', icon: '🔗' },
      notebook: { label: 'Habits & Tasks', icon: '📖' },
      reels: { label: 'Reels Vault', icon: '🎬' },
      finance: { label: 'Finances', icon: '💳' },
      notes: { label: 'Notes & Sketchpad', icon: '🎨' },
      both: { label: 'Workspace', icon: '✨' },
    };
    if (swipePillTimerRef.current) clearTimeout(swipePillTimerRef.current);
    setSwipePill(config[section] || { label: 'Section', icon: '✨' });
    swipePillTimerRef.current = setTimeout(() => {
      setSwipePill(null);
    }, 1100);
  };

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Safe guards:
      // 1. Drawing canvas or no-swipe designated zones (so sketching never triggers section switch)
      if (
        target.closest('canvas') ||
        target.closest('.no-swipe-zone') ||
        target.closest('[data-no-swipe="true"]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      // 2. Lock screen or Modals currently open
      if (
        isLocked ||
        isFinanceModalOpen ||
        isAddModalOpen ||
        isBackupModalOpen ||
        isGoalModalOpen ||
        isWallpaperModalOpen ||
        isSyncModalOpen ||
        isPwaPromptOpen ||
        isDesignGuideOpen ||
        isHistoryTimelineOpen ||
        isInsightsOpen ||
        isWeeklyReviewOpen ||
        isRolloverOpen ||
        Boolean(detailLink) ||
        Boolean(editingCategory) ||
        Boolean(activeAttachment) ||
        Boolean(extendingGoal) ||
        Boolean(focusTask) ||
        Boolean(inspectingDateKey)
      ) {
        return;
      }

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const elapsed = Date.now() - startTime;

      // Intentional swipe:
      // - At least 55px horizontal distance
      // - Predominantly horizontal swipe (1.5x greater than vertical movement)
      // - Flick within 650ms
      if (
        Math.abs(deltaX) >= 55 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
        elapsed <= 650
      ) {
        const curIdx = WORKSPACE_SECTIONS.indexOf(workspaceView);
        if (curIdx === -1) return;

        if (deltaX < 0 && curIdx < WORKSPACE_SECTIONS.length - 1) {
          // Swipe Left -> Next Section
          const next = WORKSPACE_SECTIONS[curIdx + 1];
          setWorkspaceView(next);
          playPopSound();
          if (navigator.vibrate) navigator.vibrate(15);
          showSwipePill(next);
        } else if (deltaX > 0 && curIdx > 0) {
          // Swipe Right -> Prev Section
          const prev = WORKSPACE_SECTIONS[curIdx - 1];
          setWorkspaceView(prev);
          playPopSound();
          if (navigator.vibrate) navigator.vibrate(15);
          showSwipePill(prev);
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [
    workspaceView,
    isFinanceModalOpen,
    isAddModalOpen,
    isBackupModalOpen,
    isGoalModalOpen,
    isWallpaperModalOpen,
    isSyncModalOpen,
    isPwaPromptOpen,
    isDesignGuideOpen,
    isHistoryTimelineOpen,
    isInsightsOpen,
    isWeeklyReviewOpen,
    isRolloverOpen,
    detailLink,
    editingCategory,
    activeAttachment,
    extendingGoal,
    focusTask,
    inspectingDateKey,
  ]);

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
    const loose = links.filter(
      (l) => !l.category || l.category === 'Uncategorized' || l.category === ''
    );
    return [...loose].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [links]);

  // Starred / Favorite Links across all folders and canvas
  const starredLinks = useMemo(() => {
    return links
      .filter((l) => Boolean(l.pinned))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  }, [links]);

  // All Links Flattened & Sorted (starred first, then newest) - Shows all links as unbundled cards
  const allSortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });
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
    await recordTombstone(id);
    if (detailLink && detailLink.id === id) setDetailLink(null);
    showToast('Bookmark deleted');
    syncWithCloud({ onMerged: refreshDataFromStorage });
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

    await recordTombstone(catId);
    const updatedCats = categories.filter((c) => c.id !== catId);
    setCategories(updatedCats);
    await saveCategories(updatedCats);

    if (deleteLinksInCat) {
      const linksToDelete = links.filter((l) => l.category === catToDelete.name);
      await recordTombstones(linksToDelete.map((l) => l.id));
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
    syncWithCloud({ onMerged: refreshDataFromStorage });
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
    const nowIso = new Date().toISOString();
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
      createdAt: nowIso,
      updatedAt: nowIso,
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
        updatedAt: nowIso,
        status: (nextCompleted ? 'completed' : 'active') as any,
        progress: t.type === 'permanent' ? (nextCompleted ? 100 : t.progress) : t.progress,
      };
    });

    setTodos(updated);
    await saveTodos(updated);

    const isDaily = (target.type || 'permanent') === 'daily';
    const eventType = isDaily ? 'task_completed' : 'goal_completed';

    if (nextCompleted) {
      await logActivity(eventType, target.id, target.text);
    } else {
      // Uncompleted: remove completion event so it does not falsely bloat actions count
      const currentEvents = await loadActivityEvents();
      const filtered = currentEvents.filter(
        (e) => !(e.refId === target.id && (e.type === 'task_completed' || e.type === 'goal_completed'))
      );
      await saveActivityEvents(filtered);
    }
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
    const target = todos.find((t) => t.id === id);

    // If deleting a task created from a fixed routine, also remove the routine so it doesn't reappear
    if (target?.recurringId) {
      const routineId = target.recurringId;
      const updatedRoutines = routines.filter((r) => r.id !== routineId);
      if (updatedRoutines.length !== routines.length) {
        setRoutines(updatedRoutines);
        await saveRoutines(updatedRoutines);
        await recordTombstone(routineId);
      }
    }

    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    await saveTodos(updated);
    await recordTombstone(id);

    // Filter out activity events for the deleted task
    const freshEvents = await loadActivityEvents();
    const cleanEvents = freshEvents.filter((e) => e.refId !== id && !e.type.includes('deleted'));
    await saveActivityEvents(cleanEvents);
    setEvents(cleanEvents);

    const isGoal = target?.type === 'permanent';
    showToast(target?.recurringId ? 'Fixed routine deleted permanently 🗑️' : isGoal ? 'Goal deleted permanently 🗑️' : 'Task removed');
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  // Fixed Routines Handlers
  const handleSaveRoutine = async (routine: RoutineItem) => {
    const existingIndex = routines.findIndex((r) => r.id === routine.id);
    let updated: RoutineItem[];
    if (existingIndex >= 0) {
      updated = routines.map((r) => (r.id === routine.id ? routine : r));
      showToast('Routine updated');
    } else {
      updated = [routine, ...routines];
      showToast('Fixed routine created! 🔄');
    }
    setRoutines(updated);
    await saveRoutines(updated);

    // Immediately populate instance for TODAY and current selected date
    const today = todayKey();
    let currentTodos = todos;
    const { updatedTodos: todayTodos } = ensureRoutinesForDate(currentTodos, updated, today);
    currentTodos = todayTodos;
    if (selectedDate !== today) {
      const { updatedTodos: selectedTodos } = ensureRoutinesForDate(currentTodos, updated, selectedDate);
      currentTodos = selectedTodos;
    }
    setTodos(currentTodos);
    await saveTodos(currentTodos);

    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  const handleDeleteRoutine = async (id: string) => {
    // 1. Remove routine definition
    const updatedRoutines = routines.filter((r) => r.id !== id);
    setRoutines(updatedRoutines);
    await saveRoutines(updatedRoutines);
    await recordTombstone(id);

    // 2. Permanently remove all daily task instances created from this routine
    const isTargetInstance = (t: TodoItem) => t.recurringId === id || t.id.startsWith(`routine_inst_${id}`);
    const removedInstances = todos.filter(isTargetInstance);
    const updatedTodos = todos.filter((t) => !isTargetInstance(t));
    setTodos(updatedTodos);
    await saveTodos(updatedTodos);

    if (removedInstances.length > 0) {
      const removedIds = removedInstances.map((t) => t.id);
      await recordTombstones(removedIds);
      const freshEvents = await loadActivityEvents();
      const cleanEvents = freshEvents.filter(
        (e) => !removedIds.includes(e.refId) && !e.type.includes('deleted')
      );
      await saveActivityEvents(cleanEvents);
      setEvents(cleanEvents);
    }

    showToast('Fixed routine deleted permanently 🗑️');
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  // Instagram Reels Handlers
  const handleSaveReel = async (reel: ReelItem) => {
    const existingIndex = reels.findIndex((r) => r.id === reel.id);
    let updated: ReelItem[];
    if (existingIndex >= 0) {
      updated = reels.map((r) => (r.id === reel.id ? reel : r));
      showToast('Reel updated 🎬');
    } else {
      updated = [reel, ...reels];
      showToast('Saved reel to your Vault! 🎬✨');
    }
    setReels(updated);
    await saveReels(updated);
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  const handleDeleteReel = async (id: string) => {
    const updated = reels.filter((r) => r.id !== id);
    setReels(updated);
    await saveReels(updated);
    await recordTombstone(id);
    showToast('Reel removed from Vault 🗑️');
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  const handleToggleFavoriteReel = async (id: string) => {
    const updated = reels.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r));
    setReels(updated);
    await saveReels(updated);
    const target = updated.find((r) => r.id === id);
    showToast(target?.favorite ? 'Added to favorites ⭐' : 'Removed from favorites');
  };

  const handleReorderReels = async (reordered: ReelItem[]) => {
    setReels(reordered);
    await saveReels(reordered);
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  // Archive completed daily tasks with 10-second Undo toast
  const handleArchiveCompletedDaily = async (dateKey: string) => {
    const toArchive = todos.filter(
      (t) =>
        (t.type || 'permanent') === 'daily' &&
        (t.date === dateKey || (!t.date && dateKey === todayKey())) &&
        t.completed &&
        t.status !== 'archived' &&
        !t.recurringId
    );
    if (toArchive.length === 0) return;

    const toArchiveIds = new Set(toArchive.map((t) => t.id));
    const nowIso = new Date().toISOString();
    const updated = todos.map((t) => (toArchiveIds.has(t.id) ? { ...t, status: 'archived' as const, updatedAt: nowIso } : t));
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
    const nowIso = new Date().toISOString();
    const updated = todos.map((t) => (toArchiveIds.has(t.id) ? { ...t, status: 'archived' as const, updatedAt: nowIso } : t));
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
    const nowIso = new Date().toISOString();
    const restored = todos.map((t) => (ids.has(t.id) ? { ...t, status: 'completed' as const, updatedAt: nowIso } : t));
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

    const nowIso = new Date().toISOString();
    const updated = todos.map((t) =>
      t.id === goalId
        ? {
            ...t,
            subtasks: updatedSubtasks,
            progress,
            completed: isCompleted,
            status: (isCompleted ? 'completed' : 'active') as any,
            completedAt: isCompleted ? nowIso : undefined,
            updatedAt: nowIso,
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
    const nowIso = new Date().toISOString();
    if (activeGoalForModal) {
      // Editing existing goal
      const updated = todos.map((t) =>
        t.id === activeGoalForModal.id
          ? {
              ...t,
              ...goalData,
              updatedAt: nowIso,
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
        createdAt: nowIso,
        updatedAt: nowIso,
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
            updatedAt: extension.at,
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

    const nowIso = new Date().toISOString();
    const updated = todos.map((t) => {
      if (!selSet.has(t.id)) return t;
      return {
        ...t,
        date: today,
        carriedFrom: t.date || addDays(today, -1),
        carryCount: (t.carryCount || 0) + 1,
        updatedAt: nowIso,
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
    const nowIso = new Date().toISOString();
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
      createdAt: nowIso,
      updatedAt: nowIso,
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
    const nowIso = new Date().toISOString();
    const newItems: TodoItem[] = priorities.map((p) => ({
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: p,
      type: 'daily',
      priority: 'high',
      date: nextMon,
      completed: false,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
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
    await recordTombstone(id);
    showToast('Note deleted');
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  const handleReorderNotes = async (reordered: NoteItem[]) => {
    setNotes(reordered);
    await saveNotes(reordered);
    triggerAutoSync();
  };

  const handleSaveSketch = async (sketchData: Omit<SketchItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSketch: SketchItem = {
      ...sketchData,
      id: `sk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSketch, ...sketches];
    setSketches(updated);
    await saveSketches(updated);
    await logActivity('note_added', newSketch.id, newSketch.title);
    const freshEvents = await loadActivityEvents();
    setEvents(freshEvents);
    showToast(`Saved doodle "${newSketch.title}"! 🎨`);
    triggerAutoSync();
  };

  const handleDeleteSketch = async (id: string) => {
    const updated = sketches.filter((s) => s.id !== id);
    setSketches(updated);
    await saveSketches(updated);
    await recordTombstone(id);
    showToast('Doodle deleted');
    syncWithCloud({ onMerged: refreshDataFromStorage });
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
    if ((data as any).sketches && Array.isArray((data as any).sketches)) {
      setSketches((data as any).sketches);
      await saveSketches((data as any).sketches);
    }

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    showToast('Import successful! 🎉');
  };

  // Clear all data to fresh empty canvas
  const handleResetData = async () => {
    const allIds = [
      ...links.map((l) => l.id),
      ...todos.map((t) => t.id),
      ...notes.map((n) => n.id),
      ...sketches.map((s) => s.id),
      ...transactions.map((tx) => tx.id),
    ];
    await recordTombstones(allIds);
    setLinks([]);
    setCategories(DEFAULT_CATEGORIES);
    setTodos([]);
    setNotes([]);
    setSketches([]);
    setEvents([]);
    setDayLogs({});
    setTransactions([]);
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
    await saveSketches([]);
    await saveActivityEvents([]);
    await saveDayLogs({});
    await saveStreakState(cleanStreak);
    await saveFinanceTransactions([]);
    syncWithCloud({ onMerged: refreshDataFromStorage });
    showToast('All sample data removed. Clean canvas ready! 🌿');
  };

  // Clear all master goals
  const handleClearAllGoals = async () => {
    const goalsToDelete = todos.filter((t) => t.type === 'permanent');
    await recordTombstones(goalsToDelete.map((g) => g.id));
    const updated = todos.filter((t) => t.type !== 'permanent');
    setTodos(updated);
    await saveTodos(updated);
    syncWithCloud({ onMerged: refreshDataFromStorage });
    showToast('Cleared all master goals 🎯');
  };

  // Finance Transactions Handlers (Mibu)
  const handleSaveFinanceTransaction = async (
    data: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    let updated: FinanceTransaction[];
    const nowIso = new Date().toISOString();
    if (editingTransaction) {
      updated = transactions.map((tx) =>
        tx.id === editingTransaction.id
          ? { ...tx, ...data, updatedAt: nowIso }
          : tx
      );
      showToast('Transaction updated');
    } else {
      const newTx: FinanceTransaction = {
        ...data,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      updated = [newTx, ...transactions];
      showToast(data.type === 'income' ? 'Income recorded 🎉' : 'Expense recorded 💸');
    }
    setTransactions(updated);
    await saveFinanceTransactions(updated);
    triggerAutoSync();
    setIsFinanceModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteFinanceTransaction = async (id: string) => {
    await recordTombstone(id);
    const updated = transactions.filter((tx) => tx.id !== id);
    setTransactions(updated);
    await saveFinanceTransactions(updated);
    triggerAutoSync();
    showToast('Transaction deleted');
  };

  const handleSaveFinanceCategory = async (cat: FinanceCategory) => {
    const existingIndex = financeCategories.findIndex((c) => c.id === cat.id);
    let updated: FinanceCategory[];
    if (existingIndex >= 0) {
      updated = [...financeCategories];
      updated[existingIndex] = cat;
      showToast(`Updated "${cat.name}" category! ✨`);
    } else {
      updated = [...financeCategories, cat];
      showToast(`Created "${cat.name}" category! 🎉`);
    }
    setFinanceCategories(updated);
    await saveFinanceCategories(updated);
    triggerAutoSync();
  };

  const handleDeleteFinanceCategory = async (id: string) => {
    await recordTombstone(id);
    const cat = financeCategories.find((c) => c.id === id);
    const updated = financeCategories.filter((c) => c.id !== id);
    setFinanceCategories(updated);
    await saveFinanceCategories(updated);
    triggerAutoSync();
    showToast(cat ? `Deleted "${cat.name}" category` : 'Category deleted');
  };

  const handleChangeFinanceCurrency = (symbol: string) => {
    setFinanceCurrency(symbol);
    saveFinanceCurrency(symbol);
    showToast(`Currency changed to ${symbol} 🪙`);
  };

  // Wallpaper handlers
  const handleSaveCustomBgImage = async (dataUrl: string | null) => {
    setCustomBgImage(dataUrl);
    await saveCustomBackgroundImage(dataUrl);
    // Immediate bidirectional cloud sync so incognito, other tabs and refreshes get it at once
    syncWithCloud({ onMerged: refreshDataFromStorage });
    if (dataUrl) {
      showToast('Custom wallpaper updated and synced! 🖼️');
    } else {
      showToast('Wallpaper removed. Restored cozy theme.');
    }
  };

  const handleUpdateBgSettings = (newSettings: BackgroundSettings) => {
    setBgSettings(newSettings);
    saveBackgroundSettings(newSettings);
    syncWithCloud({ onMerged: refreshDataFromStorage });
  };

  return (
    <div className="min-h-screen bg-page text-main flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden">
      
      {/* 🔒 Master PIN Security Gate */}
      {isLocked && (
        <LockScreen
          onUnlock={() => {
            setIsLocked(false);
            showToast('Welcome back, Sreeshnav! ✨');
          }}
        />
      )}

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
          onLock={() => {
            lockDevice();
            setIsLocked(true);
            showToast('Space locked 🔒');
          }}
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

            {/* Workspace View Switcher: Links vs Habits & Tasks vs Finances vs Notes & Sketchpad */}
            <div className="flex items-center justify-between gap-2 p-1 sm:p-1.5 rounded-2xl bg-sunken border border-subtle overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceView('links');
                    playPopSound();
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                    workspaceView === 'links'
                      ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Link2 size={13} className="stroke-[2.2]" />
                  <span>Links ({links.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceView('notebook');
                    playPopSound();
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                    workspaceView === 'notebook'
                      ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <BookOpen size={13} className="stroke-[2.2]" />
                  <span>Habits & Tasks ({todos.filter(t => !t.completed && t.status !== 'archived').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceView('reels');
                    playPopSound();
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                    workspaceView === 'reels'
                      ? 'bg-surface text-rose-600 shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Film size={13} className="stroke-[2.2] text-rose-500" />
                  <span>Reels ({reels.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceView('finance');
                    playPopSound();
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                    workspaceView === 'finance'
                      ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Wallet size={13} className="stroke-[2.2]" />
                  <span>Finances ({transactions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceView('notes');
                    playPopSound();
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                    workspaceView === 'notes'
                      ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Palette size={13} className="stroke-[2.2] text-pink-500" />
                  <span>Notes & Sketch ({notes.length + sketches.length})</span>
                </button>
              </div>
            </div>
            
            {/* 1. LINKS SECTION (Category Bundles + Loose Bookmarks) */}
            {(workspaceView === 'links' || workspaceView === 'both') && (
              <div className="space-y-3.5 sm:space-y-4">
                {/* Toolbar Header with [Folders], [All] & [⭐ Starred] View Switcher and "+ New Folder" Button */}
                <div className="flex items-center justify-between px-1 gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-base select-none">🔗</span>
                    <h2 className="font-extrabold text-base sm:text-lg text-main">
                      Links
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sunken text-muted font-mono font-bold">
                      {linkView === 'starred' ? starredLinks.length : links.length}
                    </span>

                    {/* Filter Segmented Control: [Folders] (Categorized), [All] (Flat Cards), [⭐ Starred] */}
                    <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-subtle ml-0.5 sm:ml-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkView('folders');
                          playPopSound();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          linkView === 'folders'
                            ? 'bg-surface text-main shadow-2xs font-extrabold'
                            : 'text-muted hover:text-main'
                        }`}
                        aria-label="Show Categorized Folders"
                        title="Categorized Folders View"
                      >
                        <span>Folders</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkView('all');
                          playPopSound();
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          linkView === 'all'
                            ? 'bg-surface text-main shadow-2xs font-extrabold'
                            : 'text-muted hover:text-main'
                        }`}
                        aria-label="Show All Links directly as cards"
                        title="Show all links directly as individual cards"
                      >
                        <span>All</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          linkView === 'all' ? 'bg-accent text-on-accent' : 'bg-surface text-muted'
                        }`}>
                          {links.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkView('starred');
                          playPopSound();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          linkView === 'starred'
                            ? 'bg-surface text-amber-500 shadow-2xs font-extrabold'
                            : 'text-muted hover:text-amber-500'
                        }`}
                        aria-label="Show Starred Links"
                        title="Show Starred Bookmarks"
                      >
                        <Star size={13} className={linkView === 'starred' ? 'fill-amber-400 text-amber-500' : 'text-faint hover:text-amber-500'} />
                        <span className="hidden sm:inline">Starred</span>
                        {starredLinks.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            linkView === 'starred' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-surface text-muted'
                          }`}>
                            {starredLinks.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-2">
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
                </div>

                {/* CONTENT AREA: Folders vs All (Flat Unbundled) vs Starred */}
                {linkView === 'starred' ? (
                  /* STARRED / FAVORITES VIEW */
                  starredLinks.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center rounded-3xl bg-surface border border-subtle shadow-soft">
                      <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3 border border-amber-200 dark:border-amber-900">
                        <Star size={26} className="fill-amber-400 text-amber-500 animate-pulse" />
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-main mb-1">
                        No Starred Bookmarks Yet
                      </h3>
                      <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                        Click the star icon ⭐ on any bookmark (in All or inside folders) to pin your favorites here for instant access.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkView('all');
                          playPopSound();
                        }}
                        className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition-all active:scale-95 cursor-pointer"
                      >
                        View All Bookmarks
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4.5">
                      {starredLinks.map((link) => (
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
                  )
                ) : linkView === 'all' ? (
                  /* ALL LINKS DIRECTLY AS CARDS (FLAT / UNBUNDLED VIEW) */
                  allSortedLinks.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center rounded-3xl bg-surface border border-subtle shadow-soft">
                      <p className="text-sm sm:text-base font-extrabold text-main mb-1">
                        No Bookmarks Saved Yet
                      </p>
                      <p className="text-xs text-muted max-w-sm mx-auto">
                        Paste any link in the bar above or tap Add Item to save your first bookmark.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4.5">
                      {allSortedLinks.map((link) => (
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
                  )
                ) : (
                  /* CATEGORIZED FOLDERS VIEW (Default: Bundles + Canvas Bookmarks) */
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
                )}
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
                  routines={routines}
                  onSaveRoutine={handleSaveRoutine}
                  onDeleteRoutine={handleDeleteRoutine}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onReorderNotes={handleReorderNotes}
                  onOpenAttachment={(att) => setActiveAttachment(att)}
                  onClearAllGoals={handleClearAllGoals}
                />
              </div>
            )}

            {/* 3. INSTAGRAM REELS VAULT SECTION: Saved Reels & Fullscreen Swiper Sequence */}
            {workspaceView === 'reels' && (
              <div className="pt-2">
                <ReelsArea
                  reels={reels}
                  onSaveReel={handleSaveReel}
                  onDeleteReel={handleDeleteReel}
                  onToggleFavoriteReel={handleToggleFavoriteReel}
                  onReorderReels={handleReorderReels}
                />
              </div>
            )}

            {/* 4. FINANCE & EXPENSES SECTION: Minimal Mibu Tracker */}
            {workspaceView === 'finance' && (
              <div className="pt-2">
                <FinanceDashboard
                  transactions={transactions}
                  categories={financeCategories}
                  currency={financeCurrency}
                  onChangeCurrency={handleChangeFinanceCurrency}
                  onOpenAddModal={(type, cat) => {
                    setEditingTransaction(null);
                    setDefaultFinanceType(type || 'expense');
                    setDefaultFinanceCategory(cat);
                    setIsFinanceModalOpen(true);
                  }}
                  onEditTransaction={(tx) => {
                    setEditingTransaction(tx);
                    setIsFinanceModalOpen(true);
                  }}
                  onDeleteTransaction={handleDeleteFinanceTransaction}
                  onSaveCategory={handleSaveFinanceCategory}
                  onDeleteCategory={handleDeleteFinanceCategory}
                  onQuickAdd={handleSaveFinanceTransaction}
                />
              </div>
            )}

            {/* 4. NOTES & SKETCHPAD SECTION: Cute Creative Studio */}
            {workspaceView === 'notes' && (
              <div className="pt-2">
                <NotesAndSketchpadArea
                  notes={notes}
                  sketches={sketches}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onReorderNotes={handleReorderNotes}
                  onSaveSketch={handleSaveSketch}
                  onDeleteSketch={handleDeleteSketch}
                  onOpenAttachment={(att) => setActiveAttachment(att)}
                />
              </div>
            )}

          </div>
        )}



      </main>

      {/* 📲 Cute Swipe Gesture Section Indicator */}
      {swipePill && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-main/90 text-surface shadow-raised backdrop-blur-md text-xs font-black">
            <span className="text-sm">{swipePill.icon}</span>
            <span>{swipePill.label}</span>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => {
          if (workspaceView === 'finance') {
            setEditingTransaction(null);
            setIsFinanceModalOpen(true);
          } else {
            setEditingLink(null);
            setPrefilledUrl('');
            setPrefilledCategory('Uncategorized');
            setIsAddModalOpen(true);
          }
        }}
        className="fixed bottom-5 right-5 sm:hidden z-40 w-12 h-12 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-raised active:scale-95 transition-transform"
        aria-label={workspaceView === 'finance' ? "Add Transaction" : "Add Bookmark"}
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
        onDelete={handleDeleteTodo}
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

      {/* Category Square Folder POPUP (z-50) */}
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

      {/* Link Detail Reader Modal (z-[60]) */}
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

      {/* Link Creation / Editing Modal (z-[70] - Always in front of folder popup) */}
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

      {/* Finance Numpad Modal (Fintech Rupee Wallet) */}
      <FinanceNumpadModal
        isOpen={isFinanceModalOpen}
        onClose={() => {
          setIsFinanceModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveFinanceTransaction}
        initialData={editingTransaction}
        categories={financeCategories}
        currency={financeCurrency}
        defaultType={defaultFinanceType}
        defaultCategory={defaultFinanceCategory}
        onSaveCategory={handleSaveFinanceCategory}
        onDeleteCategory={handleDeleteFinanceCategory}
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
