# CRT Terminal Redesign — Design

**Date:** 2026-07-29
**Status:** Approved for planning

## Goal

Rebuild the single-page WTM Final Event site to match the new mockups: a VT323
CRT-terminal aesthetic that starts green when the campaign opens and bleeds
continuously into red as the deadline approaches. The page draws a random item
and injury for whoever types their name, and keeps a scrolling survival roster.

## Source material

`template/scene1.css` (green) and `template/scene2.css` (red) are Figma exports:
1189 lines of bare declaration blocks, absolutely positioned on a 1920×3533
canvas, with no selectors. They are **not usable as stylesheets**. They serve as
a design token source only. A diff of the two files is 257 lines and is almost
entirely color values — the layout is identical between scenes.

The layout is rebuilt responsively with Tailwind; the tokens below are lifted
verbatim from the exports.

## Decisions

| Question                   | Decision                                                                     |
| -------------------------- | ---------------------------------------------------------------------------- |
| Fade trigger               | Continuous, tied to countdown progress                                       |
| สถานการณ์ (situation) slot | Dropped — no data source exists; use scene1's 2-slot sentence in both phases |
| Roll behavior              | Fresh random on every Enter press                                            |
| Item pool                  | All 26 items; `isOnlyOne` / `ishidden` / `isLocked` ignored                  |
| Roster statuses            | alive / dead / lost + `isNpc` flag; NPC censors when dead                    |
| Roster motion              | Keep the existing auto-scroll marquee                                        |
| Submit button              | Local-only session insert behind a Firebase-ready `submitCharacter()`        |

## Architecture

### Scene system

One DOM tree. A single custom property `--decay` (0…1) drives every themed
color. Chosen over cross-fading two copies of the page (duplicated markup,
duplicated text for screen readers, two countdowns) and over discrete theme
classes (cannot express a continuous fade).

`lib/decay.ts`

```ts
computeDecay(now: number, start: number, deadline: number): number
```

Pure. Returns `(now - start) / (deadline - start)` clamped to `[0, 1]`. Before
`EVENT_START` it is 0; at or after `EVENT_DEADLINE` it is 1. Guards against
`deadline <= start` by returning 1.

`components/DecayClock.tsx` (client) sets `--decay` on `document.documentElement`
on mount and every 60 seconds thereafter.

`app/globals.css` declares `--decay: 0` in `:root`, so the static export renders
fully green. No text is derived from `--decay` — only colors — so there is no
hydration mismatch.

### Color tokens

> **Correction (2026-07-29 final fix wave):** the roster table below originally
> listed invented hex values that did not come from the Figma exports — a
> `grep -ic` for each of `#3E8E43` / `#FF2D2D` / `#E0A82E` / `#2F5A34` returns 0
> in both `template/scene1.css` and `template/scene2.css`. It also claimed the
> roster accents "read identically in both mockups," which is false: `#FF9D00`
> (lost, scene1) becomes `#CFAC38` (lost, scene2), and the censor bar's
> background goes from `#446944` (scene1) to `#1E1F1F` (scene2). The values
> below are corrected against the actual exports; see
> `app/globals.css` for the live implementation.

Chrome tokens interpolate their scene1 value toward their scene2 value:

```css
--c-text: color-mix(in oklab, #38cf4e calc((1 - var(--decay)) * 100%), #ffffff);
--c-text-dim: color-mix(
  in oklab,
  #315933 calc((1 - var(--decay)) * 100%),
  #b3b3b3
);
--c-glow: color-mix(in oklab, #20b369 calc((1 - var(--decay)) * 100%), #620202);
--c-rule: color-mix(in oklab, #38cf4e calc((1 - var(--decay)) * 100%), #ffffff);
```

| Token          | Green     | Red       | Applied to                          |
| -------------- | --------- | --------- | ----------------------------------- |
| `--c-text`     | `#38CF4E` | `#FFFFFF` | countdown, labels, result sentence  |
| `--c-text-dim` | `#315933` | `#B3B3B3` | event tag, captions, event duration |
| `--c-glow`     | `#20B369` | `#620202` | blurred countdown layer             |
| `--c-rule`     | `#38CF4E` | `#FFFFFF` | dashed frames, hairline separators  |

Roster tokens are read off the "Survival List" region of the two Figma
exports (`Alive` / `Dead` / `Lost` / `Npc` layer labels, and the six
`Rectangle` censor-bar layers). Two of them are flat because the export uses
the same hex in both scenes; the other two genuinely shift, so they
interpolate like the chrome tokens above:

