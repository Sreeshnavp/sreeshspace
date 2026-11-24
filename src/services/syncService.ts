import { supabase } from './supabaseClient';
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
  loadDayLogs,
  saveDayLogs,
  loadRoutines,
  saveRoutines,
  loadStreakState,
  saveStreakState,
  loadCustomBackground,
  saveCustomBackgroundImage,
  saveBackgroundSettings,
  loadTombstones,
  saveTombstones,
  loadFinanceTransactions,
  saveFinanceTransactions,
  loadFinanceCategories,
  saveFinanceCategories,
  loadSketches,
  saveSketches,
  loadReels,
  saveReels,
  loadReelCategories,
  saveReelCategories,
  loadRolloverDecisions,
  saveRolloverDecisions,
  isSampleItem,
  isPreinstalledCategory,
  isPreinstalledReelCategory,
  loadHabitsList,
  saveHabitsList,
  loadPrioritiesList,
  savePrioritiesList,
  loadGoalArcs,
  saveGoalArcs,
  loadBazaarPerks,
  saveBazaarPerks,
  isDefaultPerk,
  loadGlowPoints,
  loadGlowPointsUpdatedAt,
  saveGlowPoints,
  loadPointRates,
  savePointRates,
  loadLastBonusDate,
  loadLastBonusDateUpdatedAt,
  saveLastBonusDate,
  loadNotesFolders,
  saveNotesFolders,
  loadQuickAccessLinks,
  saveQuickAccessLinks,
  loadSavingsGoals,
  saveSavingsGoals,
  loadStatusVibe,
  saveStatusVibe,
} from './storage';
import type {
  LinkItem,
  CategoryInfo,
  TodoItem,
  NoteItem,
  ActivityEvent,
  DayLog,
  RoutineItem,
  StreakState,
  FinanceTransaction,
  FinanceCategory,
} from '../types';

export const STORAGE_KEY_SYNC_KEY = 'orbit_sync_key_v1';
export const STORAGE_KEY_CLIENT_ID = 'orbit_client_id_v1';
export const STORAGE_KEY_LAST_SYNCED = 'orbit_last_synced_v1';
export const DEFAULT_SYNC_KEY = 'sreeshnav-vault';

export interface SyncedWallpaperSettings {
  imageUrl: string | null;
  opacity: number;
  blur: number;
  enabled: boolean;
  updatedAt?: string;
  removedAt?: string;
}

export interface VaultPayload {
  sync_key: string;
  links: LinkItem[];
  categories: CategoryInfo[];
  todos: TodoItem[];
  notes: NoteItem[];
  events: ActivityEvent[];
  daylogs: Record<string, DayLog>;
  routines: RoutineItem[];
  streak: StreakState;
  settings?: {
    wallpaper?: SyncedWallpaperSettings;
    [key: string]: any;
  };
  client_id: string;
  version?: number;
  updated_at?: string;
}

export type SyncStatusState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncStatus {
  state: SyncStatusState;
  lastSyncedAt: string | null;
  syncKey: string;
  errorMessage?: string;
}

let syncStatusListeners: Array<(status: SyncStatus) => void> = [];
let wallpaperListeners: Array<(wp: SyncedWallpaperSettings) => void> = [];
let realtimeChannel: any = null;

export function notifyWallpaperChanged(wp: SyncedWallpaperSettings) {
  for (const listener of wallpaperListeners) {
    try {
      listener(wp);
    } catch (e) {
      console.error('Error notifying wallpaper listener:', e);
    }
  }
}

export function subscribeToWallpaper(listener: (wp: SyncedWallpaperSettings) => void): () => void {
  wallpaperListeners.push(listener);
  return () => {
    wallpaperListeners = wallpaperListeners.filter((l) => l !== listener);
  };
}

export function getSyncKey(): string {
  try {
    // Check URL params first (e.g. ?sync=my-vault)
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSyncKey = urlParams.get('sync');
      if (urlSyncKey && urlSyncKey.trim().length >= 3) {
        const cleanKey = urlSyncKey.trim().toLowerCase();
        localStorage.setItem(STORAGE_KEY_SYNC_KEY, cleanKey);
        // Clean URL without triggering page reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return cleanKey;
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY_SYNC_KEY);
    if (stored && stored.trim().length >= 3) {
      return stored.trim();
    }
  } catch (err) {
    console.error('Error reading sync key:', err);
  }

  // Fallback to default user vault key
  return DEFAULT_SYNC_KEY;
}

