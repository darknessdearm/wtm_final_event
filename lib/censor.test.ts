import { describe, expect, it } from 'vitest';
import { censorWidthCh, isCensored } from '@/lib/censor';
import { getMockCharacters } from '@/lib/data';

describe('isCensored', () => {
  it('censors a dead NPC', () => {
    expect(isCensored({ status: 'dead', isNpc: true })).toBe(true);
  });

  it('does not censor a living NPC', () => {
    expect(isCensored({ status: 'alive', isNpc: true })).toBe(false);
  });

  it('does not censor a lost NPC', () => {
    expect(isCensored({ status: 'lost', isNpc: true })).toBe(false);
  });

  it('does not censor a dead player character', () => {
    expect(isCensored({ status: 'dead', isNpc: false })).toBe(false);
  });
});

describe('censorWidthCh', () => {
  it('scales with the name length', () => {
    expect(censorWidthCh('Ethan Cole')).toBe(10);
  });

  it('clamps very short names up to a readable minimum', () => {
    expect(censorWidthCh('Al')).toBe(6);
  });

  it('clamps very long names down to the column width', () => {
    expect(censorWidthCh('Bartholomew Winterbottom')).toBe(18);
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

  it('produces at least one censored entry', () => {
    expect(roster.some(isCensored)).toBe(true);
  });
});
