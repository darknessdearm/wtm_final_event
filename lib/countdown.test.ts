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
