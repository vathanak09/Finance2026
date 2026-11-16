import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { get, ref, update } from 'firebase/database';
import { firestoreDb, rtdb } from '../services/firebase';

export interface MigrationCounts {
  transactions: number;
  categories: number;
  budgets: number;
  accounts: number;
  activity_logs: number;
  settings: number;
}

/**
 * Recursively strips `undefined` values and converts Firestore Timestamps to ms numbers
 * so payloads are safe for Firebase Realtime Database `set` / `update`.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === 'object') {
    const maybeTs = value as { toMillis?: () => number };
    if (typeof maybeTs.toMillis === 'function') {
      return maybeTs.toMillis() as unknown as T;
    }

    if (Array.isArray(value)) {
      return value
        .filter((item) => item !== undefined)
        .map((item) => stripUndefined(item)) as unknown as T;
    }

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean as T;
  }

  return value;
}

/**
 * Sanitizes a key to be valid in Firebase Realtime Database (no . $ # [ ] /).
 */
function sanitizeRtdbKey(key: string): string {
  return key.replace(/[.$#[\]/]/g, '_');
}

/**
 * One-time idempotent migration from Cloud Firestore to Firebase Realtime Database.
 * Preserves exact document IDs and skips documents already present in RTDB.
 */
export async function migrateFirestoreToRtdb(force = false): Promise<{
  skipped: boolean;
  counts: MigrationCounts;
}> {
  const counts: MigrationCounts = {
    transactions: 0,
    categories: 0,
    budgets: 0,
    accounts: 0,
    activity_logs: 0,
    settings: 0,
  };

  if (!force) {
    const metaSnap = await get(ref(rtdb, '_meta/firestore_migrated'));
    if (metaSnap.exists()) {
      return { skipped: true, counts: metaSnap.val()?.counts || counts };
    }
  }

  const collections = ['transactions', 'categories', 'budgets', 'accounts', 'activity_logs'] as const;

  const [txSnap, catSnap, bgSnap, accSnap, logSnap, sheetSnap, rtdbExistingSnap] = await Promise.all([
    getDocs(collection(firestoreDb, 'transactions')),
    getDocs(collection(firestoreDb, 'categories')),
    getDocs(collection(firestoreDb, 'budgets')),
    getDocs(collection(firestoreDb, 'accounts')),
    getDocs(collection(firestoreDb, 'activity_logs')),
    getDoc(doc(firestoreDb, 'settings', 'google_sheet_sync')),
    get(ref(rtdb)),
  ]);

  const snapshots = {
    transactions: txSnap,
    categories: catSnap,
    budgets: bgSnap,
    accounts: accSnap,
    activity_logs: logSnap,
  };

  const patch: Record<string, unknown> = {};

  for (const colName of collections) {
    const fsSnap = snapshots[colName];
    fsSnap.docs.forEach((docSnap) => {
      const safeId = sanitizeRtdbKey(docSnap.id);
      const alreadyInRtdb = rtdbExistingSnap.child(`${colName}/${safeId}`).exists();
      if (!alreadyInRtdb) {
        patch[`${colName}/${safeId}`] = stripUndefined(docSnap.data());
        counts[colName] += 1;
      }
    });
  }

  if (sheetSnap.exists() && !rtdbExistingSnap.child('settings/google_sheet_sync').exists()) {
    patch['settings/google_sheet_sync'] = stripUndefined(sheetSnap.data());
    counts.settings = 1;
  }

  patch['_meta/firestore_migrated'] = {
    completedAt: Date.now(),
    counts,
  };

  await update(ref(rtdb), patch);
  return { skipped: false, counts };
}
