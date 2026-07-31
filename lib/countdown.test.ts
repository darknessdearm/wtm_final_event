import { describe, expect, it } from 'vitest';
import { computeCountdown, formatCountdown } from '@/lib/countdown';

const START = Date.UTC(2026, 7, 1);
const END = Date.UTC(2026, 7, 22);
const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

describe('computeCountdown', () => {
  it('reports the full window before the campaign starts', () => {
    const state = computeCountdown(START - DAY, START, END);
    expect(state.phase).toBe('before');
    expect(state.days).toBe(21);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
  });

  it('breaks the remaining time down while active', () => {
    const now = END - (2 * DAY + 12 * HOUR + 24 * MINUTE);
    const state = computeCountdown(now, START, END);
    expect(state.phase).toBe('active');
    expect(state.days).toBe(2);
    expect(state.hours).toBe(12);
    expect(state.minutes).toBe(24);
  });

  it('zeroes out at and after the deadline', () => {
    expect(computeCountdown(END, START, END)).toMatchObject({
      phase: 'ended',
      days: 0,
      hours: 0,
      minutes: 0,
    });
    expect(computeCountdown(END + DAY, START, END).phase).toBe('ended');
  });
});

describe('computeCountdown with a compressed display window', () => {
  // The real campaign is 21 days but reads as 3, so the banner advances at
  // 3/21 of a wall clock — seven times slower — and still lands on zero
  // exactly at the deadline.
  const DISPLAY = 3 * DAY;

  it('shows the compressed window before the campaign opens', () => {
    const state = computeCountdown(START - DAY, START, END, DISPLAY);
    expect(state.phase).toBe('before');
    expect(state.days).toBe(3);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
  });

  it('still reads the compressed window at the moment it opens', () => {
    expect(computeCountdown(START, START, END, DISPLAY)).toMatchObject({
      phase: 'active',
      days: 3,
      hours: 0,
      minutes: 0,
    });
  });

  it('advances seven times slower than real time', () => {
    // Seven real days in, the display has given up exactly one of its days.
    const state = computeCountdown(START + 7 * DAY, START, END, DISPLAY);
    expect(state.days).toBe(2);
    expect(state.hours).toBe(0);
    expect(state.minutes).toBe(0);
  });

  it('turns one real day into ~3h26m of displayed time', () => {
    const a = computeCountdown(START, START, END, DISPLAY);
    const b = computeCountdown(START + DAY, START, END, DISPLAY);
    const asMinutes = (s: { days: number; hours: number; minutes: number }) =>
      s.days * 1440 + s.hours * 60 + s.minutes;

    // 3 display days over 21 real days is 1440/7 = 205.7 minutes per real day.
    // breakdown() floors each component, so the drop reads as 205 or 206
    // depending on where the two samples fall.
    const drop = asMinutes(a) - asMinutes(b);
    expect(drop).toBeGreaterThanOrEqual(205);
    expect(drop).toBeLessThanOrEqual(206);
  });

  it('still hits zero exactly at the deadline', () => {
    expect(computeCountdown(END, START, END, DISPLAY)).toMatchObject({
      phase: 'ended',
      days: 0,
      hours: 0,
      minutes: 0,
    });
  });

  it('is real time when no display window is given', () => {
    expect(computeCountdown(START, START, END)).toMatchObject({ days: 21 });
  });

  it('does not divide by zero on a zero-length campaign', () => {
    const state = computeCountdown(START, START, START, DISPLAY);
    expect(state.phase).toBe('ended');
    expect(Number.isNaN(state.days)).toBe(false);
  });
});

describe('formatCountdown', () => {
  it('matches the mockup wording', () => {
    const now = END - (2 * DAY + 12 * HOUR + 24 * MINUTE);
    expect(formatCountdown(computeCountdown(now, START, END))).toBe(
      '2 Days 12 Hours 24 Minute left',
    );
  });

  it('reads all zeroes once the deadline passes', () => {
    expect(formatCountdown(computeCountdown(END, START, END))).toBe(
      '0 Days 0 Hours 0 Minute left',
    );
  });
});
