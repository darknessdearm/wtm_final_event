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
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-countdown tracking-countdown text-scene-glow blur-[5.25px]"
      >
        {text}
      </span>
      <span className="relative flex items-center justify-center whitespace-nowrap text-countdown tracking-countdown text-scene">
        {text}
      </span>
    </div>
  );
}
