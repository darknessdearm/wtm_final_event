// ---------------------------------------------------------------------------
// Domain types + the seed roster.
//
// This roster is no longer a placeholder: scripts/seed-final-event.mjs wrote it
// verbatim to `final_event/characters`, so the database holds exactly these
// entries in exactly this order. It stays in the bundle for two reasons —
// it renders the static export (which cannot read the database at build time),
// and it is the fallback whenever live data is unavailable.
//
// Regenerating it here therefore drifts from the database until the seed script
// is re-run with --force. See lib/firebase.ts.
// ---------------------------------------------------------------------------

/**
 * รอด = alive, ตาย = dead, สาบสูญ = lost.
 *
 * Players use all three; seeded NPCs only ever carry alive or dead.
 */
export type CharacterStatus = "alive" | "dead" | "lost";

export interface Character {
  id: string;
  /** ชื่อตัวละคร */
  name: string;
  /** บทบาท — see DEFAULT_ROLE. */
  role: string;
  status: CharacterStatus;
  /**
   * NPCs are dimmed in the roster, and a *dead* NPC has their name struck
   * through — "Npc - Alive if Dead" in the legend. NPC-ness is independent of
   * aliveness, so it is a flag rather than a fourth status.
   *
   * This is also what separates the two ways into the roster: every seeded
   * character is an NPC, and everyone who submits the form is a player.
   */
  isNpc: boolean;
}

// Countdown window (Thailand time, UTC+7). The header timer counts down to
// EVENT_DEADLINE; before EVENT_START it shows the full window, and once past
// EVENT_DEADLINE it shows all zeros (see computeCountdown in lib/countdown.ts).
// Change these two lines to reschedule. If you meant the *end* of Aug 22 rather
// than its first midnight, use '2026-08-23T00:00:00+07:00' for the deadline.
export const EVENT_START = "2026-08-01T00:00:00+07:00";
export const EVENT_DEADLINE = "2026-08-22T00:00:00+07:00";

/**
 * How much time the countdown *displays* across the whole campaign.
 *
 * The event really runs 21 days, but the banner counts down from 3 — so the
 * timer advances at 3/21 of a wall clock, roughly seven times slower, and still
 * reaches zero exactly at EVENT_DEADLINE. Purely presentational: EVENT_START
 * and EVENT_DEADLINE are unchanged, and the decay scene still tracks real
 * progress through the campaign (see lib/decay.ts).
 *
 * Set to null to run the countdown in real time.
 */
export const COUNTDOWN_DISPLAY_DAYS: number | null = 3;

export const EVENT_TITLE = "WTM Final Event";
export const EVENT_DESCRIPTION = "สุ่มสถานการณ์ประจำสัปดาห์ · Week 3";
/** Small subtitle under the countdown showing the event window. */
export const EVENT_WINDOW_LABEL = "Event Duration: August 01 - 21, 2026";

/**
 * บทบาท carried by every roster entry, seeded and submitted alike.
 *
 * Defined once here and imported everywhere — lib/firebase.ts re-exports it for
 * the write path — so changing the wording is a one-line edit rather than a
 * hunt through literals that drift apart. Never rendered: the credits roll
 * shows names only, so this is stored data.
 *
 * Changing it does NOT rewrite rows already in the database; re-seed with
 * `npm run seed -- --force` to bring the stored roster in line.
 */
export const DEFAULT_ROLE = "ผู้เล่น";

/** Short Thai word for each status — used for the status <option> labels in SubmitBar. */
export const STATUS_SHORT_LABEL: Record<CharacterStatus, string> = {
  alive: "Alive",
  dead: "Dead",
  lost: "Missing",
};

// The four hand-authored characters. These stay in the roster verbatim; the
// rest of the credits list is generated from the name pools below.
//
// Like every seeded entry they are NPCs, so Jeffrey McPine — the one dead
// name here — renders struck through.
const FEATURED_CHARACTERS: Character[] = [
  {
    id: "c01",
    name: "Jeffrey McPine",
    role: DEFAULT_ROLE,
    status: "dead",
    isNpc: true,
  },
  {
    id: "c02",
    name: "Charlie Kiddington",
    role: DEFAULT_ROLE,
    status: "alive",
    isNpc: true,
  },
  {
    id: "c03",
    name: "Felico Wise",
    role: DEFAULT_ROLE,
    status: "alive",
    isNpc: true,
  },
  {
    id: "c04",
    name: "RedWood [sk'aWk'os]",
    role: DEFAULT_ROLE,
    status: "alive",
    isNpc: true,
  },
];

