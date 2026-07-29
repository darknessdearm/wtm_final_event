import { describe, expect, it } from 'vitest';
import { DAMAGES } from '@/lib/damage';
import { ITEMS } from '@/lib/items';
import { rollFate } from '@/lib/roll';

describe('DAMAGES', () => {
  it('exposes every injury in the source file', () => {
    expect(DAMAGES).toHaveLength(27);
    expect(DAMAGES[0]).toBe('ไม่ได้บาดเจ็บ');
  });
});

describe('rollFate', () => {
  it('returns the first entry when the generator yields 0', () => {
    const fate = rollFate(() => 0);
    expect(fate.item).toBe(ITEMS[0]);
    expect(fate.damage).toBe(DAMAGES[0]);
  });

  it('returns the last entry when the generator approaches 1', () => {
    const fate = rollFate(() => 0.999_999);
    expect(fate.item).toBe(ITEMS[ITEMS.length - 1]);
    expect(fate.damage).toBe(DAMAGES[DAMAGES.length - 1]);
  });

  it('never draws outside the pools', () => {
    for (let i = 0; i < 500; i++) {
      const fate = rollFate();
      expect(ITEMS).toContain(fate.item);
      expect(DAMAGES).toContain(fate.damage);
    }
  });

  it('draws item and damage independently', () => {
    // Alternating generator: item takes the 1st call, damage the 2nd.
    const values = [0, 0.999_999];
    let i = 0;
    const fate = rollFate(() => values[i++]);
    expect(fate.item).toBe(ITEMS[0]);
    expect(fate.damage).toBe(DAMAGES[DAMAGES.length - 1]);
  });
});
