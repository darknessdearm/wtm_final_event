# CRT Terminal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the WTM Final Event page to match the new VT323 CRT-terminal mockups, with a single `--decay` custom property continuously bleeding the palette from green to red as the campaign deadline approaches.

**Architecture:** One DOM tree. A pure `computeDecay()` maps wall-clock time to a 0…1 value that a small client component writes onto `<html>` as `--decay`; every themed color is a `color-mix()` between its scene1 and scene2 value, so the whole page interpolates from one number. Data modules (`items`, `damage`, `roll`, `censor`, `decay`, `countdown`) are pure and unit-tested; React components are thin shells over them.

**Tech Stack:** Next.js 14 (App Router, `output: 'export'`), React 18, TypeScript (strict), Tailwind CSS 3.4, vitest (added by Task 1), `next/font/google` for VT323 + Prompt.

**Spec:** `docs/superpowers/specs/2026-07-29-crt-terminal-redesign-design.md`

## Global Constraints

- **Branch:** all work happens on `redesign/crt-terminal` (already created and checked out).
- **Every commit message ends with this trailer**, preceded by a blank line:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Static export:** `output: 'export'` is non-negotiable. No server actions, no route handlers, no `next/image` optimizer, no runtime-only APIs at module scope.
- **No hydration mismatch:** nothing rendered on the server may depend on `Date.now()` or `Math.random()`. Both are allowed only inside `useEffect` or event handlers.
- **Base path:** every asset URL must be prefixed with `process.env.NEXT_PUBLIC_BASE_PATH || ''` (GitHub Pages project sites serve from `/<repo>`).
- **Thai text:** VT323 has no Thai glyphs. Any element that can contain Thai must resolve to the `font-term` stack (`VT323, Prompt, …`), never VT323 alone.
- **Tailwind color tokens are bare `var()` values** — never use opacity modifiers (`text-scene/50`) on them, that syntax breaks with CSS variable colors.
- **Item pool is all 26 items.** `isOnlyOne` / `ishidden` / `isLocked` are carried on the type but never filter.
- **TypeScript is strict.** `npx tsc --noEmit` must pass at the end of every task.
- **Exact copy strings** (used verbatim, do not paraphrase):
  - `SYSTEM LOG V.2.0.1 - May 13, 2001`
  - `#WTM_EVENT_05 : THE FINAL CHAPTER`
  - `Event Duration: August 01 - 21, 2026`
  - `What will happened with you?`
  - `Input you name here:`
  - `Result:`
  - `<Image of Item>`
  - `Survival List`
  - `Status`, `Alive`, `Dead`, `Lost`, `Npc - Alive if Dead, will censor`
  - `Add your name here:`, `status :`, `Enter to Submit`, `Enter`
  - Result sentence template: `< {name} > ได้รับ < {item} > โดยที่คุณจะมีโอกาส < {damage} >`

---

### Task 1: Test harness + decay math

Adds vitest and the pure function that drives the entire theme.

**Files:**

- Create: `vitest.config.ts`
- Create: `lib/decay.ts`
- Create: `lib/decay.test.ts`
- Modify: `package.json` (add `test` script + vitest devDependency)

**Interfaces:**

- Consumes: nothing.
- Produces: `computeDecay(now: number, start: number, deadline: number): number` — returns a value in `[0, 1]`.

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"` (after `"lint"`):

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create the vitest config**

Create `vitest.config.ts`. The alias mirrors the `@/*` path in `tsconfig.json`; without it the test files cannot import `@/lib/...`.

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `lib/decay.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeDecay } from "@/lib/decay";

const START = Date.UTC(2026, 7, 1);
const END = Date.UTC(2026, 7, 22);

describe("computeDecay", () => {
  it("is 0 before the campaign starts", () => {
    expect(computeDecay(START - 86_400_000, START, END)).toBe(0);
  });

  it("is 0 exactly at the start", () => {
    expect(computeDecay(START, START, END)).toBe(0);
  });

  it("is 0.5 at the midpoint", () => {
    expect(computeDecay((START + END) / 2, START, END)).toBeCloseTo(0.5, 10);
  });

  it("is 1 exactly at the deadline", () => {
    expect(computeDecay(END, START, END)).toBe(1);
  });

  it("is 1 after the deadline", () => {
    expect(computeDecay(END + 86_400_000, START, END)).toBe(1);
  });

  it("returns 1 when the window is inverted or empty", () => {
    expect(computeDecay(START, END, START)).toBe(1);
    expect(computeDecay(START, START, START)).toBe(1);
  });

  it("returns 0 for non-finite inputs rather than NaN", () => {
    expect(computeDecay(NaN, START, END)).toBe(0);
    expect(computeDecay(START, NaN, END)).toBe(0);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/decay"`.

- [ ] **Step 6: Write the implementation**

Create `lib/decay.ts`:

```ts
// ---------------------------------------------------------------------------
// Campaign decay.
//
// 0 = the campaign just opened (scene1, green), 1 = the deadline has arrived
// (scene2, red). Every themed colour in globals.css is a color-mix() driven by
// this single number, so the whole page interpolates from one value.
// ---------------------------------------------------------------------------

/**
 * Fraction of the campaign window that has elapsed, clamped to [0, 1].
 *
 * Returns 1 for an inverted or zero-length window (a misconfigured deadline
 * should read as "over", not as NaN), and 0 if any input is non-finite.
 */
export function computeDecay(
  now: number,
  start: number,
  deadline: number,
): number {
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(start) ||
    !Number.isFinite(deadline)
  ) {
    return 0;
  }
  if (deadline <= start) return 1;

  const elapsed = (now - start) / (deadline - start);
  if (elapsed < 0) return 0;
  if (elapsed > 1) return 1;
  return elapsed;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 7 tests in `lib/decay.test.ts`.

- [ ] **Step 8: Verify types still compile**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/decay.ts lib/decay.test.ts
git commit -m "feat: add vitest and computeDecay campaign-decay math

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Item data module

Normalizes the Windows-style image paths in `itemsData.json` into browser URLs.

**Files:**

- Create: `lib/items.ts`
- Create: `lib/items.test.ts`

**Interfaces:**

- Consumes: `lib/itemsData.json` (existing, 26 entries).
- Produces:
  - `interface Item { id, name, description, imgUrl, isOnlyOne, ishidden, isLocked }`
  - `normalizeImgUrl(raw: string, basePath?: string): string`
  - `ITEMS: Item[]` — all 26, `imgUrl` already normalized.

- [ ] **Step 1: Write the failing test**

Create `lib/items.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ITEMS, normalizeImgUrl } from "@/lib/items";

describe("normalizeImgUrl", () => {
  it("converts Windows separators to URL separators", () => {
    expect(normalizeImgUrl("public\\assets\\item\\01.png", "")).toBe(
      "/assets/item/01.png",
    );
  });

  it("strips the leading public/ segment", () => {
    expect(normalizeImgUrl("public/assets/item/26.png", "")).toBe(
      "/assets/item/26.png",
    );
  });

  it("prefixes the deploy base path", () => {
    expect(
      normalizeImgUrl("public\\assets\\item\\02.png", "/wtm_final_event"),
    ).toBe("/wtm_final_event/assets/item/02.png");
  });

  it("never produces a doubled slash", () => {
    expect(normalizeImgUrl("/public/assets/item/03.png", "")).not.toContain(
      "//",
    );
  });
});

