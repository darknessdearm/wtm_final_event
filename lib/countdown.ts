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
 */
export function computeCountdown(
  now: number,
  start: number,
  deadline: number,
): CountdownState {
  if (now >= deadline) {
    return { phase: 'ended', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  if (now < start) {
    return breakdown(deadline - start, 'before');
  }
  return breakdown(deadline - now, 'active');
}

/** "2 Days 12 Hours 24 Minute left" — the mockup's exact wording. */
export function formatCountdown(state: CountdownState): string {
  return `${state.days} Days ${state.hours} Hours ${state.minutes} Minute left`;
}
