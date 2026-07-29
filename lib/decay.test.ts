import { describe, expect, it } from 'vitest';
import { computeDecay } from '@/lib/decay';

const START = Date.UTC(2026, 7, 1);
const END = Date.UTC(2026, 7, 22);

describe('computeDecay', () => {
  it('is 0 before the campaign starts', () => {
    expect(computeDecay(START - 86_400_000, START, END)).toBe(0);
  });

  it('is 0 exactly at the start', () => {
    expect(computeDecay(START, START, END)).toBe(0);
  });

  it('is 0.5 at the midpoint', () => {
    expect(computeDecay((START + END) / 2, START, END)).toBeCloseTo(0.5, 10);
  });

  it('is 1 exactly at the deadline', () => {
    expect(computeDecay(END, START, END)).toBe(1);
  });

  it('is 1 after the deadline', () => {
    expect(computeDecay(END + 86_400_000, START, END)).toBe(1);
  });

  it('returns 1 when the window is inverted or empty', () => {
    expect(computeDecay(START, END, START)).toBe(1);
    expect(computeDecay(START, START, START)).toBe(1);
  });

  it('returns 0 for non-finite inputs rather than NaN', () => {
    expect(computeDecay(NaN, START, END)).toBe(0);
    expect(computeDecay(START, NaN, END)).toBe(0);
  });
});
