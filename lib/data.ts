// ---------------------------------------------------------------------------
// Domain types + mock data.
//
// Everything here is placeholder content that mirrors the shape we expect from
// Firebase Realtime Database. When the DB is wired up (see lib/firebase.ts) the
// only thing that changes is *where* `getCharacters()` reads from — the rest of
// the UI keeps consuming the same `Character` shape.
// ---------------------------------------------------------------------------

/** รอด = alive, ตาย = dead, สาบสูญ = lost. */
export type CharacterStatus = "alive" | "dead" | "lost";

export interface Character {
  id: string;
  /** ชื่อตัวละคร */
  name: string;
  /** บทบาท เช่น ตัวประกอบฉาก */
  role: string;
  status: CharacterStatus;
  /**
   * NPCs are dimmed in the roster, and a *dead* NPC has their name redacted
   * entirely — "Npc - Alive if Dead, will censor" in the legend. NPC-ness is
   * independent of aliveness, so it is a flag rather than a fourth status.
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

export const EVENT_TITLE = "WTM Final Event";
export const EVENT_DESCRIPTION = "สุ่มสถานการณ์ประจำสัปดาห์ · Week 3";
/** Small subtitle under the countdown showing the event window. */
export const EVENT_WINDOW_LABEL = "Event Duration: August 01 - 21, 2026";

/** Short Thai word for each status — used for the status <option> labels in SubmitBar. */
export const STATUS_SHORT_LABEL: Record<CharacterStatus, string> = {
  alive: "Alive",
  dead: "Dead",
  lost: "Lost",
};

// The nine hand-authored characters. These stay in the roster verbatim; the
// rest of the credits list is generated from the name pools below.
const FEATURED_CHARACTERS: Character[] = [
  {
    id: "c01",
    name: "Jeffrey McPine",
    role: "ตัวประกอบฉาก",
    status: "dead",
    isNpc: false,
  },
  {
    id: "c02",
    name: "Charlie Kiddington",
    role: "ตัวประกอบฉาก",
    status: "alive",
    isNpc: false,
  },
  {
    id: "c03",
    name: "Felico Wise",
    role: "ตัวประกอบฉาก",
    status: "alive",
    isNpc: false,
  },
  {
    id: "c04",
    name: "RedWood [sk'aWk'os]",
    role: "ตัวประกอบฉาก",
    status: "alive",
    isNpc: false,
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
 * Build `count` unique extra characters by mixing the first/last name pools.
 * Statuses are weighted ~ alive / dead / lost so the roll feels like the
 * aftermath of a survival scenario rather than an even split.
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

    const r = rand();
    const status: CharacterStatus =
      r < 0.42 ? "alive" : r < 0.8 ? "dead" : "lost";
    // Roughly a quarter of the generated cast are NPCs; the dead ones among
    // them render as redaction bars.
    const isNpc = rand() < 0.25;
    out.push({
      id: `g${String(++n).padStart(3, "0")}`,
      name,
      role: "ตัวประกอบฉาก",
      status,
      isNpc,
    });
  }
  return out;
}

// The full roster: the nine featured characters plus 111 generated ones (120
// total, > 100 as required), all shuffled together so alive / dead / lost
// are interleaved for the end-credits roll.
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