```css
--c-alive: #38cf4e;
--c-dead: #a40000;
--c-lost: color-mix(in oklab, #ff9d00 calc((1 - var(--decay)) * 100%), #cfac38);
--c-npc: #446944;
--c-censor: color-mix(
  in oklab,
  #446944 calc((1 - var(--decay)) * 100%),
  #1e1f1f
);
```

| Token        | Green     | Red              | Applied to         |
| ------------ | --------- | ---------------- | ------------------ |
| `--c-alive`  | `#38CF4E` | `#38CF4E` (flat) | alive names        |
| `--c-dead`   | `#A40000` | `#A40000` (flat) | dead names         |
| `--c-lost`   | `#FF9D00` | `#CFAC38`        | lost names         |
| `--c-npc`    | `#446944` | `#446944` (flat) | NPC names (dimmed) |
| `--c-censor` | `#446944` | `#1E1F1F`        | redaction bars     |

A single absolutely-positioned overlay carries scene2's gradient
(`linear-gradient(180deg, #FF0000 0%, rgba(115,115,115,0) 77.88%,
rgba(173,67,67,0.413462) 99.99%)`) at `opacity: var(--decay)` with
`pointer-events: none`. That gradient is fully transparent by 77.88%, so it
adds no extra tint over the roster — the roster's own color-mix tokens (above)
are what carries it from scene1 to scene2.

### Fonts

VT323 for Latin text and numerals, loaded via `next/font/google` (compatible
with `output: 'export'`).

VT323 contains no Thai glyphs, and the item names, descriptions, injuries, and
result sentence are all Thai. The stack is `VT323, Prompt, sans-serif` — Prompt
is the Thai face the Figma export itself declares — so Thai falls back cleanly
instead of rendering tofu.

### Typography scale

The Figma canvas is a fixed 1920px. Sizes become fluid:

| Element                | Figma                         | Responsive                       |
| ---------------------- | ----------------------------- | -------------------------------- |
| Countdown              | 96px, `letter-spacing: .15em` | `clamp(1.75rem, 7vw, 6rem)`      |
| Event duration         | 64px                          | `clamp(1.125rem, 3.4vw, 4rem)`   |
| System log / event tag | 36px                          | `clamp(0.75rem, 1.9vw, 2.25rem)` |

Dashed frames are `1px dashed var(--c-rule)`. The roster collapses from three
columns to one below the `sm` breakpoint.

## Data layer

### Items

`lib/items.ts` normalizes `lib/itemsData.json` at module load:

- `"public\\assets\\item\\01.png"` → `` `${BASE_PATH}/assets/item/01.png` ``
  (convert backslashes to forward slashes, strip the leading `public/`, prefix
  `NEXT_PUBLIC_BASE_PATH` so GitHub Pages sub-path deploys resolve).
- Exports `Item` type and `ITEMS: Item[]` — all 26 entries. The `isOnlyOne`,
  `ishidden`, and `isLocked` flags are carried on the type but do not filter the
  pool.

### Damage

`lib/damage.ts` exports `DAMAGES: string[]` — all 27 strings from
`lib/damageData.json`.

### Rolling

```ts
rollFate(): { item: Item; damage: string }
```

Uniform `Math.random()` draw from each pool, independent of the name. Called
only in response to a user click or Enter key, so it never runs during SSR.

### Roster

`lib/data.ts` changes:

```ts
export type CharacterStatus = "alive" | "dead" | "lost";

export interface Character {
  id: string;
  name: string;
  role: string;
  status: CharacterStatus;
  isNpc: boolean;
}
```

`isNpc` is a separate flag rather than a fourth enum member because NPC-ness and
aliveness are independent — the legend rule _"Npc — Alive if Dead, will censor"_
requires knowing both. The legend still renders four chips.

Rendering rules:

Evaluated top to bottom; the first matching row wins:

| Condition                    | Render                                    |
| ---------------------------- | ----------------------------------------- |
| `isNpc && status === 'dead'` | solid `--c-censor` bar, name not rendered |
| `isNpc`                      | name in `--c-npc`                         |
| `status === 'dead'`          | name in `--c-dead`                        |
| `status === 'lost'`          | name in `--c-lost`                        |
| `status === 'alive'`         | name in `--c-alive`                       |

The censor bar keeps the name's line height and takes a width derived from the
name's character count, so redactions vary in length like the mockups.

The existing seeded `mulberry32` generator and `FIRST_NAMES` / `LAST_NAMES`
pools are kept verbatim so the roster stays deterministic across builds. The
generator gains an `isNpc` assignment. `STATUS_SHORT_LABEL`, `STATUS_COLUMNS`,
and `groupByStatus` are updated to the new status names.

### Event dates

