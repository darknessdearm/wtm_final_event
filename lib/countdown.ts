// ---------------------------------------------------------------------------
// Countdown math.
//
// Pure and `now`-injected so the component can render a deterministic first
// frame on the server and only switch to real time after hydration.
// ---------------------------------------------------------------------------

export type CountdownPhase = 'before' | 'active' | 'ended';

export interface CountdownState {
  phase: CountdownPhase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function breakdown(diff: number, phase: CountdownPhase): CountdownState {
  return {
    phase,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

/**
 * Time left until `deadline`. Before the campaign opens this reports the full
 * window rather than a placeholder, so the banner always shows a real number.
 *
 * `displayWindowMs` compresses the clock for effect: the remaining time is
 * scaled so that the full campaign reads as that much time instead of its real
 * length. A 21-day window shown as 3 days ticks at 3/21 of a wall clock — seven
 * times slower — while still hitting zero exactly at `deadline`. Omit it and
 * the countdown is real time.
 */
export function computeCountdown(
  now: number,
  start: number,
  deadline: number,
  displayWindowMs?: number,
): CountdownState {
  if (now >= deadline) {
    return { phase: 'ended', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const window = deadline - start;
  // Guard a zero-length window so a misconfigured pair of dates can't divide
  // by zero and render NaN across the banner.
  const scale =
    displayWindowMs === undefined || window <= 0 ? 1 : displayWindowMs / window;

  if (now < start) {
    return breakdown(window * scale, 'before');
  }
  return breakdown((deadline - now) * scale, 'active');
}

/** "2 Days 12 Hours 24 Minute left" — the mockup's exact wording. */
export function formatCountdown(state: CountdownState): string {
  return `${state.days} Days ${state.hours} Hours ${state.minutes} Minute left`;
}
