"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { getSyncQueue, flushSyncQueue, SyncQueueItem } from "@/lib/offline/db";

export function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const refreshQueue = async () => {
    try {
      const items = await getSyncQueue();
      setQueue(items);
    } catch {
      // IndexedDB not ready or error
    }
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshQueue();

    const interval = setInterval(refreshQueue, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const result = await flushSyncQueue();
      await refreshQueue();
      if (result.syncedCount > 0) {
        setLastSyncResult(`Synced ${result.syncedCount} offline record(s)`);
        setTimeout(() => setLastSyncResult(null), 4000);
      }
    } catch {
      // Sync failed
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = queue.filter(
    (q) => q.status === "SAVED_OFFLINE" || q.status === "SYNC_FAILED"
  ).length;

  return (
    <div className="flex items-center gap-2 text-xs">
      {!isOnline ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] font-medium">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline Mode</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-[#F59E0B] text-white rounded-full text-[10px]">
              {pendingCount} queued
            </span>
          )}
        </div>
      ) : pendingCount > 0 ? (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF3EF] text-[#176B4D] border border-[#CDE3D9] font-medium hover:bg-[#D5EADF] transition-all"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          <span>
            {isSyncing
              ? "Syncing records..."
              : `Sync ${pendingCount} offline event${pendingCount > 1 ? "s" : ""}`}
          </span>
        </button>
      ) : lastSyncResult ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{lastSyncResult}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-muted text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#15803D]" />
          <span>Connected</span>
        </div>
      )}
    </div>
  );
}
