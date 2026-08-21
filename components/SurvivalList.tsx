"use client";

import { useEffect, useRef, useState } from "react";
import CreditsRoll from "@/components/CreditsRoll";
import StatusLegend from "@/components/StatusLegend";
import SubmitBar from "@/components/SubmitBar";
import type { Character } from "@/lib/data";
import { subscribeToCharacters } from "@/lib/firebaseClient";
import { intoColumns, upsertByName } from "@/lib/roster";

// Seconds each name spends crossing the viewport. Scaling the loop by the
// column's own length keeps the pace readable at every column count, instead of
// a short column whipping past while a long one crawls.
const SECONDS_PER_NAME = 2.2;

// Per-column multiplier so the columns don't scroll in lockstep — the effect
// the original layout got from hand-picked 82/96/74s durations, expressed as a
// ratio so it survives a change in cast size or column count.
const COLUMN_PACE = [1, 1.12, 0.9];

/** Column count per breakpoint, widest first — the first match wins. */
const COLUMN_BREAKPOINTS = [
  { query: "(min-width: 1024px)", columns: 3 },
  { query: "(min-width: 640px)", columns: 2 },
];

/** Narrower than every breakpoint above. */
const MOBILE_COLUMNS = 1;

// What the static export renders, before any viewport is known. See the note
// in useColumnCount() for why this can't be measured during the first render.
const PRERENDER_COLUMNS = 3;

/**
 * Columns to split the roster into, tracking the viewport.
 *
 * The static export has no viewport to measure, so it emits the desktop layout
 * and this corrects it after hydration. Reading matchMedia during the first
 * client render instead would disagree with the server HTML and trip a
 * hydration mismatch.
 *
 * The correction is cheap: every column sits in one grid row of fixed height,
 * so changing the count only redistributes names horizontally — the frame never
 * changes height and nothing below it moves.
 */
function useColumnCount(): number {
  const [columns, setColumns] = useState(PRERENDER_COLUMNS);

  useEffect(() => {
    const matchers = COLUMN_BREAKPOINTS.map(({ query, columns: count }) => ({
      count,
      mql: window.matchMedia(query),
    }));

    const apply = () =>
      setColumns(matchers.find((m) => m.mql.matches)?.count ?? MOBILE_COLUMNS);

    apply();
    matchers.forEach((m) => m.mql.addEventListener("change", apply));
    return () =>
      matchers.forEach((m) => m.mql.removeEventListener("change", apply));
  }, []);

  return columns;
}

export default function SurvivalList({
  characters,
}: {
  characters: Character[];
}) {
  const [roster, setRoster] = useState<Character[]>(characters);

  // Whether snapshots are actually arriving — which is not the same as whether
  // Firebase is configured. If reads are denied the subscription stays silent,
  // and submissions still need the local insert in onSubmitted below.
  const isLive = useRef(false);

  // `characters` is the build-time roster baked into the static export, so the
  // columns are full on first paint. Once the live subscription delivers a
  // snapshot it takes over and every later change — including other people's
  // submissions — arrives without a reload.
  //
  // An empty or unreadable node leaves the bundled roster in place rather than
  // blanking the credits roll, so a permissions change can't empty the page.
  useEffect(() => {
    return subscribeToCharacters((next) => {
      if (next.length === 0) return;
      isLive.current = true;
      setRoster(next);
    });
  }, []);

  const columnCount = useColumnCount();
  const columns = intoColumns(roster, columnCount);

  return (
    <section className="mt-16 sm:mt-24">
      <h2 className="text-window text-scene">Survival List</h2>
      <hr className="mt-4 h-px border-0 bg-scene-rule" />
      <StatusLegend />
      <div
        className="frame-dashed mt-6 grid gap-x-8 p-4 sm:p-6"
        // Inline rather than a Tailwind class: the count is decided at runtime,
        // and `grid-cols-${n}` would be built dynamically, which Tailwind's
        // build-time scanner cannot see and would purge.
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column, i) => (
          <CreditsRoll
            key={i}
            characters={column}
            durationSec={Math.max(
              40,
              Math.round(
                column.length *
                  SECONDS_PER_NAME *
                  COLUMN_PACE[i % COLUMN_PACE.length],
              ),
            )}
            className="h-[320px] text-center sm:h-[480px]"
            // A lone column needs no ordinal — CreditsRoll falls back to the
            // plain "Survival list" label.
            columnIndex={columnCount > 1 ? i : undefined}
            columnCount={columnCount > 1 ? columnCount : undefined}
          />
        ))}
      </div>
      // Close Form
      {/* <SubmitBar
        onSubmitted={(character) => {
          // Firebase applies a write to its local cache *before* push()
          // resolves, so the subscription has already delivered this entry by
          // the time SubmitBar calls back — inserting it again would show the
          // name twice, and it would stay doubled until the next snapshot.
          // Only the offline path still needs the local insert, and it upserts
          // by name for the same reason submitCharacter() does.
          if (isLive.current) return;
          setRoster((prev) => upsertByName(prev, character));
        }}
      /> */}
    </section>
  );
}
