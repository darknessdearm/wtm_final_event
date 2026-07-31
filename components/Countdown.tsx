'use client';

import { useEffect, useState } from 'react';
import {
  computeCountdown,
  formatCountdown,
  type CountdownState,
} from '@/lib/countdown';

/**
 * Live countdown in the mockup's two-layer treatment: a blurred glow copy sat
 * behind a sharp copy.
 *
 * The first render uses `now = start`, which is deterministic from props, so
 * the server and the client's first paint agree. The effect then takes over
 * with real time.
 *
 * `displayDays` compresses the clock — see COUNTDOWN_DISPLAY_DAYS in
 * lib/data.ts. It only changes what the banner reads, never the real deadline.
 */
export default function Countdown({
  start,
  deadline,
  displayDays = null,
}: {
  start: string;
  deadline: string;
  displayDays?: number | null;
}) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(deadline).getTime();
  const displayWindowMs =
    displayDays === null ? undefined : displayDays * 86_400_000;

  const [state, setState] = useState<CountdownState>(() =>
    computeCountdown(startMs, startMs, endMs, displayWindowMs),
  );

  useEffect(() => {
    const tick = () =>
      setState(computeCountdown(Date.now(), startMs, endMs, displayWindowMs));
    tick();
    // The displayed clock runs slower than real time, but still tick every
    // second: the compressed minute boundary can fall on any real second.
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs, endMs, displayWindowMs]);

  const text = formatCountdown(state);

  return (
    <span className="relative inline-block">
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-countdown tracking-countdown text-scene-glow blur-[5.25px]"
      >
        {text}
      </span>
      <span className="relative flex items-center justify-center whitespace-nowrap text-countdown tracking-countdown text-scene">
        {text}
      </span>
    </span>
  );
}
