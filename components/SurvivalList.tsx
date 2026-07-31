"use client";

import { useEffect, useRef, useState } from "react";
import CreditsRoll from "@/components/CreditsRoll";
import StatusLegend from "@/components/StatusLegend";
import SubmitBar from "@/components/SubmitBar";
import type { Character } from "@/lib/data";
import { subscribeToCharacters } from "@/lib/firebaseClient";

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
            columnIndex={i}
            columnCount={columns.length}
          />
        ))}
      </div>

      <SubmitBar
        onSubmitted={(character) => {
          // Firebase applies a write to its local cache *before* push()
          // resolves, so the subscription has already delivered this entry by
          // the time SubmitBar calls back — inserting it again would show the
          // name twice, and it would stay doubled until the next snapshot.
          // Only the offline path still needs the local insert.
          if (isLive.current) return;
          setRoster((prev) => [character, ...prev]);
        }}
      />
    </section>
  );
}
