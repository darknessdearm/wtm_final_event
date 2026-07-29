import { getCharacters } from '@/lib/firebase';

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
      <div className="scene-overlay" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <p className="text-log tracking-term">Roster: {characters.length}</p>
      </div>
    </main>
  );
}
