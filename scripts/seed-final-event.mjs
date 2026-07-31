#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Seed the `final_event/` subtree of Realtime Database.
//
// The database instance is shared with another app that owns the top-level
// `/characters` and `/itemPool` nodes. This script never reads or writes either
// of them — it only ever addresses paths under `final_event/`.
//
//   node scripts/seed-final-event.mjs --dry-run   # print what would be written
//   node scripts/seed-final-event.mjs             # write only missing nodes
//   node scripts/seed-final-event.mjs --force     # replace existing nodes
//
// Without --force the script refuses to touch a node that already has data.
// With it, the seeded NPCs (keys c000, c001, …) are replaced while every player
// submission (a Firebase push ID) is read back and carried across, so re-seeding
// never deletes a name someone entered through the form.
//
// Requires Node >= 22.18 (imports lib/data.ts directly via type stripping) and
// NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env.local or .env.
// ---------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const FORCE = args.has('--force');

/** Minimal .env reader — .env.local wins, matching Next.js precedence. */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue; // real env vars win over both files
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadEnv();

const DATABASE_URL = (
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || ''
).replace(/\/$/, '');

if (!DATABASE_URL) {
  console.error(
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set. Copy .env.example to\n' +
      '.env.local and fill it in from the Firebase console.',
  );
  process.exit(1);
}

// --- Build the payload -----------------------------------------------------

// pathToFileURL, not the bare path: on Windows an absolute path like
// "E:\..." is read as a URL scheme by the ESM loader and rejected.
const { getMockCharacters } = await import(
  pathToFileURL(resolve(ROOT, 'lib/data.ts')).href
);
const itemsData = JSON.parse(
  readFileSync(resolve(ROOT, 'lib/itemsData.json'), 'utf8'),
);

// Keys are zero-padded so Realtime Database's lexicographic child order
// reproduces the roster's shuffle exactly. That keeps the first live snapshot
// identical to the statically exported HTML, so the credits roll doesn't
// visibly reorder on hydration. Push IDs from later submissions begin with "-",
// which sorts ahead of "c", so new names land at the top of the roll.
const characters = Object.fromEntries(
  getMockCharacters().map((character, index) => [
    `c${String(index).padStart(3, '0')}`,
    {
      name: character.name,
      role: character.role,
      status: character.status,
      isNpc: character.isNpc,
    },
  ]),
);

// imgUrl is stored exactly as authored ("public\\assets\\item\\01.png"); the
// app normalizes it on read so the deploy base path is applied in one place.
const items = Object.fromEntries(itemsData.map((item) => [item.id, item]));

/** Seeded NPC keys are c000, c001, …; players arrive with Firebase push IDs. */
const SEEDED_KEY = /^c\d+$/;

const NODES = [
  {
    path: 'final_event/characters',
    value: characters,
    // A re-seed replaces the NPC half of the roster only. Player submissions
    // are carried across, so --force can't quietly delete the names people
    // entered through the form.
    preservePlayers: true,
  },
  { path: 'final_event/items', value: items },
];

// --- Write -----------------------------------------------------------------

async function readNode(path, { shallow = false } = {}) {
  const query = shallow ? '?shallow=true' : '';
  const response = await fetch(`${DATABASE_URL}/${path}.json${query}`);
  if (!response.ok) {
    throw new Error(
      `Read of ${path} failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

async function nodeHasData(path) {
  return (await readNode(path, { shallow: true })) !== null;
}

/** The player-submitted entries currently stored at `path`, keyed as found. */
async function readPlayerEntries(path) {
  const existing = (await readNode(path)) ?? {};
  return Object.fromEntries(
    Object.entries(existing).filter(([key]) => !SEEDED_KEY.test(key)),
  );
}

async function put(path, value) {
  const response = await fetch(`${DATABASE_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    throw new Error(
      `Write to ${path} failed: ${response.status} ${await response.text()}`,
    );
  }
}

console.log(`Database: ${DATABASE_URL}`);
console.log(`Mode:     ${DRY_RUN ? 'dry run' : FORCE ? 'force' : 'fill gaps'}\n`);

let wrote = 0;
for (const { path, value, preservePlayers } of NODES) {
  const occupied = await nodeHasData(path);

  if (occupied && !FORCE) {
    console.log(`skip   ${path} — already has data (use --force to replace)`);
    continue;
  }

  const players =
    occupied && preservePlayers ? await readPlayerEntries(path) : {};
  const playerCount = Object.keys(players).length;
  const payload = { ...value, ...players };
  const detail =
    `${Object.keys(value).length} seeded` +
    (preservePlayers ? `, ${playerCount} player entries kept` : '');

  if (DRY_RUN) {
    console.log(`would ${occupied ? 'REPLACE' : 'write'} ${path} — ${detail}`);
    continue;
  }

  await put(path, payload);
  wrote++;
  console.log(`${occupied ? 'replaced' : 'wrote'}   ${path} — ${detail}`);
}

if (!DRY_RUN && wrote > 0) {
  console.log('\nDone. Reload the site — the roster now reads from Firebase.');
}
