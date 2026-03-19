import { db, importDatabase } from "../db.js";
import { cloudConfig, supabase } from "./supabase.js";

const SNAPSHOT_TABLE = "study_snapshots";
const APP_KEY = "study-system";
const TABLES = [
  "config",
  "subjects",
  "topics",
  "cards",
  "reviewLogs",
  "sessions",
  "lessons",
  "dailyStats",
  "exams",
];
const LAST_SYNC_KEY = "study_cloud_last_sync";

let hooksInstalled = false;
let suspendSync = false;
let syncTimer = null;
let syncing = false;

async function collectSnapshot() {
  const tables = {};

  for (const tableName of TABLES) {
    tables[tableName] = await db[tableName].toArray();
  }

  return {
    version: 1,
    app: APP_KEY,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function getCloudStatus() {
  let lastSyncAt = null;
  try {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      lastSyncAt = parsed.at;
    }
  } catch {
    /* ignore */
  }

  return {
    enabled: cloudConfig.enabled,
    configured: cloudConfig.enabled,
    ownerId: cloudConfig.ownerId,
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    syncing,
    lastSyncAt,
  };
}

export function setCloudSyncSuspended(value) {
  suspendSync = Boolean(value);
}

export async function syncNow(reason = "manual") {
  if (!cloudConfig.enabled || !supabase || suspendSync)
    return { synced: false, reason: "disabled" };
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return { synced: false, reason: "offline" };
  if (syncing) return { synced: false, reason: "in_progress" };

  syncing = true;
  try {
    const snapshot = await collectSnapshot();
    const payload = {
      owner_id: cloudConfig.ownerId,
      app: APP_KEY,
      payload: snapshot,
      reason,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(SNAPSHOT_TABLE).upsert(payload, {
      onConflict: "owner_id,app",
    });

    if (error) throw error;
    try {
      localStorage.setItem(
        LAST_SYNC_KEY,
        JSON.stringify({ at: new Date().toISOString(), reason }),
      );
    } catch {
      /* ignore */
    }
    return { synced: true };
  } finally {
    syncing = false;
  }
}

export function scheduleCloudSync(reason = "change", delayMs = 1800) {
  if (!cloudConfig.enabled || suspendSync) return;

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    syncNow(reason).catch((error) => {
      console.warn("Cloud sync failed:", error);
    });
  }, delayMs);
}

async function hasLocalData() {
  const [subjectsCount, sessionsCount, cardsCount] = await Promise.all([
    db.subjects.count(),
    db.sessions.count(),
    db.cards.count(),
  ]);
  return subjectsCount > 0 || sessionsCount > 0 || cardsCount > 0;
}

export async function restoreFromCloudIfNeeded({ force = false } = {}) {
  if (!cloudConfig.enabled || !supabase)
    return { restored: false, reason: "disabled" };

  const shouldSkip = !force && (await hasLocalData());
  if (shouldSkip) return { restored: false, reason: "local_data_exists" };

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("payload,updated_at")
    .eq("owner_id", cloudConfig.ownerId)
    .eq("app", APP_KEY)
    .maybeSingle();

  if (error) {
    return { restored: false, reason: "fetch_error", error };
  }
  if (!data?.payload?.tables) {
    return { restored: false, reason: "no_snapshot" };
  }

  try {
    setCloudSyncSuspended(true);
    await importDatabase(data.payload);
    return { restored: true, updatedAt: data.updated_at };
  } finally {
    setCloudSyncSuspended(false);
  }
}

function installTableHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  const syncTables = [
    "config",
    "subjects",
    "topics",
    "cards",
    "reviewLogs",
    "sessions",
    "lessons",
    "dailyStats",
    "exams",
  ];

  for (const tableName of syncTables) {
    const table = db.table(tableName);
    table.hook("creating", () => {
      scheduleCloudSync(`${tableName}:create`);
    });
    table.hook("updating", () => {
      scheduleCloudSync(`${tableName}:update`);
    });
    table.hook("deleting", () => {
      scheduleCloudSync(`${tableName}:delete`);
    });
  }
}

export async function setupCloudSync() {
  installTableHooks();

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      scheduleCloudSync("back_online", 250);
    });
  }
}