// Name pools the generator mixes together. The featured names' own first/last
// names are folded in so the whole roster reads as one consistent cast.
const FIRST_NAMES = [
  "Ethan",
  "Olivia",
  "Marcus",
  "Liam",
  "Chloe",
  "Noah",
  "Ava",
  "Mason",
  "Isla",
  "Emma",
  "Lucas",
  "Sophia",
  "Owen",
  "Mia",
  "Caleb",
  "Grace",
  "Julian",
  "Hazel",
  "Nathan",
  "Ruby",
  "Elias",
  "Nora",
  "Adrian",
  "Violet",
  "Silas",
  "Clara",
  "Felix",
  "Iris",
  "Theo",
  "Alice",
  "Milo",
  "Elena",
  "Jasper",
  "Freya",
  "Hugo",
  "Stella",
  "Leo",
  "Cora",
  "Rowan",
  "Maya",
  "Dorian",
  "Lena",
  "Simon",
  "Vera",
  "Aaron",
  "Willa",
];

const LAST_NAMES = [
  "Cole",
  "Reed",
  "Bell",
  "Foster",
  "Grant",
  "Blake",
  "Sinclair",
  "Hale",
  "Monroe",
  "Vance",
  "Hart",
  "Frost",
  "Wells",
  "Quinn",
  "Marsh",
  "Rhodes",
  "Boyd",
  "Lang",
  "Pierce",
  "Cross",
  "Sloan",
  "Weaver",
  "Nash",
  "Fields",
  "Dalton",
  "Byrne",
  "Rourke",
  "Ellis",
  "Payne",
  "Shaw",
  "Vaughn",
  "Mercer",
  "Holloway",
  "Ashford",
  "Calloway",
  "Winters",
  "Thorne",
  "Beckett",
  "Sterling",
  "Abbott",
];

// Seeded PRNG (mulberry32) so the generated roster is identical on every build.
// This keeps the static export deterministic — the server renders the list once
// and the client component just animates it, so there's no hydration mismatch.
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher–Yates shuffle driven by the supplied PRNG. */
function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Share of seeded NPCs that are dead, and therefore struck through in the roll.
 *
 * Seeded NPCs carry only alive/dead, so the roster's original alive:dead
 * balance of 42:38 becomes 38/(42+38) here — the same proportion with `lost`
 * folded away. Because every seeded entry is an NPC, this doubles as the share
 * of the credits roll that renders struck through.
 */
const NPC_DEAD_RATE = 0.475;

/**
 * Build `count` unique extra characters by mixing the first/last name pools.
 *
 * Every generated entry is an NPC with a status of alive or dead — `lost`
 * (Missing) is reserved for players, who only enter the roster by submitting
 * the form. See the legend in components/StatusLegend.tsx.
 */
function generateCharacters(
  count: number,
  seed: number,
  taken: Set<string>,
): Character[] {
  const rand = mulberry32(seed);
  const seen = new Set(taken);
  const out: Character[] = [];
  let n = 0;
  // Cap the loop so a saturated name pool can never spin forever.
  for (let guard = 0; out.length < count && guard < count * 50; guard++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const name = `${first} ${last}`;
    if (seen.has(name)) continue;
    seen.add(name);

    const status: CharacterStatus = rand() < NPC_DEAD_RATE ? "dead" : "alive";
    out.push({
      id: `g${String(++n).padStart(3, "0")}`,
      name,
      role: DEFAULT_ROLE,
      status,
      isNpc: true,
    });
  }
  return out;
}

// The full roster: the four featured characters plus 111 generated ones (115
// total, > 100 as required), all shuffled together so alive and dead names are
// interleaved for the end-credits roll.
const ROSTER: Character[] = shuffle(
  [
    ...FEATURED_CHARACTERS,
    ...generateCharacters(
      111,
      0xc0ffee,
      new Set(FEATURED_CHARACTERS.map((c) => c.name)),
    ),
  ],
  mulberry32(0x5eed),
);

/** The mock source of truth. Swapped for Firebase in lib/firebase.ts. */
export function getMockCharacters(): Character[] {
  return ROSTER;
}
