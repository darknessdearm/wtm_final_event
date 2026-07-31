// ---------------------------------------------------------------------------
// Realtime Database access — browser only.
//
// Every function here is called from a useEffect or an event handler, never
// during render. That matters twice over: `output: 'export'` prerenders client
// components on the server at build time (so nothing may connect at module
// scope), and a live subscription must not perturb the static HTML.
//
// The SDK is imported statically but initialized lazily — importing the module
// has no side effects, so a prerender that merely touches this file stays inert.
//
// Reads and writes are confined to the `final_event/` subtree; see the
// namespace note in lib/firebase.ts for why.
// ---------------------------------------------------------------------------

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  get,
  getDatabase,
  onValue,
  push,
  ref,
  serverTimestamp,
  update,
  type Database,
} from 'firebase/database';
import {
  CHARACTERS_PATH,
  ITEMS_PATH,
  findPlayerKey,
  firebaseConfig,
  isFirebaseConfigured,
  toCharacters,
  toItems,
} from './firebase';
import { PLAYER_ROLE, type Character, type CharacterStatus } from './data';
import type { Item } from './items';

/** Detaches a listener. Safe to call more than once. */
export type Unsubscribe = () => void;

const NOOP_UNSUBSCRIBE: Unsubscribe = () => {};

let cachedDb: Database | null = null;

/**
 * The database handle, or null when the app isn't configured.
 *
 * Returning null rather than throwing is deliberate: a build without Firebase
 * env vars still deploys a working site that runs on the bundled data.
 */
function getDb(): Database | null {
  if (cachedDb) return cachedDb;
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return null;

  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
  cachedDb = getDatabase(app);
  return cachedDb;
}

/**
 * Subscribe to the live roster.
 *
 * `onData` fires with the full list on every change. Returns an unsubscribe;
 * when Firebase isn't configured it is a no-op and `onData` never fires, so the
 * caller simply keeps the roster it was rendered with.
 */
export function subscribeToCharacters(
  onData: (characters: Character[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getDb();
  if (!db) return NOOP_UNSUBSCRIBE;

  return onValue(
    ref(db, CHARACTERS_PATH),
    (snapshot) => onData(toCharacters(snapshot.val())),
    (error) => onError?.(error),
  );
}

/**
 * Subscribe to the live item pool used by the fate draw.
 *
 * Editing an item's text in the Firebase console updates the site without a
 * redeploy. An empty or unreadable pool leaves the caller on the bundled ITEMS.
 */
export function subscribeToItems(
  onData: (items: Item[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getDb();
  if (!db) return NOOP_UNSUBSCRIBE;

  return onValue(
    ref(db, ITEMS_PATH),
    (snapshot) => {
      const items = toItems(snapshot.val());
      if (items.length > 0) onData(items);
    },
    (error) => onError?.(error),
  );
}

/**
 * Record a submitted character.
 *
 * Submitting a name that is already on the roster updates that player's status
 * rather than adding a second line for them, so someone can correct themselves
 * — or die later in the event — without the roster filling up with duplicates.
 * A name not seen before is appended.
 *
 * Resolves without writing when Firebase isn't configured, which keeps the
 * submit bar working on the bundled data. Rejects on a real write failure —
 * SubmitBar surfaces that to the user.
 */
export async function submitCharacter(entry: {
  name: string;
  status: CharacterStatus;
}): Promise<void> {
  const db = getDb();
  if (!db) return;

  const charactersRef = ref(db, CHARACTERS_PATH);

  // Read-then-write rather than a query: matching is case-insensitive, which
  // Realtime Database can't express server-side, and the roster is small enough
  // that scanning it costs less than maintaining a normalized name index.
  const snapshot = await get(charactersRef);
  const existingKey = findPlayerKey(snapshot.val(), entry.name);

  if (existingKey) {
    // Only the status moves. The stored name keeps its original spelling, and
    // isNpc is left alone so this can never promote a player into the cast.
    await update(ref(db, `${CHARACTERS_PATH}/${existingKey}`), {
      status: entry.status,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await push(charactersRef, {
    name: entry.name,
    role: PLAYER_ROLE,
    status: entry.status,
    // Submissions come from the public form, so they are never NPCs and are
    // never struck through — see lib/censor.ts.
    isNpc: false,
    createdAt: serverTimestamp(),
  });
}

/** Whether live data is available at all; UI uses it to pick a fallback path. */
export function isLive(): boolean {
  return getDb() !== null;
}
