# WTM Final Event

Single-page event site built from the provided mockup.

- **Next.js 14** (App Router, static export via `output: 'export'`)
- **Tailwind CSS**
- **Firebase Realtime Database** — currently **mocked**; see wiring guide below
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

## Wiring up Firebase (later)

Data flows through a single function, `getCharacters()` in
[`lib/firebase.ts`](lib/firebase.ts), which currently returns the mock data in
[`lib/data.ts`](lib/data.ts). To go live:

1. `npm install firebase`
2. Create a Firebase project + Realtime Database, add a web app, and copy its
   config into `.env.local` (see [`.env.example`](.env.example)).
3. Follow the commented wiring guide at the top of `lib/firebase.ts`.

> Note: `output: 'export'` renders at **build time**, so reads in
> `getCharacters()` produce a static snapshot. For live-updating lists, read
> from the client with Firebase's `onValue()` instead.

## Structure

| Path | What |
| --- | --- |
| `app/page.tsx` | The page: header chrome, fate panel, survival list |
| `app/layout.tsx` | Root layout, VT323 + Prompt fonts, metadata |
| `app/globals.css` | Scene tokens (`--decay` colour interpolation), credits-roll rules |
| `components/DecayClock.tsx` | Writes `--decay` on `<html>` from the campaign clock |
| `components/Countdown.tsx` | Live countdown with the mockup's glow treatment |
| `components/FateBox.tsx` | Name input → random item + injury |
| `components/SurvivalList.tsx` | Roster columns, legend, submit bar |
| `components/CreditsRoll.tsx` | One scrolling roster column |
| `lib/decay.ts` | Campaign decay math (0 = green, 1 = red) |
| `lib/countdown.ts` | Countdown math and formatting |
| `lib/items.ts`, `lib/damage.ts`, `lib/roll.ts` | Item / injury pools and the draw |
| `lib/censor.ts` | "Npc - Alive if Dead, will censor" rule |
| `lib/validateName.ts` | Shared name validation (FateBox + SubmitBar) |
| `lib/data.ts` | Types, seeded roster, event constants |
| `lib/firebase.ts` | Data access layer (swap mock → Firebase here) |