describe("ITEMS", () => {
  it("exposes every item in the source file", () => {
    expect(ITEMS).toHaveLength(26);
  });

  it("normalizes every image path", () => {
    for (const item of ITEMS) {
      expect(item.imgUrl).toMatch(/\/assets\/item\/\d{2}\.png$/);
      expect(item.imgUrl).not.toContain("\\");
      expect(item.imgUrl).not.toContain("public/");
    }
  });

  it("keeps ids, names and descriptions intact", () => {
    for (const item of ITEMS) {
      expect(item.id).toMatch(/^item-\d+$/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/items"`.

- [ ] **Step 3: Write the implementation**

Create `lib/items.ts`:

```ts
// ---------------------------------------------------------------------------
// Item pool.
//
// itemsData.json is authored on Windows and stores repo-relative paths
// ("public\\assets\\item\\01.png"). The browser needs a URL rooted at the
// deployed base path instead, so every path is normalized once at module load.
// ---------------------------------------------------------------------------

import itemsData from "./itemsData.json";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export interface Item {
  id: string;
  /** ชื่อไอเทม */
  name: string;
  /** คำอธิบายไอเทม */
  description: string;
  /** Browser-ready URL (already base-path prefixed). */
  imgUrl: string;
  isOnlyOne: boolean;
  ishidden: boolean;
  isLocked: boolean;
}

/**
 * "public\\assets\\item\\01.png" -> "/assets/item/01.png" (plus base path).
 *
 * The flags on Item are deliberately NOT used to filter the pool — every one
 * of the 26 items is drawable. They are kept so a future change can gate them
 * without reshaping the data.
 */
export function normalizeImgUrl(
  raw: string,
  basePath: string = BASE_PATH,
): string {
  const path = raw
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^public\//, "");
  return `${basePath}/${path}`;
}

export const ITEMS: Item[] = (itemsData as Item[]).map((item) => ({
  ...item,
  imgUrl: normalizeImgUrl(item.imgUrl),
}));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all `lib/items.test.ts` and `lib/decay.test.ts` tests green.

- [ ] **Step 5: Verify types**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add lib/items.ts lib/items.test.ts
git commit -m "feat: add item pool with normalized image URLs

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Damage pool and the fate roll

**Files:**

- Create: `lib/damage.ts`
- Create: `lib/roll.ts`
- Create: `lib/roll.test.ts`

**Interfaces:**

- Consumes: `ITEMS`, `Item` from `@/lib/items`; `lib/damageData.json` (27 strings).
- Produces:
  - `DAMAGES: string[]`
  - `interface Fate { item: Item; damage: string }`
  - `rollFate(rand?: () => number): Fate` — `rand` defaults to `Math.random`; injectable purely so it can be tested deterministically.

- [ ] **Step 1: Write the failing test**

Create `lib/roll.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DAMAGES } from "@/lib/damage";
import { ITEMS } from "@/lib/items";
import { rollFate } from "@/lib/roll";

describe("DAMAGES", () => {
  it("exposes every injury in the source file", () => {
    expect(DAMAGES).toHaveLength(27);
    expect(DAMAGES[0]).toBe("ไม่ได้บาดเจ็บ");
  });
});

describe("rollFate", () => {
  it("returns the first entry when the generator yields 0", () => {
    const fate = rollFate(() => 0);
    expect(fate.item).toBe(ITEMS[0]);
    expect(fate.damage).toBe(DAMAGES[0]);
  });

  it("returns the last entry when the generator approaches 1", () => {
    const fate = rollFate(() => 0.999_999);
    expect(fate.item).toBe(ITEMS[ITEMS.length - 1]);
    expect(fate.damage).toBe(DAMAGES[DAMAGES.length - 1]);
  });

  it("never draws outside the pools", () => {
    for (let i = 0; i < 500; i++) {
      const fate = rollFate();
      expect(ITEMS).toContain(fate.item);
      expect(DAMAGES).toContain(fate.damage);
    }
  });

  it("draws item and damage independently", () => {
    // Alternating generator: item takes the 1st call, damage the 2nd.
    const values = [0, 0.999_999];
    let i = 0;
    const fate = rollFate(() => values[i++]);
    expect(fate.item).toBe(ITEMS[0]);
    expect(fate.damage).toBe(DAMAGES[DAMAGES.length - 1]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/damage"`.

- [ ] **Step 3: Write the damage module**

Create `lib/damage.ts`:

```ts
// ---------------------------------------------------------------------------
// Injury pool — the < อาการบาดเจ็บ > slot of the result sentence.
// ---------------------------------------------------------------------------

import damageData from "./damageData.json";

export const DAMAGES: string[] = damageData as string[];
```

- [ ] **Step 4: Write the roll module**

Create `lib/roll.ts`:

```ts
// ---------------------------------------------------------------------------
// The fate draw behind the "What will happened with you?" panel.
//
// Every Enter press re-rolls: the draw is independent of the name typed, so
// the same person can keep pulling different outcomes.
// ---------------------------------------------------------------------------

import { DAMAGES } from "./damage";
import { ITEMS, type Item } from "./items";

export interface Fate {
  item: Item;
  damage: string;
}

function pick<T>(pool: T[], rand: () => number): T {
  return pool[Math.floor(rand() * pool.length)];
}

/**
 * Draw one item and one injury, uniformly and independently.
 *
 * `rand` is injectable for tests only — production callers use the default.
 * Must never be called during render: it is non-deterministic and would break
 * the static export's hydration.
 */
export function rollFate(rand: () => number = Math.random): Fate {
  return {
    item: pick(ITEMS, rand),
    damage: pick(DAMAGES, rand),
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Verify types**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add lib/damage.ts lib/roll.ts lib/roll.test.ts
git commit -m "feat: add damage pool and rollFate draw

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Roster data model + censor rule

Migrates `survived/dead/missing` to `alive/dead/lost` plus an orthogonal `isNpc` flag, and adds the redaction predicate. `components/CreditsRoll.tsx` must be updated in the same task or the build breaks on the old status names.

**Files:**

- Modify: `lib/data.ts` (status type, `Character`, featured cast, generator, labels, columns)
- Create: `lib/censor.ts`
- Create: `lib/censor.test.ts`
- Modify: `components/CreditsRoll.tsx:10-16` (status accent map keys only — full restyle happens in Task 10)

**Interfaces:**

- Consumes: nothing new.
- Produces:
  - `type CharacterStatus = 'alive' | 'dead' | 'lost'`
  - `interface Character { id, name, role, status, isNpc }`
  - `STATUS_SHORT_LABEL: Record<CharacterStatus, string>`
  - `STATUS_COLUMNS: { status, label }[]`
  - `isCensored(c: Pick<Character, 'status' | 'isNpc'>): boolean`
  - `censorWidthCh(name: string): number`

- [ ] **Step 1: Write the failing test**

Create `lib/censor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { censorWidthCh, isCensored } from "@/lib/censor";
import { getMockCharacters } from "@/lib/data";

describe("isCensored", () => {
  it("censors a dead NPC", () => {
    expect(isCensored({ status: "dead", isNpc: true })).toBe(true);
  });

  it("does not censor a living NPC", () => {
    expect(isCensored({ status: "alive", isNpc: true })).toBe(false);
  });

  it("does not censor a lost NPC", () => {
    expect(isCensored({ status: "lost", isNpc: true })).toBe(false);
  });

  it("does not censor a dead player character", () => {
    expect(isCensored({ status: "dead", isNpc: false })).toBe(false);
  });
});

describe("censorWidthCh", () => {
  it("scales with the name length", () => {
    expect(censorWidthCh("Ethan Cole")).toBe(10);
  });

  it("clamps very short names up to a readable minimum", () => {
    expect(censorWidthCh("Al")).toBe(6);
  });

  it("clamps very long names down to the column width", () => {
    expect(censorWidthCh("Bartholomew Winterbottom")).toBe(18);
  });
});

describe("roster", () => {
  const roster = getMockCharacters();

  it("uses only the three current statuses", () => {
    for (const c of roster) {
      expect(["alive", "dead", "lost"]).toContain(c.status);
    }
  });

  it("marks every character with an explicit npc flag", () => {
    for (const c of roster) {
      expect(typeof c.isNpc).toBe("boolean");
    }
  });

  it("produces at least one censored entry", () => {
    expect(roster.some(isCensored)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/censor"`.

- [ ] **Step 3: Update the status type and Character shape**

In `lib/data.ts`, replace the type and interface near the top:

```ts
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
```

- [ ] **Step 4: Update the labels and columns**

In `lib/data.ts`, replace `STATUS_SHORT_LABEL` and `STATUS_COLUMNS`:

```ts
/** Short Thai word for each status — used in the scrolling credits roll. */
export const STATUS_SHORT_LABEL: Record<CharacterStatus, string> = {
  alive: "Alive",
  dead: "Dead",
  lost: "Lost",
};
```

```ts
/** Ordered status columns rendered in the roster section. */
export const STATUS_COLUMNS: { status: CharacterStatus; label: string }[] = [
  { status: "alive", label: "รายชื่อผู้รอดชีวิต" },
  { status: "dead", label: "รายชื่อผู้เสียชีวิต" },
  { status: "lost", label: "รายชื่อผู้สาบสูญ" },
];
```

- [ ] **Step 5: Update the featured cast**

In `lib/data.ts`, replace the `FEATURED_CHARACTERS` array. These nine are named players, so none is an NPC:

```ts
const FEATURED_CHARACTERS: Character[] = [
  {
    id: "c01",
    name: "Ethan Cole",
    role: "ตัวประกอบฉาก",
    status: "alive",
    isNpc: false,
  },
  {
    id: "c02",
    name: "Olivia Reed",
    role: "ตัวประกอบฉาก",
    status: "alive",
    isNpc: false,
  },
  {
    id: "c03",
    name: "Marcus Bell",
    role: "ตัวประกอบฉาก",
    status: "alive",
    isNpc: false,
  },
  {
    id: "c04",
    name: "Liam Foster",
    role: "ตัวประกอบฉาก",
    status: "dead",
    isNpc: false,
  },
  {
    id: "c05",
    name: "Chloe Grant",
    role: "ตัวประกอบฉาก",
    status: "dead",
    isNpc: false,
  },
  {
    id: "c06",
    name: "Noah Blake",
    role: "ตัวประกอบฉาก",
    status: "dead",
    isNpc: false,
  },
  {
    id: "c07",
    name: "Ava Sinclair",
    role: "ตัวประกอบฉาก",
    status: "dead",
    isNpc: false,
  },
  {
    id: "c08",
    name: "Mason Hale",
    role: "ตัวประกอบฉาก",
    status: "lost",
    isNpc: false,
  },
  {
    id: "c09",
    name: "Isla Monroe",
    role: "ตัวประกอบฉาก",
    status: "lost",
    isNpc: false,
  },
];
```

- [ ] **Step 6: Update the generator**

In `lib/data.ts`, inside `generateCharacters`, replace the status draw and the pushed object. The seeded `mulberry32` PRNG and the name pools are unchanged, so the roster stays deterministic across builds:

```ts
const r = rand();
const status: CharacterStatus = r < 0.42 ? "alive" : r < 0.8 ? "dead" : "lost";
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
```

- [ ] **Step 7: Write the censor module**

Create `lib/censor.ts`:

```ts
// ---------------------------------------------------------------------------
// Roster redaction — "Npc - Alive if Dead, will censor".
// ---------------------------------------------------------------------------

import type { Character } from "./data";

/** A dead NPC's name is redacted; everyone else renders normally. */
export function isCensored(
  character: Pick<Character, "status" | "isNpc">,
): boolean {
  return character.isNpc && character.status === "dead";
}

/**
 * Width of the redaction bar, in `ch` units, derived from the hidden name so
 * bars vary in length the way they do in the mockups. Clamped so a two-letter
 * name still reads as a redaction and a long one never overflows its column.
 */
export function censorWidthCh(name: string): number {
  return Math.min(18, Math.max(6, name.trim().length));
}
```

- [ ] **Step 8: Fix the stale status keys in CreditsRoll**

`components/CreditsRoll.tsx:12-16` still keys on the old names and will not compile. Replace that map (the full restyle lands in Task 10):

```tsx
const STATUS_ACCENT: Record<CharacterStatus, string> = {
  alive: "text-fate-alive",
  dead: "text-fate-dead",
  lost: "text-fate-lost",
};
```

> Note: `text-fate-*` utilities do not exist until Task 5 adds them to the Tailwind theme. That is fine — an unknown Tailwind class compiles to nothing and does not fail the build or the type check.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — including the three `roster` assertions.

- [ ] **Step 10: Verify types**

Run: `npx tsc --noEmit`
Expected: no output. If it reports errors in `app/page.tsx` or `components/CreditsRoll.tsx` about `survived`/`missing`, grep for the old names and fix them:

```bash
grep -rn "survived\|missing" app components lib --include="*.ts" --include="*.tsx"
```

- [ ] **Step 11: Commit**

```bash
git add lib/data.ts lib/censor.ts lib/censor.test.ts components/CreditsRoll.tsx
git commit -m "feat: migrate roster to alive/dead/lost plus npc censoring

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Theme tokens, fonts, and page skeleton

The visual foundation: the `--decay` token set, the red overlay, VT323 + Prompt, and a stripped `page.tsx` that renders the noise background and nothing else. After this task the page is intentionally near-empty — later tasks fill it in.

**Files:**

- Modify: `app/globals.css` (replace the unused Vite-template rules; keep the credits-roll rules)
- Modify: `tailwind.config.ts` (color + font tokens)
- Modify: `app/layout.tsx` (VT323 + Prompt)
- Modify: `app/page.tsx` (skeleton)

**Interfaces:**

- Produces (CSS custom properties on `:root`): `--decay`, `--c-text`, `--c-text-dim`, `--c-glow`, `--c-censor`, `--c-rule`, `--c-alive`, `--c-dead`, `--c-lost`, `--c-npc`.
- Produces (Tailwind utilities): `text-scene`, `text-scene-dim`, `text-scene-glow`, `border-scene-rule`, `bg-scene-censor`, `text-fate-alive`, `text-fate-dead`, `text-fate-lost`, `text-fate-npc`, `font-term`, `font-sans`.
- Produces (CSS classes): `.scene-overlay`, `.frame-dashed`.

- [ ] **Step 1: Replace globals.css**

`app/globals.css` currently carries a large block of unused starter-template CSS (`.counter`, `.hero`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks`, and the `.prompt-*` weight helpers) — none of it is referenced by any component. Replace the whole file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---------------------------------------------------------------------------
   Scene tokens.

   --decay is 0 when the campaign opens and 1 at the deadline; DecayClock
   rewrites it on <html> once per minute after hydration. Every themed colour
   is a color-mix() between its scene1 (green) and scene2 (red) value, so the
   entire page fades from one number.
   --------------------------------------------------------------------------- */
:root {
  --decay: 0;

  --c-text: color-mix(
    in oklab,
    #38cf4e calc((1 - var(--decay)) * 100%),
    #ffffff
  );
  --c-text-dim: color-mix(
    in oklab,
    #315933 calc((1 - var(--decay)) * 100%),
    #b3b3b3
  );
  --c-glow: color-mix(
    in oklab,
    #20b369 calc((1 - var(--decay)) * 100%),
    #620202
  );
  --c-censor: color-mix(
    in oklab,
    #2f5a34 calc((1 - var(--decay)) * 100%),
    #000000
  );
  --c-rule: color-mix(
    in oklab,
    #38cf4e calc((1 - var(--decay)) * 100%),
    #ffffff
  );

  /* Roster accents deliberately do NOT interpolate: the roster sits below the
     red gradient's transparent zone and reads the same in both mockups. */
  --c-alive: #3e8e43;
  --c-dead: #ff2d2d;
  --c-lost: #e0a82e;
  --c-npc: #2f5a34;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  text-rendering: optimizeLegibility;
}

/* Scene 2's red wash. Transparent by 78%, which is why the roster stays dark
   green in both scenes without any special casing. */
.scene-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--decay);
  background: linear-gradient(
    180deg,
    #ff0000 0%,
    rgba(115, 115, 115, 0) 77.88%,
    rgba(173, 67, 67, 0.413462) 99.99%
  );
}

/* The dashed terminal frames around every panel in the mockups. */
.frame-dashed {
  border: 1px dashed var(--c-rule);
}

/* ---- End-credits roll (see components/CreditsRoll.tsx) ------------------- */
/* The track holds two identical copies of the cast; scrolling it up by exactly
   one copy's height (-50%) and looping makes the wrap seamless. */
@keyframes credits-scroll {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-50%);
  }
}

.animate-credits {
  animation: credits-scroll var(--credits-duration, 80s) linear infinite;
}

/* Respect reduced-motion: drop the animation, hide the duplicate copy, and let
   the viewport scroll manually instead. */
@media (prefers-reduced-motion: reduce) {
  .animate-credits {
    animation: none;
    transform: none;
  }
  .credits-dup {
    display: none;
  }
  .credits-viewport {
    overflow-y: auto;
  }
}
```

- [ ] **Step 2: Extend the Tailwind theme**

Replace `tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Scene colours interpolate with --decay (see app/globals.css).
        // Never use Tailwind opacity modifiers on these — the `/50` syntax
        // does not work with bare var() colour values.
        scene: {
          DEFAULT: "var(--c-text)",
          dim: "var(--c-text-dim)",
          glow: "var(--c-glow)",
          rule: "var(--c-rule)",
          censor: "var(--c-censor)",
        },
        fate: {
          alive: "var(--c-alive)",
          dead: "var(--c-dead)",
          lost: "var(--c-lost)",
          npc: "var(--c-npc)",
        },
      },
      fontFamily: {
        // VT323 has no Thai glyphs, so Prompt always follows it in the stack.
        term: ["var(--font-vt323)", "var(--font-prompt)", "monospace"],
        sans: ["var(--font-prompt)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid equivalents of the fixed sizes on the 1920px Figma canvas.
        countdown: ["clamp(1.75rem, 7vw, 6rem)", { lineHeight: "1.1" }],
        window: ["clamp(1.125rem, 3.4vw, 4rem)", { lineHeight: "1.2" }],
        log: ["clamp(0.75rem, 1.9vw, 2.25rem)", { lineHeight: "1.2" }],
        panel: ["clamp(0.875rem, 1.6vw, 1.75rem)", { lineHeight: "1.6" }],
        roster: ["clamp(0.75rem, 1.1vw, 1.25rem)", { lineHeight: "1.7" }],
      },
      letterSpacing: {
        term: "0.15em",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Swap the fonts in the layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Prompt, VT323 } from "next/font/google";
import "./globals.css";
import { EVENT_TITLE, EVENT_DESCRIPTION } from "@/lib/data";

// Terminal face for Latin text and numerals. Latin-only by design.
const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

// Thai fallback — VT323 has no Thai glyphs, and item names, injuries and the
// result sentence are all Thai.
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: EVENT_TITLE,
  description: EVENT_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${vt323.variable} ${prompt.variable}`}>
      <body className="bg-black font-term antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Reduce page.tsx to the skeleton**

Replace `app/page.tsx` with:

```tsx
import { getCharacters } from "@/lib/firebase";

// GitHub Pages project sites serve assets under /<repo>; plain CSS url() and
// <img> refs don't get that prefix automatically the way next/image does.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default async function Home() {
  const characters = await getCharacters();

  return (
    <main
      className="relative min-h-screen bg-black bg-cover bg-center font-term text-scene"
      style={{ backgroundImage: `url(${BASE_PATH}/assets/noise-bg.svg)` }}
    >
      <div className="scene-overlay" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <p className="text-log tracking-term">Roster: {characters.length}</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: type check silent, build completes and writes `./out`.

- [ ] **Step 6: Verify the tokens render**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: near-black noisy background, green `Roster: 120` in a pixel terminal face.
Then in devtools set `--decay` on the `<html>` element to `1`.
Expected: the text turns white and a red wash fades in over the top of the page. Set it back to `0` and the green returns.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx tailwind.config.ts
git commit -m "feat: add decay-driven scene tokens, VT323/Prompt fonts, page skeleton

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: DecayClock

Drives `--decay` from real time.

**Files:**

- Create: `components/DecayClock.tsx`
- Modify: `app/page.tsx` (mount it)

**Interfaces:**

- Consumes: `computeDecay` from `@/lib/decay`; `EVENT_START`, `EVENT_DEADLINE` from `@/lib/data`.
- Produces: `<DecayClock start={string} deadline={string} />` — renders `null`, writes `--decay` on `<html>`.

- [ ] **Step 1: Write the component**

Create `components/DecayClock.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { computeDecay } from "@/lib/decay";

/**
 * Writes the campaign's decay (0…1) onto <html> as --decay, once on mount and
 * then once a minute. Renders nothing.
 *
 * The value only ever drives colours, never text, so the server can ship the
 * default --decay: 0 from globals.css without any hydration mismatch.
 */
export default function DecayClock({
  start,
  deadline,
}: {
  start: string;
  deadline: string;
}) {
  useEffect(() => {
    const startMs = new Date(start).getTime();
    const endMs = new Date(deadline).getTime();

    const apply = () => {
      const decay = computeDecay(Date.now(), startMs, endMs);
      document.documentElement.style.setProperty("--decay", decay.toFixed(4));
    };

    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, [start, deadline]);

  return null;
}
```

- [ ] **Step 2: Mount it in the page**

In `app/page.tsx`, add the imports:

```tsx
import DecayClock from "@/components/DecayClock";
import { EVENT_START, EVENT_DEADLINE } from "@/lib/data";
```

and add the component as the first child of `<main>`, above the overlay:

```tsx
      <DecayClock start={EVENT_START} deadline={EVENT_DEADLINE} />
      <div className="scene-overlay" aria-hidden />
```

- [ ] **Step 3: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Verify the wiring**

Run: `npm run dev`, open the page, and inspect `<html>` in devtools.
Expected: a `style="--decay: 0.0000"` attribute is present. Today's date (2026-07-29) is before `EVENT_START` (2026-08-01), so 0 is correct.

Then temporarily edit `lib/data.ts` to `EVENT_START = '2026-07-01T00:00:00+07:00'` and reload.
Expected: `--decay` reads roughly `0.55` and the page is visibly halfway to red. **Revert that edit before committing.**

- [ ] **Step 5: Confirm the edit is reverted**

Run: `git diff lib/data.ts`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add components/DecayClock.tsx app/page.tsx
git commit -m "feat: drive --decay from campaign clock

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Header chrome

The system log line, emblem, event tag, and event duration.

**Files:**

- Create: `components/SystemLog.tsx`
- Modify: `components/Emblem.tsx` (point at the murrwood seal)
- Modify: `lib/data.ts` (`EVENT_WINDOW_LABEL`)
- Modify: `app/page.tsx`

**Interfaces:**

- Consumes: `BASE_PATH` convention from `Emblem.tsx`.
- Produces: `<SystemLog />`; `EVENT_WINDOW_LABEL` = `'Event Duration: August 01 - 21, 2026'`.

- [ ] **Step 1: Update the event window label**

In `lib/data.ts`, replace the `EVENT_WINDOW_LABEL` line. `EVENT_START` and `EVENT_DEADLINE` are deliberately left alone — they drive both the countdown and `--decay`, and changing them would silently reschedule the campaign:

```ts
/** Small subtitle under the countdown showing the event window. */
export const EVENT_WINDOW_LABEL = "Event Duration: August 01 - 21, 2026";
```

- [ ] **Step 2: Write the SystemLog component**

Create `components/SystemLog.tsx`:

```tsx
/** The terminal banner across the very top of the page, plus its hairline. */
export default function SystemLog() {
  return (
    <div className="w-full">
      <p className="text-log tracking-term text-scene">
        SYSTEM LOG V.2.0.1 - May 13, 2001
      </p>
      <hr className="mt-3 h-px border-0 bg-scene-rule" />
    </div>
  );
}
```

> The hairline is a 1px block with a background rather than a border: `border-0 border-t` is order-dependent in the generated stylesheet, and opacity modifiers (`border-scene-rule/50`) do not work on bare `var()` colour values.

- [ ] **Step 3: Point Emblem at the murrwood seal**

Replace `components/Emblem.tsx`:

```tsx
// The Murrwood town seal at the top of the page, served from
// /public/assets/murrwood_logo_white.svg. On GitHub Pages *project* sites the
// app is served from /<repo>, so the src needs the configured base path prefix
// (empty locally). Images are unoptimized (see next.config.mjs), so a plain
// <img> is the right tool here rather than next/image.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Emblem({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/assets/murrwood_logo_white.svg`}
      alt="Town of Murrwood seal"
      className={className}
    />
  );
}
```

- [ ] **Step 4: Assemble the header in the page**

In `app/page.tsx`, add the imports:

```tsx
import Emblem from "@/components/Emblem";
import SystemLog from "@/components/SystemLog";
import { EVENT_WINDOW_LABEL } from "@/lib/data";
```

and replace the placeholder `<p className="text-log …">Roster: …</p>` with:

```tsx
        <SystemLog />

        <header className="mt-10 text-center sm:mt-16">
          <Emblem className="mx-auto h-20 w-20 sm:h-28 sm:w-28" />

          <p className="mt-8 text-log tracking-term text-scene-dim">
            #WTM_EVENT_05 : THE FINAL CHAPTER
          </p>

          <p className="mt-6 text-window text-scene-dim">{EVENT_WINDOW_LABEL}</p>
        </header>
```

- [ ] **Step 5: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Verify visually**

Run: `npm run dev`.
Expected: green `SYSTEM LOG V.2.0.1 - May 13, 2001` at top-left above a hairline, the white Murrwood seal centred beneath it, then the dim `#WTM_EVENT_05 : THE FINAL CHAPTER` tag and the dim `Event Duration: August 01 - 21, 2026` line. Narrow the window to 375px and confirm nothing overflows horizontally.

- [ ] **Step 7: Commit**

```bash
git add components/SystemLog.tsx components/Emblem.tsx lib/data.ts app/page.tsx
git commit -m "feat: add system log banner, murrwood seal and event header

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Countdown

Extracts the countdown math into a testable pure module and restyles the component with the mockup's wording and its blurred glow layer.

**Files:**

- Create: `lib/countdown.ts`
- Create: `lib/countdown.test.ts`
- Modify: `components/Countdown.tsx` (replace entirely)
- Modify: `app/page.tsx` (mount it)

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type CountdownPhase = 'before' | 'active' | 'ended'`
  - `interface CountdownState { phase, days, hours, minutes, seconds }`
  - `computeCountdown(now: number, start: number, deadline: number): CountdownState`
  - `formatCountdown(state: CountdownState): string`
  - `<Countdown start={string} deadline={string} />`

- [ ] **Step 1: Write the failing test**

Create `lib/countdown.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeCountdown, formatCountdown } from "@/lib/countdown";

const START = Date.UTC(2026, 7, 1);
const END = Date.UTC(2026, 7, 22);
const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

describe("computeCountdown", () => {
  it("reports the full window before the campaign starts", () => {
    const state = computeCountdown(START - DAY, START, END);
    expect(state.phase).toBe("before");
    expect(state.days).toBe(21);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
  });

  it("breaks the remaining time down while active", () => {
    const now = END - (2 * DAY + 12 * HOUR + 24 * MINUTE);
    const state = computeCountdown(now, START, END);
    expect(state.phase).toBe("active");
    expect(state.days).toBe(2);
    expect(state.hours).toBe(12);
    expect(state.minutes).toBe(24);
  });

  it("zeroes out at and after the deadline", () => {
    expect(computeCountdown(END, START, END)).toMatchObject({
      phase: "ended",
      days: 0,
      hours: 0,
      minutes: 0,
    });
    expect(computeCountdown(END + DAY, START, END).phase).toBe("ended");
  });
});

describe("formatCountdown", () => {
  it("matches the mockup wording", () => {
    const now = END - (2 * DAY + 12 * HOUR + 24 * MINUTE);
    expect(formatCountdown(computeCountdown(now, START, END))).toBe(
      "2 Days 12 Hours 24 Minute left",
    );
  });

  it("reads all zeroes once the deadline passes", () => {
    expect(formatCountdown(computeCountdown(END, START, END))).toBe(
      "0 Days 0 Hours 0 Minute left",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/countdown"`.

- [ ] **Step 3: Write the countdown module**

Create `lib/countdown.ts`:

```ts
// ---------------------------------------------------------------------------
// Countdown math.
//
// Pure and `now`-injected so the component can render a deterministic first
// frame on the server and only switch to real time after hydration.
// ---------------------------------------------------------------------------

export type CountdownPhase = "before" | "active" | "ended";

export interface CountdownState {
  phase: CountdownPhase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function breakdown(diff: number, phase: CountdownPhase): CountdownState {
  return {
    phase,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

/**
 * Time left until `deadline`. Before the campaign opens this reports the full
 * window rather than a placeholder, so the banner always shows a real number.
 */
export function computeCountdown(
  now: number,
  start: number,
  deadline: number,
): CountdownState {
  if (now >= deadline) {
    return { phase: "ended", days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  if (now < start) {
    return breakdown(deadline - start, "before");
  }
  return breakdown(deadline - now, "active");
}

/** "2 Days 12 Hours 24 Minute left" — the mockup's exact wording. */
export function formatCountdown(state: CountdownState): string {
  return `${state.days} Days ${state.hours} Hours ${state.minutes} Minute left`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Rewrite the Countdown component**

Replace `components/Countdown.tsx` entirely:

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  computeCountdown,
  formatCountdown,
  type CountdownState,
} from "@/lib/countdown";

/**
 * Live countdown in the mockup's two-layer treatment: a blurred glow copy sat
 * behind a sharp copy.
 *
 * The first render uses `now = start`, which is deterministic from props, so
 * the server and the client's first paint agree. The effect then takes over
 * with real time.
 */
export default function Countdown({
  start,
  deadline,
}: {
  start: string;
  deadline: string;
}) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(deadline).getTime();

  const [state, setState] = useState<CountdownState>(() =>
    computeCountdown(startMs, startMs, endMs),
  );

  useEffect(() => {
    const tick = () => setState(computeCountdown(Date.now(), startMs, endMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  const text = formatCountdown(state);

  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-countdown tracking-term text-scene-glow blur-[5.25px]"
      >
        {text}
      </span>
      <span className="relative flex items-center justify-center whitespace-nowrap text-countdown tracking-term text-scene">
        {text}
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Mount it in the page**

In `app/page.tsx`, add the import:

```tsx
import Countdown from "@/components/Countdown";
```

and insert it inside `<header>`, between the `#WTM_EVENT_05` paragraph and the `EVENT_WINDOW_LABEL` paragraph:

```tsx
<h1 className="mt-6">
  <Countdown start={EVENT_START} deadline={EVENT_DEADLINE} />
</h1>
```

- [ ] **Step 7: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 8: Verify visually**

Run: `npm run dev`.
Expected: a large green countdown with a soft glow behind it, reading `21 Days 0 Hours 0 Minute left` (today is before `EVENT_START`). No console hydration warning. At 375px width the text shrinks and stays on one line.

- [ ] **Step 9: Commit**

```bash
git add lib/countdown.ts lib/countdown.test.ts components/Countdown.tsx app/page.tsx
git commit -m "feat: restyle countdown with glow layer and mockup wording

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: FateBox

The "What will happened with you?" panel — name input, Enter, result sentence, item image.

**Files:**

- Create: `components/FateBox.tsx`
- Modify: `app/page.tsx` (mount it)

**Interfaces:**

- Consumes: `rollFate`, `type Fate` from `@/lib/roll`.
- Produces: `<FateBox />` — self-contained, no props.

- [ ] **Step 1: Write the component**

Create `components/FateBox.tsx`:

```tsx
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { rollFate, type Fate } from "@/lib/roll";

const MAX_NAME_LENGTH = 40;

/** The bracketed slots in the result sentence, rendered brighter than the prose. */
function Slot({ children }: { children: ReactNode }) {
  return (
    <span className="text-scene">
      {"< "}
      {children}
      {" >"}
    </span>
  );
}

/**
 * The randomiser panel. Every submit re-rolls, so the same name can pull a
 * different item and injury each time.
 */
export default function FateBox() {
  const [name, setName] = useState("");
  const [fate, setFate] = useState<Fate | null>(null);
  const [rolledName, setRolledName] = useState("");
  const [error, setError] = useState("");
  const [imageBroken, setImageBroken] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) {
      setError("> ERROR: NAME REQUIRED");
      setFate(null);
      return;
    }

    setError("");
    setImageBroken(false);
    setRolledName(trimmed);
    setFate(rollFate());
  }

  return (
    <section className="frame-dashed mt-12 p-5 sm:mt-16 sm:p-8">
      <h2 className="text-panel text-scene">What will happened with you?</h2>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4 border-t border-dashed border-scene-rule pt-6 sm:flex-row sm:items-center"
      >
        <label htmlFor="fate-name" className="text-panel text-scene">
          Input you name here:
        </label>
        <input
          id="fate-name"
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          className="frame-dashed min-w-0 flex-1 bg-transparent px-3 py-2 text-panel text-scene caret-current outline-none focus-visible:ring-1 focus-visible:ring-scene-rule"
        />
        <button
          type="submit"
          className="frame-dashed px-6 py-2 text-panel text-scene transition-opacity hover:opacity-70 focus-visible:ring-1 focus-visible:ring-scene-rule"
        >
          Enter
        </button>
      </form>

      <div className="mt-6 border-t border-dashed border-scene-rule pt-6">
        <p className="text-panel text-scene">Result:</p>

        {error && (
          <p role="alert" className="mt-4 text-panel text-fate-dead">
            {error}
          </p>
        )}

        {fate && !error && (
          <>
            <p className="mt-4 text-panel leading-loose text-scene-dim">
              <Slot>{rolledName}</Slot> ได้รับ <Slot>{fate.item.name}</Slot>{" "}
              โดยที่คุณจะมีโอกาส <Slot>{fate.damage}</Slot>
            </p>

            <div className="mt-8 text-center">
              {imageBroken ? (
                <p className="text-panel text-scene-dim">
                  &lt;Image of Item&gt;
                </p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fate.item.imgUrl}
                  alt={fate.item.name}
                  onError={() => setImageBroken(true)}
                  className="mx-auto max-h-64 w-auto object-contain"
                />
              )}
              <p className="mx-auto mt-4 max-w-xl text-panel text-scene-dim">
                {fate.item.description}
              </p>
            </div>
          </>
        )}

        {!fate && !error && (
          <p className="mt-4 text-panel text-scene-dim">
            &lt;Image of Item&gt;
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount it in the page**

In `app/page.tsx`, add the import:

```tsx
import FateBox from "@/components/FateBox";
```

and add it directly after the closing `</header>` tag:

```tsx
<FateBox />
```

- [ ] **Step 3: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Verify the interactions**

Run: `npm run dev`. Then check each of these:

| Action                                      | Expected                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Press Enter with an empty field             | `> ERROR: NAME REQUIRED` in red; no result sentence                                                                    |
| Type a name, press Enter                    | Thai sentence `< name > ได้รับ < item > โดยที่คุณจะมีโอกาส < injury >`, an item PNG below it, and the item description |
| Press Enter repeatedly with the same name   | Item and injury change between presses                                                                                 |
| Click the `Enter` button instead of the key | Same behaviour                                                                                                         |
| Inspect the Thai text                       | Renders as Thai glyphs, not boxes (Prompt fallback working)                                                            |
| Paste a 100-character name                  | Truncated to 40                                                                                                        |

- [ ] **Step 5: Commit**

```bash
git add components/FateBox.tsx app/page.tsx
git commit -m "feat: add fate randomiser panel

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Survival List — roster, legend, censoring

Restyles the credits roll to the terminal look, splits it into three staggered columns, and renders redaction bars.

**Files:**

- Modify: `components/CreditsRoll.tsx` (replace entirely)
- Create: `components/StatusLegend.tsx`
- Create: `components/SurvivalList.tsx`
- Modify: `app/page.tsx` (mount it)

**Interfaces:**

- Consumes: `Character`, `CharacterStatus`, `STATUS_SHORT_LABEL` from `@/lib/data`; `isCensored`, `censorWidthCh` from `@/lib/censor`.
- Produces:
  - `<CreditsRoll characters={Character[]} durationSec?={number} className?={string} />`
  - `<StatusLegend />`
  - `<SurvivalList characters={Character[]} />`

- [ ] **Step 1: Rewrite CreditsRoll**

Replace `components/CreditsRoll.tsx` entirely:

```tsx
"use client";

import type { CSSProperties } from "react";
import { censorWidthCh, isCensored } from "@/lib/censor";
import { type Character, type CharacterStatus } from "@/lib/data";

// Fate accents. These do not interpolate with --decay: the roster sits below
// the red gradient's transparent zone and reads the same in both scenes.
const STATUS_ACCENT: Record<CharacterStatus, string> = {
  alive: "text-fate-alive",
  dead: "text-fate-dead",
  lost: "text-fate-lost",
};

function CreditLine({ character }: { character: Character }) {
  // "Npc - Alive if Dead, will censor": a dead NPC's name is redacted, with a
  // bar whose width tracks the hidden name so redactions vary in length.
  if (isCensored(character)) {
    return (
      <li className="py-[3px] text-roster">
        <span
          aria-label="censored"
          className="inline-block bg-scene-censor align-middle"
          style={{ width: `${censorWidthCh(character.name)}ch`, height: "1em" }}
        />
      </li>
    );
  }

  const accent = character.isNpc
    ? "text-fate-npc"
    : STATUS_ACCENT[character.status];

  return <li className={`py-[3px] text-roster ${accent}`}>{character.name}</li>;
}

function CreditList({
  characters,
  keyPrefix,
  ariaHidden = false,
}: {
  characters: Character[];
  keyPrefix: string;
  ariaHidden?: boolean;
}) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className={ariaHidden ? "credits-dup" : undefined}
    >
      {characters.map((c) => (
        <CreditLine key={`${keyPrefix}-${c.id}`} character={c} />
      ))}
    </ul>
  );
}

/**
 * One scrolling column of the survival list. The track holds two identical
 * copies and animates by -50% (exactly one copy's height), so the wrap is
 * invisible. Hover pauses it, and `prefers-reduced-motion` turns it into a
 * plain scrollable list (see the `.credits-*` rules in app/globals.css).
 */
export default function CreditsRoll({
  characters,
  durationSec,
  className = "",
}: {
  characters: Character[];
  durationSec?: number;
  className?: string;
}) {
  // Scale the loop length with the cast so density stays readable; ~0.9s per
  // name, floored so short columns don't whip past.
  const duration =
    durationSec ?? Math.max(40, Math.round(characters.length * 0.9));
  const trackStyle = { "--credits-duration": `${duration}s` } as CSSProperties;

  return (
    <div
      tabIndex={0}
      aria-label="Survival list column"
      className={`credits-viewport group relative overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-scene-rule ${className}`}
    >
      <div
        className="animate-credits flex flex-col will-change-transform group-hover:[animation-play-state:paused]"
        style={trackStyle}
      >
        <CreditList characters={characters} keyPrefix="a" />
        <CreditList characters={characters} keyPrefix="b" ariaHidden />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the legend**

Create `components/StatusLegend.tsx`:

```tsx
/** The four-chip status key above the roster. */
export default function StatusLegend() {
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-roster">
      <li className="text-scene">Status</li>
      <li className="text-fate-alive">· Alive</li>
      <li className="text-fate-dead">· Dead</li>
      <li className="text-fate-lost">· Lost</li>
      <li className="text-fate-npc">· Npc - Alive if Dead, will censor</li>
    </ul>
  );
}
```

- [ ] **Step 3: Write the SurvivalList shell**

Create `components/SurvivalList.tsx`. It owns the roster as client state so Task 11's submit bar can prepend into it:

```tsx
"use client";

import { useState } from "react";
import CreditsRoll from "@/components/CreditsRoll";
import StatusLegend from "@/components/StatusLegend";
import type { Character } from "@/lib/data";

/** Split the cast into three roughly equal columns. */
function intoColumns(characters: Character[]): Character[][] {
  const size = Math.ceil(characters.length / 3);
  return [
    characters.slice(0, size),
    characters.slice(size, size * 2),
    characters.slice(size * 2),
  ];
}

// Slightly different loop lengths per column so they don't scroll in lockstep.
const COLUMN_DURATIONS = [82, 96, 74];

export default function SurvivalList({
  characters,
}: {
  characters: Character[];
}) {
  const [roster] = useState<Character[]>(characters);
  const columns = intoColumns(roster);

  return (
    <section className="mt-16 sm:mt-24">
      <h2 className="text-window text-scene">Survival List</h2>
      <hr className="mt-4 h-px border-0 bg-scene-rule" />

      <StatusLegend />

      <div className="frame-dashed mt-6 grid grid-cols-1 gap-x-8 p-4 sm:grid-cols-3 sm:p-6">
        {columns.map((column, i) => (
          <CreditsRoll
            key={i}
            characters={column}
            durationSec={COLUMN_DURATIONS[i]}
            className="h-[320px] sm:h-[480px]"
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Mount it in the page**

In `app/page.tsx`, add the import:

```tsx
import SurvivalList from "@/components/SurvivalList";
```

and add it directly after `<FateBox />`:

```tsx
<SurvivalList characters={characters} />
```

- [ ] **Step 5: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Verify visually**

Run: `npm run dev`. Check:

| Check                                                                        | Expected                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| Three columns inside a dashed frame                                          | Yes, on screens ≥ `sm`                                |
| Columns scroll at visibly different rates                                    | Yes                                                   |
| Hovering a column pauses just that column                                    | Yes                                                   |
| Green / red / amber / dim names present                                      | Yes                                                   |
| Solid redaction bars scattered through the list, of varying width            | Yes                                                   |
| At 375px width                                                               | Collapses to a single column, no horizontal overflow  |
| macOS System Settings → Accessibility → Display → Reduce motion, then reload | Columns stop animating and become manually scrollable |

- [ ] **Step 7: Commit**

```bash
git add components/CreditsRoll.tsx components/StatusLegend.tsx components/SurvivalList.tsx app/page.tsx
git commit -m "feat: rebuild survival list with staggered columns and npc censoring

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Submit bar

The inline name + status form, backed by a Firebase-ready no-op.

**Files:**

- Modify: `lib/firebase.ts` (add `submitCharacter`)
- Create: `components/SubmitBar.tsx`
- Modify: `components/SurvivalList.tsx` (own the insert, render the bar)

**Interfaces:**

- Consumes: `Character`, `CharacterStatus`, `STATUS_SHORT_LABEL` from `@/lib/data`.
- Produces:
  - `submitCharacter(entry: { name: string; status: CharacterStatus }): Promise<void>`
  - `<SubmitBar onSubmitted={(c: Character) => void} />`

- [ ] **Step 1: Add the data-layer entry point**

In `lib/firebase.ts`, append after `getCharacters()`:

```ts
/**
 * Record a submitted character.
 *
 * Currently a no-op: the caller inserts the entry into its own state so it
 * shows up in the roll immediately, and a reload restores the seeded list.
 * This is the single function to replace when the database goes live —
 * mirroring how getCharacters() is structured.
 *
 * --- Firebase version (enable after following the wiring guide above) ------
 * await push(ref(db, 'characters'), entry);
 */
export async function submitCharacter(entry: {
  name: string;
  status: CharacterStatus;
}): Promise<void> {
  void entry;
}
```

and widen the existing import at the top of the file:

```ts
import {
  getMockCharacters,
  type Character,
  type CharacterStatus,
} from "./data";
```

- [ ] **Step 2: Write the SubmitBar**

Create `components/SubmitBar.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import {
  STATUS_SHORT_LABEL,
  type Character,
  type CharacterStatus,
} from "@/lib/data";
import { submitCharacter } from "@/lib/firebase";

const MAX_NAME_LENGTH = 40;

const STATUS_OPTIONS: CharacterStatus[] = ["alive", "dead", "lost"];

/**
 * The bottom bar of the survival list. Submitting hands the entry to
 * submitCharacter() and hands it back up so the parent can show it in the
 * roll right away.
 */
export default function SubmitBar({
  onSubmitted,
}: {
  onSubmitted: (character: Character) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CharacterStatus>("alive");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) {
      setError("> ERROR: NAME REQUIRED");
      return;
    }

    setError("");
    await submitCharacter({ name: trimmed, status });

    onSubmitted({
      id: `submitted-${Date.now()}`,
      name: trimmed,
      role: "ตัวประกอบฉาก",
      status,
      isNpc: false,
    });
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="frame-dashed flex items-center gap-3 px-4 py-3">
          <label
            htmlFor="submit-name"
            className="whitespace-nowrap text-panel text-scene"
          >
            Add your name here:
          </label>
          <input
            id="submit-name"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-panel text-scene caret-current outline-none"
          />
        </div>

        <div className="frame-dashed flex items-center gap-3 px-4 py-3">
          <label
            htmlFor="submit-status"
            className="whitespace-nowrap text-panel text-scene"
          >
            status :
          </label>
          <select
            id="submit-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CharacterStatus)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-panel text-scene outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-black text-white"
              >
                {STATUS_SHORT_LABEL[option]}
              </option>
            ))}
          </select>
          <span aria-hidden className="text-panel text-scene">
            ▼
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-panel text-fate-dead">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="frame-dashed mx-auto mt-8 block px-10 py-3 text-panel text-scene transition-opacity hover:opacity-70 focus-visible:ring-1 focus-visible:ring-scene-rule"
      >
        Enter to Submit
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Wire it into SurvivalList**

In `components/SurvivalList.tsx`, add the import:

```tsx
import SubmitBar from "@/components/SubmitBar";
```

change the state hook to expose its setter:

```tsx
const [roster, setRoster] = useState<Character[]>(characters);
```

and render the bar immediately after the closing `</div>` of the columns grid, still inside `<section>`:

```tsx
<SubmitBar
  onSubmitted={(character) => setRoster((prev) => [character, ...prev])}
/>
```

- [ ] **Step 4: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Verify the interactions**

Run: `npm run dev`. Check:

| Action                               | Expected                                                             |
| ------------------------------------ | -------------------------------------------------------------------- |
| Submit with an empty name            | `> ERROR: NAME REQUIRED`; nothing added                              |
| Type a name, pick `ตาย`, submit      | The name appears at the top of the first column in red, input clears |
| Submit a second name                 | Appears above the first                                              |
| Reload the page                      | Submitted names are gone (session-only, as designed)                 |
| Tab to the select and use arrow keys | Works; options are legible against their background                  |

- [ ] **Step 6: Commit**

```bash
git add lib/firebase.ts components/SubmitBar.tsx components/SurvivalList.tsx
git commit -m "feat: add survival list submit bar behind firebase-ready no-op

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Final assembly, responsive pass, and full verification

Adds the footer rule, confirms the whole page against both mockups at both ends of the decay range, and updates the README.

**Files:**

- Modify: `app/page.tsx` (footer rule, spacing)
- Modify: `README.md` (structure table)

- [ ] **Step 1: Add the closing rule and footer spacing**

In `app/page.tsx`, add a horizontal rule between `<FateBox />` and `<SurvivalList …/>` to match the mockups' section divider, and pad the bottom of the page:

```tsx
        <FateBox />

        <hr className="mt-12 h-px border-0 bg-scene-rule sm:mt-16" />

        <SurvivalList characters={characters} />

        <div className="h-16" />
```

- [ ] **Step 2: Verify the full test suite**

Run: `npm test`
Expected: PASS — all files in `lib/`.

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: type check silent; lint clean (or only pre-existing warnings).

- [ ] **Step 4: Verify the static export**

Run: `npm run build`
Expected: build succeeds and `./out/index.html` exists.

Confirm: `ls out/index.html`

- [ ] **Step 5: Verify the green scene against mockup 1**

Run: `npm run dev` with `--decay` at its default 0. Compare top to bottom against the green mockup:

- [ ] `SYSTEM LOG V.2.0.1 - May 13, 2001` top-left, above a hairline
- [ ] Murrwood seal centred
- [ ] `#WTM_EVENT_05 : THE FINAL CHAPTER` dim green
- [ ] Large glowing green countdown
- [ ] `Event Duration: August 01 - 21, 2026` dim green
- [ ] Dashed panel: `What will happened with you?`, `Input you name here:`, `Enter`, `Result:`
- [ ] Section rule, then `Survival List` heading with its own rule
- [ ] Status legend with four chips
- [ ] Three scrolling columns in a dashed frame, with green-tinted redaction bars
- [ ] `Add your name here:` + `status :` fields and the `Enter to Submit` button

- [ ] **Step 6: Verify the red scene against mockup 2**

In devtools, set `--decay: 1` on `<html>`. Confirm:

- [ ] All chrome text turns white
- [ ] A red wash covers the upper page and fades out before the roster
- [ ] The roster keeps its green/red/amber accents
- [ ] Redaction bars turn black
- [ ] The countdown glow turns dark red

Then set `--decay: 0.5` and confirm the page sits visibly between the two — no snapping, no flashing.

- [ ] **Step 7: Verify responsive behaviour**

At 375px, 768px, and 1440px widths confirm: no horizontal scrollbar on `<body>`, the countdown stays on one line, the roster is one column below `sm` and three above it.

- [ ] **Step 8: Update the README structure table**

In `README.md`, replace the `## Structure` table rows with:

```markdown
| Path                                           | What                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `app/page.tsx`                                 | The page: header chrome, fate panel, survival list                |
| `app/layout.tsx`                               | Root layout, VT323 + Prompt fonts, metadata                       |
| `app/globals.css`                              | Scene tokens (`--decay` colour interpolation), credits-roll rules |
| `components/DecayClock.tsx`                    | Writes `--decay` on `<html>` from the campaign clock              |
| `components/Countdown.tsx`                     | Live countdown with the mockup's glow treatment                   |
| `components/FateBox.tsx`                       | Name input → random item + injury                                 |
| `components/SurvivalList.tsx`                  | Roster columns, legend, submit bar                                |
| `components/CreditsRoll.tsx`                   | One scrolling roster column                                       |
| `lib/decay.ts`                                 | Campaign decay math (0 = green, 1 = red)                          |
| `lib/countdown.ts`                             | Countdown math and formatting                                     |
| `lib/items.ts`, `lib/damage.ts`, `lib/roll.ts` | Item / injury pools and the draw                                  |
| `lib/censor.ts`                                | "Npc - Alive if Dead, will censor" rule                           |
| `lib/data.ts`                                  | Types, seeded roster, event constants                             |
| `lib/firebase.ts`                              | Data access layer (swap mock → Firebase here)                     |
```

and under the "Local development" section, after the `npm run dev` block, add the sentence `Run the unit tests:` followed by a `bash` code block containing `npm test`.

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx README.md
git commit -m "feat: final assembly, responsive pass and docs

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 10: Confirm the working tree is clean**

Run: `git status --short`
Expected: only `?? template/` (the untracked Figma exports, deliberately left alone).

---

## Open items for the user

These were flagged during brainstorming and are **not** covered by any task:

1. **`template/` is untracked.** The Figma exports are neither committed nor gitignored. Decide which.
2. **`EVENT_DEADLINE` is `2026-08-22`** while the mockup reads `August 01 - 21, 2026`. Task 7 changes only the label. If Aug 21 is the true deadline, that is a separate one-line change to `lib/data.ts`.
