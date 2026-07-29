import { describe, expect, it } from 'vitest';
import { ITEMS, normalizeImgUrl } from '@/lib/items';

describe('normalizeImgUrl', () => {
  it('converts Windows separators to URL separators', () => {
    expect(normalizeImgUrl('public\\assets\\item\\01.png', '')).toBe(
      '/assets/item/01.png',
    );
  });

  it('strips the leading public/ segment', () => {
    expect(normalizeImgUrl('public/assets/item/26.png', '')).toBe(
      '/assets/item/26.png',
    );
  });

  it('prefixes the deploy base path', () => {
    expect(normalizeImgUrl('public\\assets\\item\\02.png', '/wtm_final_event')).toBe(
      '/wtm_final_event/assets/item/02.png',
    );
  });

  it('never produces a doubled slash', () => {
    expect(normalizeImgUrl('/public/assets/item/03.png', '')).not.toContain('//');
  });
});

describe('ITEMS', () => {
  it('exposes every item in the source file', () => {
    expect(ITEMS).toHaveLength(26);
  });

  it('normalizes every image path', () => {
    for (const item of ITEMS) {
      expect(item.imgUrl).toMatch(/\/assets\/item\/\d{2}\.png$/);
      expect(item.imgUrl).not.toContain('\\');
      expect(item.imgUrl).not.toContain('public/');
    }
  });

  it('keeps ids, names and descriptions intact', () => {
    for (const item of ITEMS) {
      expect(item.id).toMatch(/^item-\d+$/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});
