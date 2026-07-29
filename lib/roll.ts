// ---------------------------------------------------------------------------
// The fate draw behind the "What will happened with you?" panel.
//
// Every Enter press re-rolls: the draw is independent of the name typed, so
// the same person can keep pulling different outcomes.
// ---------------------------------------------------------------------------

import { DAMAGES } from './damage';
import { ITEMS, type Item } from './items';

export interface Fate {
  item: Item;
  damage: string;
}

function pick<T>(pool: T[], rand: () => number): T {
  return pool[Math.floor(rand() * pool.length)];
}

/**
 * Draw one item and one injury, uniformly and independently.
 *
 * `rand` is injectable for tests only — production callers use the default.
 * Must never be called during render: it is non-deterministic and would break
 * the static export's hydration.
 */
export function rollFate(rand: () => number = Math.random): Fate {
  return {
    item: pick(ITEMS, rand),
    damage: pick(DAMAGES, rand),
  };
}
