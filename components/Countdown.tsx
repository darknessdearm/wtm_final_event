'use client';

import { useEffect, useState } from 'react';

type Phase = 'before' | 'active' | 'ended';

interface CountdownState {
  phase: Phase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeState(start: number, end: number): CountdownState {
  const now = Date.now();
  if (now < start) {
    return { phase: 'before', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  if (now >= end) {
    return { phase: 'ended', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diff = end - now;
  return {
    phase: 'active',
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

/**
 * Live countdown that only runs inside the [start, deadline] window.
 * Before the window opens or after it closes it renders a placeholder clock.
 * Renders a neutral placeholder before hydration so the static export stays
 * deterministic (no server/client mismatch).
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
  const [state, setState] = useState<CountdownState | null>(null);

  useEffect(() => {
    setState(computeState(startMs, endMs));
    const id = setInterval(() => setState(computeState(startMs, endMs)), 1000);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  // Pre-hydration and "not started yet": dormant placeholder clock.
  if (!state || state.phase === 'before') {
    return (
      <span className="tabular-nums text-neutral-400">
        -- days -- hours -- minutes
      </span>
    );
  }

  if (state.phase === 'ended') {
    return <span>หมดเวลาแล้ว</span>;
  }

  return (
    <span className="tabular-nums">
      {state.days} days {state.hours} hours {state.minutes} minutes{' '}
      {String(state.seconds).padStart(2, '0')}s left
    </span>
  );
}
