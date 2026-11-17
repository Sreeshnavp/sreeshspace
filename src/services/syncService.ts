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
  isSampleItem,
  isPreinstalledCategory,
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
      // Keep newer or remote if equal
      if (rTime >= lTime) {
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
    (t) => new Date(t.completedAt || t.createdAt || 0).getTime(),
    mergedTombstones
  ).filter((t) => !isSampleItem(t));

  // 4. Notes
  const notes = mergeItemsById(
    local.notes || [],
    remote.notes || [],
    (n) => new Date(n.updatedAt || n.createdAt || 0).getTime(),
    mergedTombstones
  ).filter((n) => !isSampleItem(n));

  // 5. Events (append-only log, merge and sort by timestamp desc)
  const eventMap = new Map<string, ActivityEvent>();
  for (const e of [...(local.events || []), ...(remote.events || [])]) {
    if (e && e.id && !isSampleItem(e) && !eventMap.has(e.id)) {
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
    () => 0
  );

  // 8. Streak
  const lStreak = local.streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] };
  const rStreak = remote.streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] };
  const mergedFrozen = Array.from(new Set([...(lStreak.frozenDates || []), ...(rStreak.frozenDates || [])]));
  
  const streak: StreakState = {
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
  const settings = {
    ...(remote.settings || {}),
    ...(local.settings || {}),
    wallpaper: mergedWp,
    tombstones: mergedTombstones,
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
    ]);

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
    ]);

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

/**
 * Initializes realtime listening on the orbit_vaults table for cross-device updates.
 */
export function initRealtimeSync(onRemoteUpdate: () => void): () => void {
  const syncKey = getSyncKey();
  const clientId = getClientId();

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabase
    .channel(`orbit_sync_${syncKey}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orbit_vaults',
        filter: `sync_key=eq.${syncKey}`,
      },
      (payload) => {
        // If the update came from another device, pull and reload!
        const remoteClientId = payload.new?.client_id;
        if (remoteClientId && remoteClientId !== clientId) {
          console.log('Detected remote change from another device. Syncing...');
          syncWithCloud({ onMerged: onRemoteUpdate });
        }
      }
    )
    .subscribe();

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}
