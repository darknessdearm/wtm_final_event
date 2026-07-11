import Countdown from '@/components/Countdown';
import Emblem from '@/components/Emblem';
import { getCharacters } from '@/lib/firebase';
import {
  groupByStatus,
  EVENT_START,
  EVENT_DEADLINE,
  EVENT_WINDOW_LABEL,
  SUBMISSION_FORM_URL,
  type StatusGroup,
} from '@/lib/data';

// The three randomised situation categories shown in the dark panel.
const SITUATIONS = [
  { n: 1, label: 'สถานการณ์' },
  { n: 2, label: 'ไอเทมอาวุธ' },
  { n: 3, label: 'อาการบาดเจ็บ' },
];

export default async function Home() {
  const characters = await getCharacters();
  const groups = groupByStatus(characters);

  return (
    <main className="flex min-h-screen items-start justify-center bg-neutral-800 px-4 py-6">
      <div className="w-full max-w-md overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/20">
        {/* ---- Header: emblem + live countdown ---- */}
        <header className="bg-neutral-200 px-6 py-8 text-center text-neutral-900">
          <Emblem className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-2xl font-bold leading-snug">
            <Countdown start={EVENT_START} deadline={EVENT_DEADLINE} />
          </h1>
          <p className="mt-2 text-xs text-neutral-600">{EVENT_WINDOW_LABEL}</p>
        </header>

        {/* ---- Randomised situation panel ---- */}
        <section className="bg-neutral-900 px-6 py-10 text-center text-neutral-100">
          <h2 className="text-xl font-medium">สุ่มสถานการณ์</h2>
          <ol className="mt-4 space-y-1 text-lg">
            {SITUATIONS.map((s) => (
              <li key={s.n}>
                {s.n}. {s.label}
              </li>
            ))}
          </ol>
        </section>

        {/* ---- Roster: survivors / dead / missing ---- */}
        <section className="bg-neutral-300 px-5 py-6 text-neutral-900">
          <h3 className="mb-4 text-sm font-medium">
            List รายชื่อตัวละคร (ตัวประกอบฉาก)
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {groups.map((group) => (
              <RosterColumn key={group.status} group={group} />
            ))}
          </div>

          {/* ---- Submission form button ---- */}
          <a
            href={SUBMISSION_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded bg-neutral-500 px-4 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-600"
          >
            ฟอร์มส่งชื่อตัวละคร พร้อมสถานะ รอด/ตาย/สาบสูญ (Week 3)
          </a>
        </section>

        {/* ---- Footer ---- */}
        <footer className="bg-neutral-900 py-4 text-center text-xs font-bold text-neutral-400">
          footer
        </footer>
      </div>
    </main>
  );
}

const STATUS_ACCENT: Record<StatusGroup['status'], string> = {
  survived: 'text-emerald-300',
  dead: 'text-red-300',
  missing: 'text-amber-300',
};

function RosterColumn({ group }: { group: StatusGroup }) {
  return (
    <div className="min-h-[180px] rounded bg-neutral-600 p-3 text-white">
      <p className={`mb-2 text-xs font-medium ${STATUS_ACCENT[group.status]}`}>
        {group.label}
      </p>
      {group.characters.length > 0 ? (
        <ul className="space-y-1 text-xs leading-relaxed text-neutral-100">
          {group.characters.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400">—</p>
      )}
    </div>
  );
}