The existing constants and the mockup disagree: `EVENT_DEADLINE` is
`2026-08-22T00:00:00+07:00` and `EVENT_WINDOW_LABEL` reads
`ช่วงกิจกรรม 1 – 22 ส.ค. 2026`, while the mockup renders
`Event Duration: August 01 - 21, 2026`.

Resolution: `EVENT_START` and `EVENT_DEADLINE` are left untouched — they drive
both the countdown and `--decay`, and changing them would silently reschedule
the campaign. `EVENT_WINDOW_LABEL` is changed to
`Event Duration: August 01 - 21, 2026` to match the mockup's wording and
language. If the deadline itself is wrong, that is a one-line data change to
make separately.

## Component tree

```
app/page.tsx (server, calls getCharacters())
└── <main>                     noise-bg + <RedOverlay/> (opacity: --decay)
    ├── <SystemLog/>           "SYSTEM LOG V.2.0.1 - May 07, 2001" + hairline
    ├── <Emblem/>              murrwood seal
    ├── <EventTag/>            "#WTM_EVENT_05 : THE FINAL CHAPTER"
    ├── <Countdown/>    client two stacked layers: blur(5.25px) glow + sharp text
    ├── <EventWindow/>         EVENT_WINDOW_LABEL
    ├── <FateBox/>      client dashed frame, name input, Enter, result, item image
    └── <SurvivalList>         dashed frame
        ├── <CreditsRoll/> client  3 staggered scrolling columns
        ├── <Legend/>            4 status chips
        └── <SubmitBar/>   client name + status select + "Enter to Submit"
```

Reused with logic intact, markup and classes replaced:

- `components/Countdown.tsx` — countdown math unchanged; gains the duplicated
  blurred glow layer from the Figma export.
- `components/CreditsRoll.tsx` — the seamless `-50%` marquee and its
  `prefers-reduced-motion` handling are unchanged; the roster is sliced into
  thirds, each column given a slightly different `--credits-duration` so the
  columns do not scroll in lockstep.
- `components/Emblem.tsx` — reused as-is.

`components/CreditsRoll.tsx` becomes the child of `SurvivalList`, which owns the
dashed frame, legend, and submit bar.

## Interactions

### FateBox

- Enter key and the Enter button both submit.
- Empty or whitespace-only name → inline `> ERROR: NAME REQUIRED` in the result
  area; no roll occurs.
- Name is trimmed and capped at 40 characters.
- Every press re-rolls a fresh item and injury.
- Result sentence (scene1's 2-slot form, used in both phases):
  `< name > ได้รับ < item.name > โดยที่คุณจะมีโอกาส < damage >`
- Below the sentence: the item image, then the item's `description` as a dim
  caption.

### SubmitBar

- Native `<select>` for status, restyled to the terminal look with the mockup's
  `▼` glyph. Kept native for keyboard and mobile accessibility.
- Submitting calls `submitCharacter({ name, status })` in `lib/firebase.ts`,
  which currently no-ops and returns success, then prepends the entry into the
  roster's client state so it appears in the roll immediately.
- Session-only: a reload restores the seeded list. `submitCharacter()` is the
  single function to replace when the database goes live, mirroring how
  `getCharacters()` is already structured.
- Empty name is rejected the same way as FateBox.

## Error handling

| Case                     | Behavior                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Item image 404           | `onError` swaps in the `<Image of Item>` placeholder text                                             |
| Before `EVENT_START`     | `--decay` = 0; countdown shows the full remaining window                                              |
| After `EVENT_DEADLINE`   | `--decay` = 1; countdown pins to `0 Days 0 Hours 0 Minute left`                                       |
| `prefers-reduced-motion` | Marquee disabled (existing); color transitions freeze at the computed `--decay` rather than animating |
| Duplicate submitted name | Allowed; no deduplication                                                                             |

## Verification

The repo has no test infrastructure today. Add **vitest** covering pure
functions only — no DOM harness:

| Test             | Covers                                                       |
| ---------------- | ------------------------------------------------------------ |
| `decay.test.ts`  | boundaries, clamping, `deadline <= start` guard              |
| `items.test.ts`  | `imgUrl` normalization incl. base-path prefixing; 26 entries |
| `roll.test.ts`   | `rollFate()` draws only from the 26 / 27 pools               |
| `censor.test.ts` | the `isNpc && dead` predicate and the other three cases      |

Visual behavior is verified by running `npm run dev` and confirming
`npm run build` still produces a clean static export to `./out`.

## Out of scope

- Wiring Firebase Realtime Database for real (credentials, rules, `onValue()`).
- Authoring situation content or a `situationData.json`.
- Changing the GitHub Pages deploy workflow.
- Any refactor not required by the redesign.