export function setSyncKey(newKey: string): void {
  const clean = newKey.trim().toLowerCase();
  if (clean.length < 3) {
    throw new Error('Sync key must be at least 3 characters long');
  }
  localStorage.setItem(STORAGE_KEY_SYNC_KEY, clean);
  notifyStatusChange({
    state: 'syncing',
    lastSyncedAt: getLastSyncedAt(),
    syncKey: clean,
  });
}

export function getClientId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (!id) {
      id = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, id);
    }
    return id;
  } catch {
    return 'client-fallback';
  }
}

export function getLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNCED);
  } catch {
    return null;
  }
}

function notifyStatusChange(status: SyncStatus) {
  for (const listener of syncStatusListeners) {
    listener(status);
  }
}

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncStatusListeners.push(listener);
  // Send current status immediately
  listener({
    state: navigator.onLine ? 'synced' : 'offline',
    lastSyncedAt: getLastSyncedAt(),
    syncKey: getSyncKey(),
  });
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== listener);
  };
}

/**
 * Merges two arrays of objects by ID, taking the newer one based on timestamp.
 */
export function mergeItemsById<T extends { id: string }>(
  local: T[],
  remote: T[],
  getTime: (item: T) => number,
  tombstones?: Record<string, string>
): T[] {
  const map = new Map<string, T>();

  const isTombstoned = (item: T): boolean => {
    if (!tombstones || !tombstones[item.id]) return false;
    const deletedTime = new Date(tombstones[item.id]).getTime();
    const itemTime = getTime(item);
    return deletedTime >= itemTime;
  };

  // Add local items (ignoring tombstoned deletions)
  for (const item of local || []) {
    if (item && item.id && !isTombstoned(item)) {
      map.set(item.id, item);
    }
  }

  // Merge remote items
  for (const rItem of remote || []) {
    if (!rItem || !rItem.id || isTombstoned(rItem)) continue;
    const lItem = map.get(rItem.id);
    if (!lItem) {
      map.set(rItem.id, rItem);
    } else {
      const lTime = getTime(lItem);
      const rTime = getTime(rItem);
      // Keep newer, or keep local if equal
      if (rTime > lTime) {
        map.set(rItem.id, rItem);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Intelligent conflict-free merge of local and remote vaults.
 */
export function mergeVaultData(
  local: Omit<VaultPayload, 'sync_key' | 'client_id' | 'version' | 'updated_at'>,
  remote: Partial<VaultPayload>
): Omit<VaultPayload, 'sync_key' | 'client_id' | 'version' | 'updated_at'> {
  // Merge tombstones across local and remote (deletion tracking)
  const localTombstones: Record<string, string> = local.settings?.tombstones || {};
  const remoteTombstones: Record<string, string> = remote.settings?.tombstones || {};
  const mergedTombstones: Record<string, string> = { ...remoteTombstones, ...localTombstones };

  // 1. Links
  const links = mergeItemsById(
    local.links || [],
    remote.links || [],
    (l) => new Date(l.updatedAt || l.createdAt || 0).getTime(),
    mergedTombstones
  ).filter((l) => !isSampleItem(l));

  // 2. Categories (filter out any preinstalled categories)
  const categories = mergeItemsById(
    (local.categories || []).filter((c) => !isPreinstalledCategory(c)),
    (remote.categories || []).filter((c) => !isPreinstalledCategory(c)),
    () => 0,
    mergedTombstones
  );

  // 3. Todos
  const todos = mergeItemsById(
    local.todos || [],
    remote.todos || [],
    (t) => new Date(t.updatedAt || t.completedAt || t.createdAt || 0).getTime(),
    mergedTombstones
  ).filter((t) => !isSampleItem(t));

  // 4. Notes
  const notes = mergeItemsById(
    local.notes || [],
    remote.notes || [],
    (n) => new Date(n.updatedAt || n.createdAt || 0).getTime(),
    mergedTombstones
  ).filter((n) => !isSampleItem(n));

  // 5. Events (append-only log, merge and sort by timestamp desc, filter out deleted, uncompleted, sample, and pre-reset events)
  const localResetAt = local.settings?.streakResetAt ? new Date(local.settings.streakResetAt).getTime() : 0;
  const remoteResetAt = remote.settings?.streakResetAt ? new Date(remote.settings.streakResetAt).getTime() : 0;
  const streakResetAt = Math.max(localResetAt, remoteResetAt);

  // Set of uncompleted todo IDs - ensure lingering completion events from remote are dropped when a task was unclicked
  const uncompletedTodoIds = new Set(
    todos.filter((t) => !t.completed).map((t) => t.id)
  );

  const eventMap = new Map<string, ActivityEvent>();
  for (const e of [...(local.events || []), ...(remote.events || [])]) {
    const eTs = typeof e.ts === 'number' ? e.ts : new Date(e.date || 0).getTime();
    if (
      e && 
      e.id && 
      !isSampleItem(e) && 
      !e.type.includes('deleted') && 
      !e.type.includes('uncompleted') &&
      (!mergedTombstones || !e.refId || !mergedTombstones[e.refId]) &&
      (!e.refId || !uncompletedTodoIds.has(e.refId) || !['task_completed', 'goal_completed'].includes(e.type)) &&
      (!streakResetAt || eTs >= streakResetAt) &&
      !eventMap.has(e.id)
    ) {
      eventMap.set(e.id, e);
    }
  }
  const events = Array.from(eventMap.values()).sort(
    (a, b) => new Date(b.ts || 0).getTime() - new Date(a.ts || 0).getTime()
  );

  // 6. DayLogs (merge by dateKey)
  const daylogs: Record<string, DayLog> = { ...(local.daylogs || {}) };
  for (const [date, rLog] of Object.entries(remote.daylogs || {})) {
    const lLog = daylogs[date];
    if (!lLog) {
      daylogs[date] = rLog;
    } else {
      // Keep the one with finalizedAt or greater completed count
      if (rLog.finalizedAt && !lLog.finalizedAt) {
        daylogs[date] = rLog;
      } else if ((rLog.completed || 0) > (lLog.completed || 0)) {
        daylogs[date] = { ...lLog, ...rLog };
      }
    }
  }

  // 7. Routines
  const routines = mergeItemsById(
    local.routines || [],
    remote.routines || [],
    (r) => new Date(r.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 8. Streak
  const lStreak = local.streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] };
  const rStreak = remote.streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] };
  const mergedFrozen = Array.from(new Set([...(lStreak.frozenDates || []), ...(rStreak.frozenDates || [])]));
  
  const isVaultEmpty = links.length === 0 && todos.length === 0 && notes.length === 0;

  // Real completions logged since streak reset
  const hasValidCompletions = events.some((ev) =>
    ['task_completed', 'goal_completed', 'focus_session'].includes(ev.type)
  );

  const streak: StreakState = isVaultEmpty || (streakResetAt > 0 && !hasValidCompletions)
    ? {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        freezesRemaining: 1,
        frozenDates: [],
      }
    : {
        currentStreak: Math.max(lStreak.currentStreak || 0, rStreak.currentStreak || 0),
        longestStreak: Math.max(lStreak.longestStreak || 0, rStreak.longestStreak || 0),
        totalActiveDays: Math.max(lStreak.totalActiveDays || 0, rStreak.totalActiveDays || 0),
        freezesRemaining: Math.min(lStreak.freezesRemaining ?? 1, rStreak.freezesRemaining ?? 1),
        frozenDates: mergedFrozen,
      };

  // 9. Settings & Custom Background Wallpaper (Resilient against uninitialized / incognito tabs)
  const localWp = local.settings?.wallpaper;
  const remoteWp = remote.settings?.wallpaper;
  let mergedWp: SyncedWallpaperSettings | undefined = remoteWp || localWp;

  if (localWp && remoteWp) {
    const localRemovedAt = localWp.removedAt
      ? new Date(localWp.removedAt).getTime()
      : 0;
    const remoteUpdatedAt = remoteWp.updatedAt
      ? new Date(remoteWp.updatedAt).getTime()
      : 0;
    const localUpdatedAt = localWp.updatedAt
      ? new Date(localWp.updatedAt).getTime()
      : 0;

    if (localRemovedAt > remoteUpdatedAt) {
      // User explicitly deleted the wallpaper on this device after remote was updated
      mergedWp = {
        ...localWp,
        imageUrl: null,
        updatedAt: localWp.removedAt,
        removedAt: localWp.removedAt,
      };
    } else if (!localWp.imageUrl && remoteWp.imageUrl) {
      // Local client is uninitialized, fresh browser or incognito tab without cached image.
      // INVARIANT: An empty local cache MUST NEVER overwrite or erase remote wallpaper!
      mergedWp = {
        ...remoteWp,
        imageUrl: remoteWp.imageUrl,
        opacity: remoteWp.opacity ?? localWp.opacity ?? 0.25,
        blur: remoteWp.blur ?? localWp.blur ?? 0,
        enabled: remoteWp.enabled ?? localWp.enabled ?? true,
        updatedAt: remoteWp.updatedAt || new Date().toISOString(),
      };
    } else if (localWp.imageUrl && !remoteWp.imageUrl) {
      // Local has an uploaded image, remote currently has none -> keep local
      mergedWp = localWp;
    } else if (localWp.imageUrl && remoteWp.imageUrl) {
      // Both have an image -> keep the more recently updated
      mergedWp = remoteUpdatedAt >= localUpdatedAt ? remoteWp : localWp;
    } else {
      // Neither has an image -> keep newer settings
      mergedWp = remoteUpdatedAt >= localUpdatedAt ? remoteWp : localWp;
    }
  } else if (remoteWp) {
    mergedWp = remoteWp;
  } else {
    mergedWp = localWp;
  }

  // 10. Finances (Income & Expense Transactions)
  const localFinances: FinanceTransaction[] = (local.settings?.finances as FinanceTransaction[]) || [];
  const remoteFinances: FinanceTransaction[] = (remote.settings?.finances as FinanceTransaction[]) || [];
  const finances = mergeItemsById(
    localFinances,
    remoteFinances,
    (tx) => new Date(tx.updatedAt || tx.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 11. Finance Categories (Only user-created categories)
  const localFinanceCats: FinanceCategory[] = ((local.settings?.financeCategories as FinanceCategory[]) || [])
    .filter((c) => !c.isDefault && !c.id.startsWith('cat-'));
  const remoteFinanceCats: FinanceCategory[] = ((remote.settings?.financeCategories as FinanceCategory[]) || [])
    .filter((c) => !c.isDefault && !c.id.startsWith('cat-'));
  const financeCategories = mergeItemsById(
    localFinanceCats,
    remoteFinanceCats,
    () => 0,
    mergedTombstones
  ).filter((c) => !c.isDefault && !c.id.startsWith('cat-'));

  // 12. Sketches & Doodles
  const localSketches: any[] = (local.settings?.sketches as any[]) || [];
  const remoteSketches: any[] = (remote.settings?.sketches as any[]) || [];
  const sketches = mergeItemsById(
    localSketches,
    remoteSketches,
    (s) => new Date(s.updatedAt || s.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 13. Instagram Reels Vault
  const localReels: any[] = (local.settings?.reels as any[]) || [];
  const remoteReels: any[] = (remote.settings?.reels as any[]) || [];
  const reels = mergeItemsById(
    localReels,
    remoteReels,
    (r) => new Date(r.updatedAt || r.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 14. Instagram Reel Categories / Collections
  const localReelCats: any[] = ((local.settings?.reelCategories as any[]) || []).filter(
    (c) => !isPreinstalledReelCategory(c)
  );
  const remoteReelCats: any[] = ((remote.settings?.reelCategories as any[]) || []).filter(
    (c) => !isPreinstalledReelCategory(c)
  );
  const reelCategories = mergeItemsById(
    localReelCats,
    remoteReelCats,
    (c) => new Date(c.updatedAt || c.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 15. Rollover Decisions (Permanent per-date decisions)
  const localRolloverDecisions = (local.settings?.rolloverDecisions as Record<string, any>) || {};
  const remoteRolloverDecisions = (remote.settings?.rolloverDecisions as Record<string, any>) || {};
  const rolloverDecisions = {
    ...remoteRolloverDecisions,
    ...localRolloverDecisions,
  };

  // 16. Habits List
  const localHabits = (local.settings?.habitsList as any[]) || [];
  const remoteHabits = (remote.settings?.habitsList as any[]) || [];
  const habitsList = mergeItemsById(
    localHabits,
    remoteHabits,
    (h) => new Date(h.updatedAt || h.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 17. Today's & Advance Priorities List (filter out legacy dummy/seed items)
  const localPriorities = (local.settings?.prioritiesList as any[]) || [];
  const remotePriorities = (remote.settings?.prioritiesList as any[]) || [];
  const prioritiesList = mergeItemsById(
    localPriorities.filter((p) => !p.id?.startsWith('seed-')),
    remotePriorities.filter((p) => !p.id?.startsWith('seed-')),
    (p) => new Date(p.updatedAt || p.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 18. Long-Term Goal Arcs
  const localGoalArcs = (local.settings?.goalArcs as any[]) || [];
  const remoteGoalArcs = (remote.settings?.goalArcs as any[]) || [];
  const goalArcs = mergeItemsById(
    localGoalArcs.filter((g) => !g.id?.startsWith('seed-') && !g.id?.startsWith('default-')),
    remoteGoalArcs.filter((g) => !g.id?.startsWith('seed-') && !g.id?.startsWith('default-')),
    (g) => new Date(g.updatedAt || g.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 19. Cozy Reward Bazaar Perks (clean zero defaults, user added only)
  const localPerks = (local.settings?.bazaarPerks as any[]) || [];
  const remotePerks = (remote.settings?.bazaarPerks as any[]) || [];
  const bazaarPerks = mergeItemsById(
    localPerks.filter((p) => !isDefaultPerk(p)),
    remotePerks.filter((p) => !isDefaultPerk(p)),
    (p) => new Date(p.updatedAt || p.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 20. Glow Points & Vault Points (LWW based on pointsUpdatedAt)
  const localPts = typeof local.settings?.glowPoints === 'number' ? local.settings.glowPoints : 0;
  const remotePts = typeof remote.settings?.glowPoints === 'number' ? remote.settings.glowPoints : 0;
  const localPtsTime = new Date(local.settings?.glowPointsUpdatedAt || 0).getTime();
  const remotePtsTime = new Date(remote.settings?.glowPointsUpdatedAt || 0).getTime();

  let glowPoints: number;
  let glowPointsUpdatedAt: string;

  if (localPtsTime === 0 && remotePtsTime === 0) {
    glowPoints = Math.max(localPts, remotePts);
    glowPointsUpdatedAt = new Date().toISOString();
  } else if (localPtsTime >= remotePtsTime) {
    glowPoints = localPts;
    glowPointsUpdatedAt = local.settings?.glowPointsUpdatedAt || (localPtsTime ? new Date(localPtsTime).toISOString() : new Date().toISOString());
  } else {
    glowPoints = remotePts;
    glowPointsUpdatedAt = remote.settings?.glowPointsUpdatedAt || new Date(remotePtsTime).toISOString();
  }

  // 21. Configurable Point Rates
  const pointRates = remote.settings?.pointRates || local.settings?.pointRates || null;

  // 22. Daily Bonus Claim Date (LWW based on lastBonusDateUpdatedAt)
  const localBonusDate = local.settings?.lastBonusDate ?? '';
  const remoteBonusDate = remote.settings?.lastBonusDate ?? '';
  const localBonusTime = new Date(local.settings?.lastBonusDateUpdatedAt || 0).getTime();
  const remoteBonusTime = new Date(remote.settings?.lastBonusDateUpdatedAt || 0).getTime();

  let lastBonusDate: string;
  let lastBonusDateUpdatedAt: string;

  if (localBonusTime === 0 && remoteBonusTime === 0) {
    lastBonusDate = remoteBonusDate || localBonusDate || '';
    lastBonusDateUpdatedAt = new Date().toISOString();
  } else if (localBonusTime >= remoteBonusTime) {
    lastBonusDate = localBonusDate;
    lastBonusDateUpdatedAt = local.settings?.lastBonusDateUpdatedAt || (localBonusTime ? new Date(localBonusTime).toISOString() : new Date().toISOString());
  } else {
    lastBonusDate = remoteBonusDate;
    lastBonusDateUpdatedAt = remote.settings?.lastBonusDateUpdatedAt || new Date(remoteBonusTime).toISOString();
  }

  // 23. Notes Vault Custom Folders
  const localNotesFolders = (local.settings?.notesFolders as any[]) || [];
  const remoteNotesFolders = (remote.settings?.notesFolders as any[]) || [];
  const notesFolders = mergeItemsById(
    localNotesFolders,
    remoteNotesFolders,
    (f) => new Date(f.updatedAt || f.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 24. Quick Access Links
  const localQuickLinks = (local.settings?.quickAccessLinks as any[]) || [];
  const remoteQuickLinks = (remote.settings?.quickAccessLinks as any[]) || [];
  const quickAccessLinks = mergeItemsById(
    localQuickLinks,
    remoteQuickLinks,
    (q) => new Date(q.updatedAt || q.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 25. Financial Savings Goals
  const localSavingsGoals = (local.settings?.savingsGoals as any[]) || [];
  const remoteSavingsGoals = (remote.settings?.savingsGoals as any[]) || [];
  const savingsGoals = mergeItemsById(
    localSavingsGoals,
    remoteSavingsGoals,
    (s) => new Date(s.updatedAt || s.createdAt || 0).getTime(),
    mergedTombstones
  );

  // 26. Daily Status Vibe
  const statusVibe = remote.settings?.statusVibe || local.settings?.statusVibe || '✨ Feeling Creative';

  const settings = {
    ...(remote.settings || {}),
    ...(local.settings || {}),
    wallpaper: mergedWp,
    tombstones: mergedTombstones,
    finances,
    financeCategories,
    sketches,
    reels,
    reelCategories,
    rolloverDecisions,
    habitsList,
    prioritiesList,
    goalArcs,
    bazaarPerks,
    glowPoints,
    glowPointsUpdatedAt,
    pointRates,
    lastBonusDate,
    lastBonusDateUpdatedAt,
    notesFolders,
    quickAccessLinks,
    savingsGoals,
    statusVibe,
    ...(streakResetAt > 0 ? { streakResetAt: new Date(streakResetAt).toISOString() } : {}),
  };

  return {
    links,
    categories,
    todos,
    notes,
    events,
    daylogs,
    routines,
    streak,
    settings,
  };
}

/**
 * Core bidirectional sync function.
 * 1. Pulls remote data from Supabase for current sync_key.
 * 2. Merges with local IndexedDB data.
 * 3. Saves merged data to IndexedDB.
 * 4. Pushes merged data back to Supabase.
 */
export async function syncWithCloud(options?: { onMerged?: () => void }): Promise<{
  success: boolean;
  error?: string;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyStatusChange({
      state: 'offline',
      lastSyncedAt: getLastSyncedAt(),
      syncKey: getSyncKey(),
    });
    return { success: false, error: 'Device is offline' };
  }

  const syncKey = getSyncKey();
  const clientId = getClientId();

  notifyStatusChange({
    state: 'syncing',
    lastSyncedAt: getLastSyncedAt(),
    syncKey,
  });

  try {
    // 1. Gather all local data
    const [
      localLinks,
      localCategories,
      localTodos,
      localNotes,
      localEvents,
      localDayLogs,
      localRoutines,
      localStreak,
      localBg,
      localTombstones,
      localFinances,
      localFinanceCats,
      localSketches,
      localReels,
      localReelCats,
      localRolloverDecisions,
    ] = await Promise.all([
      loadLinks(),
      loadCategories(),
      loadTodos(),
      loadNotes(),
      loadActivityEvents(),
      loadDayLogs(),
      loadRoutines(),
      loadStreakState(),
      loadCustomBackground(),
      loadTombstones(),
      loadFinanceTransactions(),
      loadFinanceCategories(),
      loadSketches(),
      loadReels(),
      loadReelCategories(),
      loadRolloverDecisions(),
    ]);

    const localHabits = loadHabitsList();
    const localPriorities = loadPrioritiesList();
    const localGoalArcs = loadGoalArcs();
    const localPerks = loadBazaarPerks();
    const localGlowPoints = loadGlowPoints();
    const localGlowPointsUpdatedAt = loadGlowPointsUpdatedAt();
    const localPointRates = loadPointRates();
    const localLastBonusDate = loadLastBonusDate();
    const localLastBonusDateUpdatedAt = loadLastBonusDateUpdatedAt();
    const localNotesFolders = loadNotesFolders();
    const localQuickAccessLinks = loadQuickAccessLinks();
    const localSavingsGoals = loadSavingsGoals();
    const localStatusVibe = loadStatusVibe();

    const localData = {
      links: localLinks,
      categories: localCategories,
      todos: localTodos,
      notes: localNotes,
      events: localEvents,
      daylogs: localDayLogs,
      routines: localRoutines,
      streak: localStreak,
      settings: {
        wallpaper: {
          imageUrl: localBg.imageUrl,
          opacity: localBg.settings.opacity,
          blur: localBg.settings.blur,
          enabled: localBg.settings.enabled,
          updatedAt: localBg.settings.updatedAt || (localBg.imageUrl ? new Date().toISOString() : '1970-01-01T00:00:00.000Z'),
          removedAt: localBg.settings.removedAt,
        },
        tombstones: localTombstones,
        finances: localFinances,
        financeCategories: localFinanceCats,
        sketches: localSketches,
        reels: localReels,
        reelCategories: localReelCats,
        rolloverDecisions: localRolloverDecisions,
        habitsList: localHabits,
        prioritiesList: localPriorities,
        goalArcs: localGoalArcs,
        bazaarPerks: localPerks,
        glowPoints: localGlowPoints,
        glowPointsUpdatedAt: localGlowPointsUpdatedAt,
        pointRates: localPointRates,
        lastBonusDate: localLastBonusDate,
        lastBonusDateUpdatedAt: localLastBonusDateUpdatedAt,
        notesFolders: localNotesFolders,
        quickAccessLinks: localQuickAccessLinks,
        savingsGoals: localSavingsGoals,
        statusVibe: localStatusVibe,
        streakResetAt: '2026-11-17T16:20:00.000Z',
      },
    };

    // 2. Fetch remote vault from Supabase
    const { data: remoteData, error: fetchError } = await supabase
      .from('orbit_vaults')
      .select('*')
      .eq('sync_key', syncKey)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      notifyStatusChange({
        state: 'error',
        lastSyncedAt: getLastSyncedAt(),
        syncKey,
        errorMessage: fetchError.message,
      });
      return { success: false, error: fetchError.message };
    }

    let mergedPayload: Omit<VaultPayload, 'sync_key' | 'client_id' | 'version' | 'updated_at'>;

    if (!remoteData) {
      // Remote does not exist yet -> use local data as base
      mergedPayload = localData;
    } else {
      // Merge local with remote
      mergedPayload = mergeVaultData(localData, remoteData);
    }

    // 3. Save merged data back to local IndexedDB
    await Promise.all([
      saveLinks(mergedPayload.links),
      saveCategories(mergedPayload.categories),
      saveTodos(mergedPayload.todos),
      saveNotes(mergedPayload.notes),
      saveActivityEvents(mergedPayload.events),
      saveDayLogs(mergedPayload.daylogs),
      saveRoutines(mergedPayload.routines),
      saveStreakState(mergedPayload.streak),
      mergedPayload.settings?.tombstones
        ? saveTombstones(mergedPayload.settings.tombstones)
        : Promise.resolve(),
      mergedPayload.settings?.finances
        ? saveFinanceTransactions(mergedPayload.settings.finances)
        : Promise.resolve(),
      mergedPayload.settings?.financeCategories
        ? saveFinanceCategories(mergedPayload.settings.financeCategories)
        : Promise.resolve(),
      mergedPayload.settings?.sketches
        ? saveSketches(mergedPayload.settings.sketches)
        : Promise.resolve(),
      mergedPayload.settings?.reels
        ? saveReels(mergedPayload.settings.reels)
        : Promise.resolve(),
      mergedPayload.settings?.reelCategories
        ? saveReelCategories(mergedPayload.settings.reelCategories)
        : Promise.resolve(),
      mergedPayload.settings?.rolloverDecisions
        ? saveRolloverDecisions(mergedPayload.settings.rolloverDecisions)
        : Promise.resolve(),
    ]);

    // Save Habits, Goals, Perks & Miscellaneous Sync State to local storage
    if (mergedPayload.settings?.habitsList) {
      saveHabitsList(mergedPayload.settings.habitsList);
    }
    if (mergedPayload.settings?.prioritiesList) {
      savePrioritiesList(mergedPayload.settings.prioritiesList);
    }
    if (mergedPayload.settings?.goalArcs) {
      saveGoalArcs(mergedPayload.settings.goalArcs);
    }
    if (mergedPayload.settings?.bazaarPerks) {
      saveBazaarPerks(mergedPayload.settings.bazaarPerks);
    }
    if (typeof mergedPayload.settings?.glowPoints === 'number') {
      saveGlowPoints(mergedPayload.settings.glowPoints, mergedPayload.settings.glowPointsUpdatedAt);
    }
    if (mergedPayload.settings?.pointRates) {
      savePointRates(mergedPayload.settings.pointRates);
    }
    if (typeof mergedPayload.settings?.lastBonusDate === 'string') {
      saveLastBonusDate(mergedPayload.settings.lastBonusDate, mergedPayload.settings.lastBonusDateUpdatedAt);
    }
    if (mergedPayload.settings?.notesFolders) {
      saveNotesFolders(mergedPayload.settings.notesFolders);
    }
    if (mergedPayload.settings?.quickAccessLinks) {
      saveQuickAccessLinks(mergedPayload.settings.quickAccessLinks);
    }
    if (mergedPayload.settings?.savingsGoals) {
      saveSavingsGoals(mergedPayload.settings.savingsGoals);
    }
    if (mergedPayload.settings?.statusVibe) {
      saveStatusVibe(mergedPayload.settings.statusVibe);
    }

    // Save and apply merged wallpaper if updated from cloud
    if (mergedPayload.settings?.wallpaper) {
      const wp = mergedPayload.settings.wallpaper;
      const currentBg = await loadCustomBackground();
      const localTime = new Date(currentBg.settings.updatedAt || 0).getTime();
      const remoteTime = new Date(wp.updatedAt || 0).getTime();

      const shouldApply =
        (wp.imageUrl && !currentBg.imageUrl) ||
        remoteTime > localTime ||
        (wp.imageUrl !== currentBg.imageUrl);

      if (shouldApply) {
        await saveCustomBackgroundImage(wp.imageUrl);
        saveBackgroundSettings({
          opacity: wp.opacity ?? 0.25,
          blur: wp.blur ?? 0,
          enabled: wp.enabled ?? true,
          updatedAt: wp.updatedAt,
        });
        notifyWallpaperChanged(wp);
      }
    }

    // 4. Upsert merged data to Supabase
    const payloadToUpload = {
      sync_key: syncKey,
      links: mergedPayload.links,
      categories: mergedPayload.categories,
      todos: mergedPayload.todos,
      notes: mergedPayload.notes,
      events: mergedPayload.events,
      daylogs: mergedPayload.daylogs,
      routines: mergedPayload.routines,
      streak: mergedPayload.streak,
      settings: mergedPayload.settings || {},
      client_id: clientId,
      version: (remoteData?.version || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('orbit_vaults')
      .upsert(payloadToUpload, { onConflict: 'sync_key' });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      notifyStatusChange({
        state: 'error',
        lastSyncedAt: getLastSyncedAt(),
        syncKey,
        errorMessage: upsertError.message,
      });
      return { success: false, error: upsertError.message };
    }

    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNCED, nowIso);
    } catch {
      // ignore
    }

    notifyStatusChange({
      state: 'synced',
      lastSyncedAt: nowIso,
      syncKey,
    });

    // Notify all open components and views that new synced data is ready
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orbit-sync-updated'));
    }

    if (options?.onMerged) {
      options.onMerged();
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error during cloud sync:', err);
    notifyStatusChange({
      state: 'error',
      lastSyncedAt: getLastSyncedAt(),
      syncKey,
      errorMessage: err?.message || 'Sync failed',
    });
    return { success: false, error: err?.message || 'Sync failed' };
  }
}

let autoSyncTimer: any = null;
/**
 * Triggers a debounced background sync whenever any local item changes.
 */
export function triggerAutoSync(debounceMs = 1200): void {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    syncWithCloud().catch((err) => console.error('Auto sync error:', err));
  }, debounceMs);
}

/**
 * Initializes realtime listening on the orbit_vaults table for cross-device updates.
 */
export function initRealtimeSync(onRemoteUpdate: () => void): () => void {
  const syncKey = getSyncKey();
  const clientId = getClientId();

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabase
    .channel(`orbit_sync_${syncKey}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orbit_vaults',
        filter: `sync_key=eq.${syncKey}`,
      },
      (payload) => {
        // If the update came from another device, pull and reload!
        const remoteClientId = (payload.new as any)?.client_id;
        if (!remoteClientId || remoteClientId !== clientId) {
          console.log('Detected remote change from another device. Syncing...');
          syncWithCloud({
            onMerged: () => {
              if (onRemoteUpdate) onRemoteUpdate();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('orbit-sync-updated'));
              }
            },
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.warn('Realtime channel status:', status);
      }
    });

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}
