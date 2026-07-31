"use client";

import { useEffect, useRef, useState } from "react";
import CreditsRoll from "@/components/CreditsRoll";
import StatusLegend from "@/components/StatusLegend";
import SubmitBar from "@/components/SubmitBar";
import type { Character } from "@/lib/data";
import { subscribeToCharacters } from "@/lib/firebaseClient";
import { upsertByName } from "@/lib/roster";

// Seconds each name spends crossing the viewport. The roll is one column on
// every breakpoint now, so the loop has to grow with the cast to keep a
// readable pace — this matches the ~2.2s per name the old three-column layout
// scrolled at, rather than tripling the speed to fit the same loop length.
const SECONDS_PER_NAME = 2.2;

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

  return (
    <section className="mt-16 sm:mt-24">
      <h2 className="text-window text-scene">Survival List</h2>
      <hr className="mt-4 h-px border-0 bg-scene-rule" />

      <StatusLegend />

      <div className="frame-dashed mt-6 p-4 sm:p-6">
        <CreditsRoll
          characters={roster}
          durationSec={Math.round(roster.length * SECONDS_PER_NAME)}
          className="h-[320px] text-center sm:h-[480px]"
        />
      </div>

      <SubmitBar
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
      />
    </section>
  );
}
