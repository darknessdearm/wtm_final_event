import { describe, expect, it } from 'vitest';
import {
  CHARACTERS_PATH,
  DEFAULT_ROLE,
  ITEMS_PATH,
  toCharacter,
  toCharacters,
  toItem,
  toItems,
} from '@/lib/firebase';

// Records under final_event/ are hand-editable in the Firebase console and the
// database is shared with another app, so the mappers are the boundary that
// keeps malformed or foreign data out of the UI.

describe('paths', () => {
  it('stay inside the final_event namespace', () => {
    // The other app owns the top-level /characters and /itemPool nodes.
    expect(CHARACTERS_PATH).toBe('final_event/characters');
    expect(ITEMS_PATH).toBe('final_event/items');
  });
});

describe('toCharacter', () => {
  const valid = {
    name: 'Erin Giver',
    role: 'ตัวประกอบฉาก',
    status: 'dead',
    isNpc: true,
  };

  it('maps a well-formed record, taking id from the key', () => {
    expect(toCharacter('c007', valid)).toEqual({
      id: 'c007',
      name: 'Erin Giver',
      role: 'ตัวประกอบฉาก',
      status: 'dead',
      isNpc: true,
    });
  });

  it('trims the name', () => {
    // The shared database already contains names differing only by a trailing
    // space, which would otherwise render as separate roster lines.
    expect(toCharacter('c1', { ...valid, name: '  Erin Giver  ' })?.name).toBe(
      'Erin Giver',
    );
  });

  it('drops records with no usable name', () => {
    expect(toCharacter('c1', { ...valid, name: '   ' })).toBeNull();
    expect(toCharacter('c1', { ...valid, name: 42 })).toBeNull();
    expect(toCharacter('c1', {})).toBeNull();
    expect(toCharacter('c1', null)).toBeNull();
    expect(toCharacter('c1', 'not an object')).toBeNull();
  });

  it('falls back to alive for a missing or unknown status', () => {
    expect(toCharacter('c1', { name: 'A' })?.status).toBe('alive');
    expect(toCharacter('c1', { name: 'A', status: 'ghost' })?.status).toBe(
      'alive',
    );
  });

  it('defaults role and treats isNpc as strictly boolean', () => {
    const mapped = toCharacter('c1', { name: 'A', isNpc: 'yes' });
    expect(mapped?.role).toBe(DEFAULT_ROLE);
    // A truthy non-boolean must not make someone an NPC — that would censor
    // them if they were also dead (see lib/censor.ts).
    expect(mapped?.isNpc).toBe(false);
  });
});

describe('toCharacters', () => {
  it('preserves key order and skips unusable entries', () => {
    const mapped = toCharacters({
      c000: { name: 'First', status: 'alive' },
      c001: { name: '' },
      c002: { name: 'Second', status: 'lost' },
    });
    expect(mapped.map((c) => c.name)).toEqual(['First', 'Second']);
    expect(mapped[1].status).toBe('lost');
  });

  it('returns an empty list for an absent node', () => {
    // An empty roster leaves the caller on the bundled one rather than
    // blanking the credits roll.
    expect(toCharacters(null)).toEqual([]);
    expect(toCharacters(undefined)).toEqual([]);
  });
});

describe('toItem', () => {
  const valid = {
    id: 'item-1',
    name: 'ไฟฉาย',
    description: 'อุปกรณ์ส่องสว่างแบบพกพา',
    imgUrl: 'public\\assets\\item\\01.png',
    isOnlyOne: true,
    ishidden: false,
    isLocked: false,
  };

  it('normalizes the stored Windows-style image path', () => {
    expect(toItem('item-1', valid)?.imgUrl).toBe('/assets/item/01.png');
  });

  it('falls back to the key when the record has no id', () => {
    const { id, ...withoutId } = valid;
    void id;
    expect(toItem('item-9', withoutId)?.id).toBe('item-9');
  });

  it('drops records missing a name or image', () => {
    expect(toItem('item-1', { ...valid, name: '  ' })).toBeNull();
    expect(toItem('item-1', { ...valid, imgUrl: '' })).toBeNull();
    expect(toItem('item-1', null)).toBeNull();
  });
});

describe('toItems', () => {
  it('maps a node and ignores unusable entries', () => {
    const mapped = toItems({
      'item-1': {
        name: 'ไฟฉาย',
        imgUrl: 'public\\assets\\item\\01.png',
      },
      'item-2': { name: 'broken — no image' },
    });
    expect(mapped).toHaveLength(1);
    expect(mapped[0].id).toBe('item-1');
  });

  it('returns an empty list for an absent node', () => {
    expect(toItems(null)).toEqual([]);
  });
});
