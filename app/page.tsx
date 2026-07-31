import { getCharacters } from "@/lib/firebase";
import DecayClock from "@/components/DecayClock";
import {
  EVENT_START,
  EVENT_DEADLINE,
  EVENT_WINDOW_LABEL,
  COUNTDOWN_DISPLAY_DAYS,
} from "@/lib/data";
import Emblem from "@/components/Emblem";
import SystemLog from "@/components/SystemLog";
import Countdown from "@/components/Countdown";
import FateBox from "@/components/FateBox";
import SurvivalList from "@/components/SurvivalList";

// GitHub Pages project sites serve assets under /<repo>; plain CSS url() and
// <img> refs don't get that prefix automatically the way next/image does.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default async function Home() {
  const characters = await getCharacters();

  return (
    <main
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "20px", // Example padding
      }}
    >
      <div
        className="relative min-h-screen bg-black bg-cover bg-center font-term text-scene"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${BASE_PATH}/assets/noise-bg-02.svg)`,
          opacity: 0.3, // Adjust this value (0.0 to 1.0)
          zIndex: -1,
        }}
      />
      <DecayClock start={EVENT_START} deadline={EVENT_DEADLINE} />
      <div className="scene-overlay" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <SystemLog />

        <header className="mt-10 text-center sm:mt-16">
          <Emblem className="mx-auto h-20 w-20 sm:h-28 sm:w-28" />

          <p className="mt-8 text-log tracking-term text-scene-dim">
            #WTM_EVENT_05 : THE FINAL CHAPTER
          </p>

          <h1 className="mt-6">
            <Countdown
              start={EVENT_START}
              deadline={EVENT_DEADLINE}
              displayDays={COUNTDOWN_DISPLAY_DAYS}
            />
          </h1>

          <p className="mt-6 text-window text-scene-dim">
            {EVENT_WINDOW_LABEL}
          </p>
        </header>

        <FateBox />

        <hr className="mt-12 h-px border-0 bg-scene-rule sm:mt-16" />

        <SurvivalList characters={characters} />

        <div className="h-16" />
      </div>
    </main>
  );
}
