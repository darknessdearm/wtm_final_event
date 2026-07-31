// ---------------------------------------------------------------------------
// Data access layer — configuration, schema mapping, and the build-time roster.
//
// This module is imported by the *server* component that renders the page, so
// it deliberately does NOT pull in the Firebase SDK. Everything that actually
// talks to Realtime Database lives in lib/firebaseClient.ts and only ever runs
// in the browser.
//
// ------------------------------- NAMESPACE ---------------------------------
// The database instance is shared with another app, which owns the top-level
// `/characters` and `/itemPool` nodes and stores a different schema there
// (map areas, collected items, remaining quantities). This site does not read
// or write either of them. It keeps entirely to its own subtree:
//
//   final_event/
//     characters/<key>  { name, role, status, isNpc, createdAt }
//     items/<itemId>    { id, name, description, imgUrl, isOnlyOne, ... }
//
// Seed or re-seed that subtree with `node scripts/seed-final-event.mjs`.
//
// ------------------------------ STATIC EXPORT ------------------------------
// `output: 'export'` renders the page at build time, so a server-side read here
// would bake in a snapshot that never updates. Instead getCharacters() returns
// the bundled roster — which is also what the seed script wrote — so the static
// HTML is correct and complete, and the client then subscribes with onValue()
// and takes over live. See lib/firebaseClient.ts.
// ---------------------------------------------------------------------------

import {
  getMockCharacters,
  type Character,
  type CharacterStatus,
} from './data';
import { normalizeImgUrl, type Item } from './items';

/** Every path this site touches hangs off here. Nothing above it is ours. */
export const FINAL_EVENT_ROOT = 'final_event';
export const CHARACTERS_PATH = `${FINAL_EVENT_ROOT}/characters`;
export const ITEMS_PATH = `${FINAL_EVENT_ROOT}/items`;

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Whether there is enough config to reach a database. When this is false every
 * live feature quietly stays on the bundled data instead of throwing — a build
 * without secrets (a fork, a preview, a contributor with no .env) still
 * produces a working site.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

/** Role given to entries that don't carry one — every seeded character has it. */
export const DEFAULT_ROLE = 'ตัวประกอบฉาก';

const VALID_STATUSES: CharacterStatus[] = ['alive', 'dead', 'lost'];

function toStatus(raw: unknown): CharacterStatus {
  return VALID_STATUSES.includes(raw as CharacterStatus)
    ? (raw as CharacterStatus)
    : 'alive';
}

/**
 * Map one raw `final_event/characters/<key>` record onto the UI's Character.
 *
 * Records are hand-editable in the Firebase console, so nothing is trusted:
 * a missing status falls back to alive, a missing role to the default, and an
 * entry with no usable name is dropped by returning null rather than rendering
 * a blank line in the credits roll.
 */
export function toCharacter(key: string, raw: unknown): Character | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) return null;

  return {
    id: key,
    name,
    role: typeof record.role === 'string' ? record.role : DEFAULT_ROLE,
    status: toStatus(record.status),
    isNpc: record.isNpc === true,
  };
}

/** Map a whole `final_event/characters` snapshot, preserving key order. */
export function toCharacters(value: unknown): Character[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([key, raw]) => toCharacter(key, raw))
    .filter((c): c is Character => c !== null);
}

/**
 * Map one raw `final_event/items/<id>` record onto the UI's Item.
 *
 * imgUrl is stored in the database exactly as itemsData.json authors it
 * ("public\\assets\\item\\01.png") and normalized here, so the deploy base path
 * is applied in one place for both the bundled and the live pool.
 */
export function toItem(key: string, raw: unknown): Item | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const imgUrl = typeof record.imgUrl === 'string' ? record.imgUrl : '';
  if (!name || !imgUrl) return null;

  return {
    id: typeof record.id === 'string' ? record.id : key,
    name,
    description:
      typeof record.description === 'string' ? record.description : '',
    imgUrl: normalizeImgUrl(imgUrl),
    isOnlyOne: record.isOnlyOne === true,
    ishidden: record.ishidden === true,
    isLocked: record.isLocked === true,
  };
}

/** Map a whole `final_event/items` snapshot. */
export function toItems(value: unknown): Item[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([key, raw]) => toItem(key, raw))
    .filter((i): i is Item => i !== null);
}

/**
 * The roster baked into the static export.
 *
 * This is the same list the seed script wrote to `final_event/characters`, in
 * the same order, so the server-rendered HTML matches the first live snapshot
 * and the credits roll doesn't visibly reshuffle on hydration.
 */
export async function getCharacters(): Promise<Character[]> {
  return getMockCharacters();
}
