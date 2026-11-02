import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface OfflineOutcomePayload {
  idempotencyKey: string;
  loanId: string;
  outcomeType: "PAID" | "PROMISE_TO_PAY" | "NOT_REACHABLE" | "DISPUTE";
  amountCollected?: number | null;
  paymentMode?: string | null;
  receiptNumber?: string | null;
  promisedAmount?: number | null;
  promiseDate?: string | null;
  followUpDate?: string | null;
  disputeReason?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  clientRecordedAt: string; // ISO string
}

export interface SyncQueueItem {
  idempotencyKey: string;
  payload: OfflineOutcomePayload;
  status: "SAVED_OFFLINE" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
  retryCount: number;
  errorMessage?: string;
  timestamp: string;
}

export interface CachedLoanItem {
  id: string;
  borrowerName: string;
  businessType: string;
  phone: string;
  address: string;
  pincode: string;
  outstandingAmount: number;
  dpd: number;
  priorityScore: number;
  priorityCategory: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityReasons: string[];
  promiseStatus?: string;
  promiseDate?: string;
  lastCachedAt: string;
}

interface CollectIQOfflineDB extends DBSchema {
  loans: {
    key: string;
    value: CachedLoanItem;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { "by-status": string };
  };
}

const DB_NAME = "collectiq-offline-store";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CollectIQOfflineDB>> | null = null;

export function getOfflineDB() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<CollectIQOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("loans")) {
          db.createObjectStore("loans", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const queueStore = db.createObjectStore("syncQueue", {
            keyPath: "idempotencyKey",
          });
          queueStore.createIndex("by-status", "status");
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Cache assigned loans for offline viewing
 */
export async function cacheAssignedLoans(loans: CachedLoanItem[]) {
  const db = await getOfflineDB();
  if (!db) return;
  const tx = db.transaction("loans", "readwrite");
  for (const loan of loans) {
    await tx.store.put({
      ...loan,
      lastCachedAt: new Date().toISOString(),
    });
  }
  await tx.done;
}

/**
 * Get all cached loans
 */
export async function getCachedLoans(): Promise<CachedLoanItem[]> {
  const db = await getOfflineDB();
  if (!db) return [];
  return db.getAll("loans");
}

/**
 * Enqueue an outcome while offline (or online for immediate queue processing)
 */
export async function enqueueOfflineOutcome(
  payload: OfflineOutcomePayload
): Promise<SyncQueueItem> {
  const db = await getOfflineDB();
  const queueItem: SyncQueueItem = {
    idempotencyKey: payload.idempotencyKey,
    payload,
    status: "SAVED_OFFLINE",
    retryCount: 0,
    timestamp: new Date().toISOString(),
  };

  if (db) {
    await db.put("syncQueue", queueItem);
  }
  return queueItem;
}

/**
 * Retrieve all items in the sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getOfflineDB();
  if (!db) return [];
  return db.getAll("syncQueue");
}

/**
 * Update queue item status
 */
export async function updateQueueItemStatus(
  idempotencyKey: string,
  status: SyncQueueItem["status"],
  errorMessage?: string
) {
  const db = await getOfflineDB();
  if (!db) return;
  const item = await db.get("syncQueue", idempotencyKey);
  if (item) {
    item.status = status;
    if (errorMessage) item.errorMessage = errorMessage;
    if (status === "SYNCING") item.retryCount++;
    await db.put("syncQueue", item);
  }
}

/**
 * Flush and sync all pending items to the server
 */
export async function flushSyncQueue(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const db = await getOfflineDB();
  if (!db) return { syncedCount: 0, failedCount: 0 };

  const all = await db.getAll("syncQueue");
  const pending = all.filter(
    (item) => item.status === "SAVED_OFFLINE" || item.status === "SYNC_FAILED"
  );

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of pending) {
    try {
      await updateQueueItemStatus(item.idempotencyKey, "SYNCING");

      const res = await fetch("/api/officer/outcomes/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        await updateQueueItemStatus(item.idempotencyKey, "SYNCED");
        syncedCount++;
      } else {
        const errData = await res.json().catch(() => ({}));
        await updateQueueItemStatus(
          item.idempotencyKey,
          "SYNC_FAILED",
          errData.error || `HTTP ${res.status}`
        );
        failedCount++;
      }
    } catch (err: unknown) {
      await updateQueueItemStatus(
        item.idempotencyKey,
        "SYNC_FAILED",
        err instanceof Error ? err.message : "Network unreachable"
      );
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}
