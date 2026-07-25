import Countdown from '@/components/Countdown';
import Emblem from '@/components/Emblem';
import CreditsRoll from '@/components/CreditsRoll';
import { getCharacters } from '@/lib/firebase';
import {
  EVENT_START,
  EVENT_DEADLINE,
  EVENT_WINDOW_LABEL,
  SUBMISSION_FORM_URL,
} from '@/lib/data';

// The three randomised situation categories shown in the dark panel.
const SITUATIONS = [
  { n: 1, label: 'สถานการณ์' },
  { n: 2, label: 'ไอเทมอาวุธ' },
  { n: 3, label: 'อาการบาดเจ็บ' },
];

// GitHub Pages project sites serve assets under /<repo>; prefix with the
// configured base path (empty in local dev). Plain CSS url()/img refs don't get
// this prefix automatically the way next/image does.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default async function Home() {
  const characters = await getCharacters();

  return (
    <main
      className="flex h-screen flex-col overflow-hidden bg-neutral-900 bg-cover bg-center"
      style={{ backgroundImage: `url(${BASE_PATH}/assets/noise-bg.svg)` }}
    >
      {/* ---- Header: emblem + live countdown ---- */}
      <header className="bg-neutral-200 px-4 py-8 text-center text-neutral-900 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <Emblem className="mx-auto h-16 w-16 sm:h-20 sm:w-20" />
          <h1 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
            <Countdown start={EVENT_START} deadline={EVENT_DEADLINE} />
          </h1>
          <p className="mt-2 text-xs text-neutral-600 sm:text-sm">
            {EVENT_WINDOW_LABEL}
          </p>
        </div>
      </header>

      {/* ---- Randomised situation panel ---- */}
      <section className="px-4 py-8 text-center text-neutral-100 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-medium sm:text-2xl">สุ่มสถานการณ์</h2>
          <ol className="mt-4 space-y-1 text-lg sm:text-xl">
            {SITUATIONS.map((s) => (
              <li key={s.n}>
                {s.n}. {s.label}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Roster: end-credits roll — grows to fill the rest of the screen ---- */}
      <section className="flex min-h-0 flex-1 flex-col bg-neutral-300 px-4 py-6 text-neutral-900 sm:px-6">
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
          <h3 className="text-sm font-medium sm:text-base">Survived / Dead / Missing List</h3>
          {/* <p className="mb-3 mt-1 text-xs text-neutral-600">
            {characters.length} รายชื่อ · เลื่อนแบบเครดิตหนัง (ชี้ค้างเพื่อหยุด)
          </p> */}

          <CreditsRoll characters={characters} className="mt-3 flex-1" />

          {/* Colour legend for the three fates. */}
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-600 sm:text-xs">
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> รอด
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> ตาย
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> สาบสูญ
            </li>
          </ul>

          {/* ---- Submission form button ---- */}
          <a
            href={SUBMISSION_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded bg-neutral-500 px-4 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-600"
          >
            ฟอร์มส่งชื่อตัวละคร พร้อมสถานะ รอด/ตาย/สาบสูญ (Week 3)
          </a>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="py-4 text-center text-xs font-bold text-neutral-400">
        footer
      </footer>
    </main>
  );
}
