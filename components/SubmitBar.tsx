'use client';

import { useState, type FormEvent } from 'react';
import { STATUS_SHORT_LABEL, type Character, type CharacterStatus } from '@/lib/data';
import { submitCharacter } from '@/lib/firebase';

const MAX_NAME_LENGTH = 40;

const STATUS_OPTIONS: CharacterStatus[] = ['alive', 'dead', 'lost'];

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
  const [name, setName] = useState('');
  const [status, setStatus] = useState<CharacterStatus>('alive');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) {
      setError('> ERROR: NAME REQUIRED');
      return;
    }

    setError('');
    await submitCharacter({ name: trimmed, status });

    onSubmitted({
      id: `submitted-${Date.now()}`,
      name: trimmed,
      role: 'ตัวประกอบฉาก',
      status,
      isNpc: false,
    });
    setName('');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="frame-dashed flex items-center gap-3 px-4 py-3">
          <label htmlFor="submit-name" className="whitespace-nowrap text-panel text-scene">
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
          <label htmlFor="submit-status" className="whitespace-nowrap text-panel text-scene">
            status :
          </label>
          <select
            id="submit-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CharacterStatus)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-panel text-scene outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-black text-white">
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
