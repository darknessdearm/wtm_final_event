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
 * `items` lets the caller substitute the live pool read from Realtime Database
 * (see lib/firebaseClient.ts); it falls back to the bundled ITEMS, including
 * when handed an empty pool, so the draw always has something to return.
 *
 * Must never be called during render: it is non-deterministic and would break
 * the static export's hydration.
 */
export function rollFate(
  rand: () => number = Math.random,
  items: Item[] = ITEMS,
): Fate {
  return {
    item: pick(items.length > 0 ? items : ITEMS, rand),
    damage: pick(DAMAGES, rand),
  };
}
