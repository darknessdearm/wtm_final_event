# WTM Final Event

Single-page event site built from the provided mockup.

- **Next.js 14** (App Router, static export via `output: 'export'`)
- **Tailwind CSS**
- **Firebase Realtime Database** — live, under the `final_event/` namespace
- Auto-deploys to **GitHub Pages** on push to `main`

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Run the unit tests:

```bash
npm test
```

Build the static site locally:

```bash
npm run build      # outputs ./out
```

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The
   [`Deploy to GitHub Pages`](.github/workflows/deploy.yml) workflow builds the
   static export and publishes it.

The site is served from `https://<user>.github.io/<repo>/`. The workflow sets
`PAGES_BASE_PATH=/<repo>` automatically so assets resolve under the sub-path —
no manual config needed even if you rename the repo.

## Firebase Realtime Database

### The `final_event/` namespace

The database instance is **shared with another app**, which owns the top-level
`/characters` and `/itemPool` nodes and stores a different schema there (map
areas, collected items, remaining quantities). Those nodes have no `status`
field and a different item catalogue, so this site does not read or write
either of them. Everything it touches lives under one subtree:

```
final_event/
  characters/<key>   { name, role, status, isNpc, createdAt }
  items/<itemId>     { id, name, description, imgUrl, isOnlyOne, ishidden, isLocked }
```

### Two kinds of roster entry

The key tells you which is which, and they follow different rules:

| | Seeded NPCs | Players |
| --- | --- | --- |
| Key | `c000`…`c114` | Firebase push ID (`-Oy…`) |
| Written by | `npm run seed` | the site's submit form |
| `isNpc` | `true` | `false` |
| Statuses | `alive`, `dead` | `alive`, `dead`, `lost` (Missing) |
| When dead | name struck through | name shown plainly |

`lost` is player-only — an NPC is either alive or censored. The invariants are
pinned by [`lib/data.test.ts`](lib/data.test.ts) on the seed side and by
[`database.rules.json`](database.rules.json) on the write side.

Seeded keys are zero-padded so the database's lexicographic child order
reproduces the roster's shuffle. Push IDs begin with `-`, which sorts ahead of
`c`, so new submissions appear at the top of the roll.

Because every seeded entry is an NPC, `NPC_DEAD_RATE` in
[`lib/data.ts`](lib/data.ts) doubles as the share of the credits roll that
renders struck through — currently ~52%.

### Setup

1. Copy [`.env.example`](.env.example) to `.env.local` and fill it in from
   Firebase Console → Project settings → Your apps.
2. Seed the subtree (safe to re-run — it skips nodes that already have data):

   ```bash
   npm run seed -- --dry-run   # preview
   npm run seed                # write
   ```

   `--force` replaces the seeded NPCs (`c000`…) while reading back and
   preserving every player submission, so re-seeding never deletes a name
   someone entered through the form. Requires Node ≥ 22.18.

### How it reads

`output: 'export'` renders at **build time**, so a server-side read would bake
in a snapshot that never updates. Instead:

- [`lib/firebase.ts`](lib/firebase.ts) — config, schema mapping, and the
  build-time roster. Imported by the server component, so it deliberately does
  **not** import the Firebase SDK.
- [`lib/firebaseClient.ts`](lib/firebaseClient.ts) — the SDK, `onValue()`
  subscriptions, and the submit write. Browser only, initialized lazily.

The static HTML ships with the full roster, then the client subscribes and
takes over live. Every live feature degrades to bundled data when the config is
absent or the read fails, so a build without secrets still produces a working
site and a permissions change can never blank the page.

### Security

> [!WARNING]
> The database is currently **world-readable and world-writable** — anyone who
> knows the URL can delete every node in it, including the other app's data.

[`database.rules.json`](database.rules.json) contains recommended rules that
close this: public read, create-only writes on `final_event/characters` (so
entries can't be edited or deleted from a browser), shape and length
validation, and `isNpc` pinned to `false` for public submissions — the form can
only ever create players, never NPCs. The other app's nodes are left as open as
they are today so nothing breaks.

These rules are **not deployed** — applying them needs console access:

```bash
firebase deploy --only database
```

Seed *before* deploying them: they intentionally forbid the bulk writes the
seed script makes.

### Deploying

The Pages workflow reads the same five variables from repository **variables**
(Settings → Secrets and variables → Actions → Variables), falling back to
secrets. Without them the deploy still succeeds — the site just runs on its
bundled data.

## Structure

| Path | What |
| --- | --- |
| `app/page.tsx` | The page: header chrome, fate panel, survival list |
| `app/layout.tsx` | Root layout, VT323 + Prompt fonts, metadata |
| `app/globals.css` | Scene tokens (`--decay` colour interpolation), credits-roll rules |
| `components/DecayClock.tsx` | Writes `--decay` on `<html>` from the campaign clock |
| `components/SystemLog.tsx` | Top-left banner line + its hairline |
| `components/Emblem.tsx` | Murrwood town seal (`<img>`, base-path prefixed) |
| `components/Countdown.tsx` | Live countdown with the mockup's glow treatment |
| `components/FateBox.tsx` | Name input → random item + injury |
| `components/SurvivalList.tsx` | Roster section: heading, legend, columns, submit bar |
| `components/StatusLegend.tsx` | The Alive / Dead / Lost / Npc legend chips |
| `components/SubmitBar.tsx` | "Add your name here" + status select + submit button |
| `components/CreditsRoll.tsx` | One scrolling roster column |
| `lib/decay.ts` | Campaign decay math (0 = green, 1 = red) |
| `lib/countdown.ts` | Countdown math and formatting |
| `lib/items.ts`, `lib/damage.ts`, `lib/roll.ts` | Item / injury pools and the draw |
| `lib/itemsData.json`, `lib/damageData.json` | Raw item / injury source data behind `items.ts` / `damage.ts` |
| `lib/censor.ts` | "Npc - Alive if Dead, will censor" rule |
| `lib/validateName.ts` | Shared name validation (FateBox + SubmitBar) |
| `lib/data.ts` | Types, seeded roster, event constants |
| `lib/firebase.ts` | Config, schema mapping, build-time roster (no SDK) |
| `lib/firebaseClient.ts` | Realtime Database subscriptions + writes (browser only) |
| `scripts/seed-final-event.mjs` | Seeds `final_event/` — `npm run seed` |
| `database.rules.json` | Recommended security rules (not deployed) |
