/**
 * IndexedDB wrapper for offline data persistence.
 * Stores queued operations that failed due to connectivity issues.
 */

const DB_NAME = 'garden-offline';
const DB_VERSION = 1;

export interface QueuedOperation {
  id: string;
  type: 'pos_sale' | 'tablet_order';
  payload: any;
  createdAt: string;
  retries: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('cache')) {
        const cache = db.createObjectStore('cache', { keyPath: 'key' });
        cache.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---- Queue Operations ----

export async function enqueueOperation(op: QueuedOperation): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').put(op);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedOperations(type?: string): Promise<QueuedOperation[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const request = type
      ? store.index('type').getAll(type)
      : store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const request = tx.objectStore('queue').index('status').count('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateOperation(id: string, updates: Partial<QueuedOperation>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    const store = tx.objectStore('queue');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, ...updates });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeOperation(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- Cache Operations (for products/categories) ----

export interface CacheEntry {
  key: string;
  type: string;
  data: any;
  updatedAt: string;
}

export async function setCache(entry: CacheEntry): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCache(key: string): Promise<CacheEntry | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readonly');
    const req = tx.objectStore('cache').get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
