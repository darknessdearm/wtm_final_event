"use client";

import { useState, type FormEvent } from "react";
import {
  DEFAULT_ROLE,
  STATUS_SHORT_LABEL,
  type Character,
  type CharacterStatus,
} from "@/lib/data";
import { submitCharacter } from "@/lib/firebaseClient";
import {
  MAX_NAME_LENGTH,
  NAME_REQUIRED_ERROR,
  resolveName,
} from "@/lib/validateName";

const STATUS_OPTIONS: CharacterStatus[] = ["alive", "dead", "lost"];

// submitCharacter() writes to Realtime Database and rejects if the write fails
// (offline, permission denied). This is the message shown then, instead of
// silently dropping the entry.
const SUBMIT_FAILED_ERROR = "Could not save your entry. Please try again.";

// Defensive cross-platform fallback: native <select>/<option> text is
// painted by the OS, not the page, and how that text picks up a webfont
// (like next/font's generated `Prompt`) varies by platform and browser. If
// the webfont doesn't apply there, name a real system Thai face per platform
// so the label still resolves to something with Thai glyphs instead of
// silently falling through to a font that lacks them. Keep this as an
// inline style (not a Tailwind class) so it stays visibly tied to the two
// elements it patches; don't "clean this up" into the shared font-term
// stack.
const STATUS_FONT_FAMILY =
  "var(--font-prompt), 'Noto Sans Thai', 'Leelawadee UI', Thonburi, 'Tahoma', sans-serif";

/**
 * The bottom bar of the survival list. Submitting hands the entry to
 * submitCharacter() and hands it back up so the parent can show it in the
 * roll right away.
 */
export default function SubmitBar({
  onSubmitted,
}: {
  onSubmitted: (character: Character) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CharacterStatus>("alive");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const resolved = resolveName(name);
    if (!resolved) {
      setError(NAME_REQUIRED_ERROR);
      return;
    }

    setError("");

    try {
      await submitCharacter({ name: resolved, status });
    } catch {
      setError(SUBMIT_FAILED_ERROR);
      return;
    }

    onSubmitted({
      id: `submitted-${Date.now()}`,
      name: resolved,
      role: DEFAULT_ROLE,
      status,
      isNpc: false,
    });
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="frame-dashed flex items-center gap-3 px-4 py-3">
          <label
            htmlFor="submit-name"
            className="whitespace-nowrap text-panel text-scene"
          >
            Add your name here:
          </label>
          <input
            id="submit-name"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-panel text-scene caret-current outline-none"
          />
        </div>

        <div className="frame-dashed flex items-center gap-3 px-4 py-3">
          <label
            htmlFor="submit-status"
            className="whitespace-nowrap text-panel text-scene"
          >
            status :
          </label>
          <select
            id="submit-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CharacterStatus)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-panel text-scene outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-black text-white"
              >
                {STATUS_SHORT_LABEL[option]}
              </option>
            ))}
          </select>
          <span aria-hidden className="text-panel text-scene">
            ▼
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-panel text-fate-dead">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="frame-dashed mx-auto mt-8 block px-10 py-3 text-panel text-scene transition-opacity hover:opacity-70 focus-visible:ring-1 focus-visible:ring-scene-rule"
      >
        Enter to Submit
      </button>
    </form>
  );
}
