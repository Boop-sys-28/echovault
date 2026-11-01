import { Message, BacklogMessage } from '../types';

const DB_NAME = 'echovault_idb_vault';
const DB_VERSION = 1;

const STORE_CHATS = 'chat_logs';
const STORE_GROUP_ROOMS = 'group_room_logs';
const STORE_MEDIA = 'media_blobs';

const CHATS_MASTER_KEY = 'pulsedirect_chats';
const MIGRATION_FLAG_KEY = 'pulsedirect_idb_migrated_v1';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens and initializes the native IndexedDB database for high-capacity chat logs,
 * group room backlogs, and media payloads.
 */
function openVaultDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CHATS)) {
          db.createObjectStore(STORE_CHATS);
        }
        if (!db.objectStoreNames.contains(STORE_GROUP_ROOMS)) {
          db.createObjectStore(STORE_GROUP_ROOMS);
        }
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  return openVaultDB().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbSet<T>(storeName: string, key: string, value: T): Promise<void> {
  return openVaultDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

function idbDelete(storeName: string, key: string): Promise<void> {
  return openVaultDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

function idbClear(storeName: string): Promise<void> {
  return openVaultDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

/**
 * Automatic one-time (and idempotent) migration:
 * 1. Reads any existing `pulsedirect_chats` and `pulsedirect_messages_*` from window.localStorage.
 * 2. Merges them safely into IndexedDB (`chat_logs` and `group_room_logs` stores).
 * 3. Removes the legacy large keys (`pulsedirect_chats`, `pulsedirect_messages_*`) from localStorage
 *    to immediately free up the 5 MB localStorage quota.
 */
export async function migrateLocalStorageChatsToIndexedDB(): Promise<{
  migratedChats: Record<string, Message[]>;
  migratedGroupRooms: Record<string, BacklogMessage[]>;
  didMigrate: boolean;
}> {
  let didMigrate = false;
  let existingIdbChats: Record<string, Message[]> = {};

  try {
    const stored = await idbGet<Record<string, Message[]>>(STORE_CHATS, CHATS_MASTER_KEY);
    if (stored && typeof stored === 'object') {
      existingIdbChats = stored;
    }
  } catch {
    // ignore read error
  }

  // 1. Check for legacy `pulsedirect_chats` in localStorage
  try {
    const rawLocalChats = window.localStorage.getItem(CHATS_MASTER_KEY);
    if (rawLocalChats) {
      const parsedLocalChats = JSON.parse(rawLocalChats) as Record<string, Message[]>;
      if (parsedLocalChats && typeof parsedLocalChats === 'object') {
        const mergedChats: Record<string, Message[]> = { ...existingIdbChats };
        for (const [charId, messages] of Object.entries(parsedLocalChats)) {
          if (!Array.isArray(messages)) continue;
          const idbList = mergedChats[charId] || [];
          if (idbList.length === 0) {
            mergedChats[charId] = messages;
          } else {
            // Merge by message id so no messages are lost
            const seenIds = new Set(idbList.map((m) => m.id));
            const combined = [...idbList];
            for (const m of messages) {
              if (m && m.id && !seenIds.has(m.id)) {
                seenIds.add(m.id);
                combined.push(m);
              }
            }
            combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            mergedChats[charId] = combined;
          }
        }
        existingIdbChats = mergedChats;
        await idbSet(STORE_CHATS, CHATS_MASTER_KEY, existingIdbChats);
      }
      // Clear the old large chat log key from localStorage to free up browser space
      window.localStorage.removeItem(CHATS_MASTER_KEY);
      didMigrate = true;
    }
  } catch {
    // Even if JSON parsing fails on corrupted local data, ensure we don't block IndexedDB
  }

  // 2. Migrate any `pulsedirect_messages_<roomId>` group room logs from localStorage
  const migratedGroupRooms: Record<string, BacklogMessage[]> = {};
  try {
    const groupKeysToMigrate: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('pulsedirect_messages_')) {
        groupKeysToMigrate.push(key);
      }
    }

    for (const fullKey of groupKeysToMigrate) {
      const roomId = fullKey.replace(/^pulsedirect_messages_/, '');
      const rawGroup = window.localStorage.getItem(fullKey);
      if (rawGroup && roomId) {
        try {
          const parsedGroup = JSON.parse(rawGroup) as BacklogMessage[];
          if (Array.isArray(parsedGroup)) {
            await idbSet(STORE_GROUP_ROOMS, roomId, parsedGroup);
            migratedGroupRooms[roomId] = parsedGroup;
          }
        } catch {
          // ignore malformed entry
        }
      }
      window.localStorage.removeItem(fullKey);
      didMigrate = true;
    }

    window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  } catch {
    // ignore storage errors
  }

  return {
    migratedChats: existingIdbChats,
    migratedGroupRooms,
    didMigrate,
  };
}

/**
 * Synchronous Peek helper used only on initial React state mount if localStorage still has
 * unmigrated data before the async IndexedDB migration finishes milliseconds later.
 */
export function peekLegacyLocalStorageChats(): Record<string, Message[]> {
  try {
    const raw = window.localStorage.getItem(CHATS_MASTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Loads all conversation histories from IndexedDB (running automatic one-time localStorage
 * migration first if needed).
 */
export async function loadChatsFromIndexedDB(): Promise<Record<string, Message[]>> {
  try {
    const { migratedChats } = await migrateLocalStorageChatsToIndexedDB();
    return migratedChats || {};
  } catch {
    return peekLegacyLocalStorageChats();
  }
}

/**
 * Persists all conversation histories exclusively to IndexedDB and ensures the legacy
 * `pulsedirect_chats` key is removed from localStorage.
 */
export async function saveChatsToIndexedDB(chats: Record<string, Message[]>): Promise<void> {
  try {
    await idbSet(STORE_CHATS, CHATS_MASTER_KEY, chats);
    if (window.localStorage.getItem(CHATS_MASTER_KEY) !== null) {
      window.localStorage.removeItem(CHATS_MASTER_KEY);
    }
  } catch {
    // ignore IndexedDB write failure in restricted contexts
  }
}

/**
 * Loads a group room's message history from IndexedDB.
 */
export async function loadGroupRoomMessagesFromIndexedDB(
  roomId: string
): Promise<BacklogMessage[] | null> {
  try {
    // Check if legacy localStorage key still exists and migrate it
    const legacyKey = `pulsedirect_messages_${roomId}`;
    const legacyRaw = window.localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as BacklogMessage[];
      if (Array.isArray(parsed)) {
        await idbSet(STORE_GROUP_ROOMS, roomId, parsed);
        window.localStorage.removeItem(legacyKey);
        return parsed;
      }
    }
    const stored = await idbGet<BacklogMessage[]>(STORE_GROUP_ROOMS, roomId);
    return Array.isArray(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Saves a group room's message history exclusively to IndexedDB.
 */
export async function saveGroupRoomMessagesToIndexedDB(
  roomId: string,
  messages: BacklogMessage[]
): Promise<void> {
  try {
    await idbSet(STORE_GROUP_ROOMS, roomId, messages);
    const legacyKey = `pulsedirect_messages_${roomId}`;
    if (window.localStorage.getItem(legacyKey) !== null) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    // ignore
  }
}

/**
 * Clears all chat logs, group room backlogs, and media blobs from IndexedDB (and any
 * lingering legacy keys in localStorage).
 */
export async function clearAllChatsInIndexedDB(): Promise<void> {
  try {
    await Promise.all([
      idbClear(STORE_CHATS),
      idbClear(STORE_GROUP_ROOMS),
      idbClear(STORE_MEDIA),
    ]);
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem(CHATS_MASTER_KEY);
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('pulsedirect_messages_')) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export { idbGet, idbSet, idbDelete };

export interface VaultStorageEstimate {
  totalUsedBytes: number;
  quotaBytes: number;
  chatBytes: number;
  memoryBytes: number;
  customCharBytes: number;
  settingsBytes: number;
  percentUsed: number;
  isDynamicQuota: boolean;
  formattedUsed: string;
  formattedQuota: string;
  formattedChat: string;
  formattedMemory: string;
  formattedCustomChar: string;
  formattedSettings: string;
}

/**
 * Formats byte counts into human-readable KB / MB / GB strings.
 */
export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(2)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Calculates storage usage across IndexedDB (for chat logs & media) and localStorage
 * (for memories, custom profiles, and lightweight config), and queries the browser's
 * StorageManager (`navigator.storage.estimate()`) for dynamic IndexedDB quota.
 */
export async function estimateVaultStorageUsage(
  chatsInState: Record<string, Message[]>
): Promise<VaultStorageEstimate> {
  let memoryBytes = 0;
  let customCharBytes = 0;
  let settingsBytes = 0;
  let localChatBytes = 0;

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const val = window.localStorage.getItem(key) || '';
      const bytes = (key.length + val.length) * 2; // UTF-16 byte estimate

      if (key === CHATS_MASTER_KEY || key.startsWith('pulsedirect_messages_')) {
        localChatBytes += bytes;
      } else if (key.startsWith('pulsedirect_memory_')) {
        memoryBytes += bytes;
      } else if (key.includes('custom_characters')) {
        customCharBytes += bytes;
      } else {
        settingsBytes += bytes;
      }
    }
  } catch {
    // ignore
  }

  // Estimate IndexedDB chat payload size from stored IDB chat logs or active state
  let idbChatBytes = 0;
  try {
    const idbStoredChats = await idbGet<Record<string, Message[]>>(STORE_CHATS, CHATS_MASTER_KEY);
    const targetChats =
      idbStoredChats && Object.keys(idbStoredChats).length > 0 ? idbStoredChats : chatsInState;
    const serialized = JSON.stringify(targetChats || {});
    idbChatBytes = serialized.length * 2;
  } catch {
    try {
      idbChatBytes = JSON.stringify(chatsInState || {}).length * 2;
    } catch {
      idbChatBytes = 0;
    }
  }

  const chatBytes = idbChatBytes + localChatBytes;
  const appCalculatedBytes = chatBytes + memoryBytes + customCharBytes + settingsBytes;

  let quotaBytes = 1024 * 1024 * 1024; // 1 GB fallback if StorageManager API unavailable
  let totalUsedBytes = appCalculatedBytes;
  let isDynamicQuota = false;

  if (
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    typeof navigator.storage.estimate === 'function'
  ) {
    try {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.quota === 'number' && estimate.quota > 0) {
        quotaBytes = estimate.quota;
        isDynamicQuota = true;
      }
      if (typeof estimate.usage === 'number' && estimate.usage > 0) {
        // Ensure totalUsedBytes reflects at least our serialized data size or browser reported usage
        totalUsedBytes = Math.max(appCalculatedBytes, estimate.usage);
      }
    } catch {
      // fallback to calculated bytes
    }
  }

  const rawPercent = quotaBytes > 0 ? (totalUsedBytes / quotaBytes) * 100 : 0;
  const percentUsed = totalUsedBytes > 0 ? Math.min(100, Math.max(0.4, rawPercent)) : 0;

  return {
    totalUsedBytes,
    quotaBytes,
    chatBytes,
    memoryBytes,
    customCharBytes,
    settingsBytes,
    percentUsed,
    isDynamicQuota,
    formattedUsed: formatStorageBytes(totalUsedBytes),
    formattedQuota: formatStorageBytes(quotaBytes),
    formattedChat: formatStorageBytes(chatBytes),
    formattedMemory: formatStorageBytes(memoryBytes),
    formattedCustomChar: formatStorageBytes(customCharBytes),
    formattedSettings: formatStorageBytes(settingsBytes),
  };
}
