// ---------------------------------------------------------------------------
// Item pool.
//
// itemsData.json is authored on Windows and stores repo-relative paths
// ("public\\assets\\item\\01.png"). The browser needs a URL rooted at the
// deployed base path instead, so every path is normalized once at module load.
// ---------------------------------------------------------------------------

import itemsData from './itemsData.json';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export interface Item {
  id: string;
  /** ชื่อไอเทม */
  name: string;
  /** คำอธิบายไอเทม */
  description: string;
  /** Browser-ready URL (already base-path prefixed). */
  imgUrl: string;
  isOnlyOne: boolean;
  ishidden: boolean;
  isLocked: boolean;
}

/**
 * "public\\assets\\item\\01.png" -> "/assets/item/01.png" (plus base path).
 *
 * The flags on Item are deliberately NOT used to filter the pool — every one
 * of the 26 items is drawable. They are kept so a future change can gate them
 * without reshaping the data.
 */
export function normalizeImgUrl(raw: string, basePath: string = BASE_PATH): string {
  const path = raw
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^public\//, '');
  return `${basePath}/${path}`;
}

export const ITEMS: Item[] = (itemsData as Item[]).map((item) => ({
  ...item,
  imgUrl: normalizeImgUrl(item.imgUrl),
}));
