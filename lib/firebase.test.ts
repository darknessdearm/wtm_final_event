import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('isFirebaseConfigured', () => {
  // A deploy whose CI variables are missing or misnamed fails silently — the
  // site just stops updating. These pin the switch that decides which way it
  // goes, and the suite below proves the "off" side still works.
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it('is false when the config is absent or blank', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', '');
    const { isFirebaseConfigured } = await import('@/lib/firebase');
    expect(isFirebaseConfigured()).toBe(false);
  });

  it('needs the database URL, not just the key', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', '');
    const { isFirebaseConfigured } = await import('@/lib/firebase');
    expect(isFirebaseConfigured()).toBe(false);
  });

  it('is true once both are present', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv(
      'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
      'https://example-default-rtdb.firebasedatabase.app',
    );
    const { isFirebaseConfigured } = await import('@/lib/firebase');
    expect(isFirebaseConfigured()).toBe(true);
  });
});

describe('the client layer with no configuration', () => {
  // vitest runs without .env, so this is the unconfigured build: a fork, a
  // preview, or a deploy whose repository variables were never set.
  it('stays inert instead of throwing, so the page can never blank', async () => {
    const { subscribeToCharacters, subscribeToItems, submitCharacter, isLive } =
      await import('@/lib/firebaseClient');

    expect(isLive()).toBe(false);

    const delivered: unknown[] = [];
    const unsubCharacters = subscribeToCharacters((c) => delivered.push(c));
    const unsubItems = subscribeToItems((i) => delivered.push(i));

    // Never delivers, so callers keep the roster and item pool they shipped
    // with rather than being handed an empty list.
    expect(delivered).toEqual([]);
    expect(() => unsubCharacters()).not.toThrow();
    expect(() => unsubItems()).not.toThrow();

    // The submit form still "works" — it resolves without writing, and
    // SubmitBar shows the name locally.
    await expect(
      submitCharacter({ name: 'Someone', status: 'lost' }),
    ).resolves.toBeUndefined();
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
