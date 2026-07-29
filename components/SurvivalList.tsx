"use client";

import { useState } from "react";
import CreditsRoll from "@/components/CreditsRoll";
import StatusLegend from "@/components/StatusLegend";
import SubmitBar from "@/components/SubmitBar";
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
  const [roster, setRoster] = useState<Character[]>(characters);
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
        onSubmitted={(character) => setRoster((prev) => [character, ...prev])}
      />
    </section>
  );
}
