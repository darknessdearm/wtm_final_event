// ---------------------------------------------------------------------------
// Domain types + mock data.
//
// Everything here is placeholder content that mirrors the shape we expect from
// Firebase Realtime Database. When the DB is wired up (see lib/firebase.ts) the
// only thing that changes is *where* `getCharacters()` reads from — the rest of
// the UI keeps consuming the same `Character` shape.
// ---------------------------------------------------------------------------

/** รอด = survived, ตาย = dead, สาบสูญ = missing. */
export type CharacterStatus = 'survived' | 'dead' | 'missing';

export interface Character {
  id: string;
  /** ชื่อตัวละคร */
  name: string;
  /** บทบาท เช่น ตัวประกอบฉาก */
  role: string;
  status: CharacterStatus;
}

export interface StatusGroup {
  status: CharacterStatus;
  /** Thai label shown as the card heading. */
  label: string;
  characters: Character[];
}

// Countdown window (Thailand time, UTC+7). The header timer only runs between
// EVENT_START and EVENT_DEADLINE; outside that window it shows a placeholder.
// Change these two lines to reschedule. If you meant the *end* of Aug 22 rather
// than its first midnight, use '2026-08-23T00:00:00+07:00' for the deadline.
export const EVENT_START = '2026-08-01T00:00:00+07:00';
export const EVENT_DEADLINE = '2026-08-22T00:00:00+07:00';

/** Google Form (or similar) the footer button links to. Placeholder for now. */
export const SUBMISSION_FORM_URL = '#';

export const EVENT_TITLE = 'WTM Final Event';
export const EVENT_DESCRIPTION = 'สุ่มสถานการณ์ประจำสัปดาห์ · Week 3';
/** Small subtitle under the countdown showing the event window. */
export const EVENT_WINDOW_LABEL = 'ช่วงกิจกรรม 1 – 22 ส.ค. 2026';

const MOCK_CHARACTERS: Character[] = [
  { id: 'c01', name: 'สมชาย ใจกล้า', role: 'ตัวประกอบฉาก', status: 'survived' },
  { id: 'c02', name: 'มานี รักดี', role: 'ตัวประกอบฉาก', status: 'survived' },
  { id: 'c03', name: 'ปิติ ยินดี', role: 'ตัวประกอบฉาก', status: 'survived' },
  { id: 'c04', name: 'ชูใจ เมตตา', role: 'ตัวประกอบฉาก', status: 'dead' },
  { id: 'c05', name: 'วีระ อาจหาญ', role: 'ตัวประกอบฉาก', status: 'dead' },
  { id: 'c06', name: 'สุดา แสงทอง', role: 'ตัวประกอบฉาก', status: 'dead' },
  { id: 'c07', name: 'ก้อง ไพรวัลย์', role: 'ตัวประกอบฉาก', status: 'dead' },
  { id: 'c08', name: 'นภา ลอยเมฆ', role: 'ตัวประกอบฉาก', status: 'missing' },
  { id: 'c09', name: 'ธนา มั่งมี', role: 'ตัวประกอบฉาก', status: 'missing' },
];

/** Ordered status columns rendered in the roster section. */
export const STATUS_COLUMNS: { status: CharacterStatus; label: string }[] = [
  { status: 'survived', label: 'รายชื่อผู้รอดชีวิต' },
  { status: 'dead', label: 'รายชื่อผู้เสียชีวิต' },
  { status: 'missing', label: 'รายชื่อผู้สาบสูญ' },
];

/** Group a flat character list into the ordered status columns above. */
export function groupByStatus(characters: Character[]): StatusGroup[] {
  return STATUS_COLUMNS.map(({ status, label }) => ({
    status,
    label,
    characters: characters.filter((c) => c.status === status),
  }));
}

/** The mock source of truth. Swapped for Firebase in lib/firebase.ts. */
export function getMockCharacters(): Character[] {
  return MOCK_CHARACTERS;
}
