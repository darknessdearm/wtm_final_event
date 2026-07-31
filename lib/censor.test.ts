import { describe, expect, it } from 'vitest';
import { isCensored } from '@/lib/censor';
import { getMockCharacters } from '@/lib/data';

describe('isCensored', () => {
  it('strikes through a dead NPC', () => {
    expect(isCensored({ status: 'dead', isNpc: true })).toBe(true);
  });

  it('leaves a living NPC alone', () => {
    expect(isCensored({ status: 'alive', isNpc: true })).toBe(false);
  });

  it('leaves a lost NPC alone', () => {
    expect(isCensored({ status: 'lost', isNpc: true })).toBe(false);
  });

  it('leaves a dead player alone', () => {
    // Players are struck through only if they are also NPCs, which the submit
    // form never creates.
    expect(isCensored({ status: 'dead', isNpc: false })).toBe(false);
  });
});

describe('roster', () => {
  const roster = getMockCharacters();

  it('uses only the three current statuses', () => {
    for (const c of roster) {
      expect(['alive', 'dead', 'lost']).toContain(c.status);
    }
  });

  it('marks every character with an explicit npc flag', () => {
    for (const c of roster) {
      expect(typeof c.isNpc).toBe('boolean');
    }
  });

  it('produces at least one struck-through entry', () => {
    expect(roster.some(isCensored)).toBe(true);
  });
});
