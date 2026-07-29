import { getCharacters } from '@/lib/firebase';
import DecayClock from '@/components/DecayClock';
import { EVENT_START, EVENT_DEADLINE, EVENT_WINDOW_LABEL } from '@/lib/data';
import Emblem from '@/components/Emblem';
import SystemLog from '@/components/SystemLog';

// GitHub Pages project sites serve assets under /<repo>; plain CSS url() and
// <img> refs don't get that prefix automatically the way next/image does.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default async function Home() {
  const characters = await getCharacters();

  return (
    <main
      className="relative min-h-screen bg-black bg-cover bg-center font-term text-scene"
      style={{ backgroundImage: `url(${BASE_PATH}/assets/noise-bg.svg)` }}
    >
      <DecayClock start={EVENT_START} deadline={EVENT_DEADLINE} />
      <div className="scene-overlay" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <SystemLog />

        <header className="mt-10 text-center sm:mt-16">
          <Emblem className="mx-auto h-20 w-20 sm:h-28 sm:w-28" />

          <p className="mt-8 text-log tracking-term text-scene-dim">
            #WTM_EVENT_05 : THE FINAL CHAPTER
          </p>

          <p className="mt-6 text-window text-scene-dim">{EVENT_WINDOW_LABEL}</p>
        </header>
      </div>
    </main>
  );
}
