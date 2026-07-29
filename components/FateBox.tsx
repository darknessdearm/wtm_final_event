'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { rollFate, type Fate } from '@/lib/roll';

const MAX_NAME_LENGTH = 40;

/** The bracketed slots in the result sentence, rendered brighter than the prose. */
function Slot({ children }: { children: ReactNode }) {
  return (
    <span className="text-scene">
      {'< '}
      {children}
      {' >'}
    </span>
  );
}

/**
 * The randomiser panel. Every submit re-rolls, so the same name can pull a
 * different item and injury each time.
 */
export default function FateBox() {
  const [name, setName] = useState('');
  const [fate, setFate] = useState<Fate | null>(null);
  const [rolledName, setRolledName] = useState('');
  const [error, setError] = useState('');
  const [imageBroken, setImageBroken] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) {
      setError('> ERROR: NAME REQUIRED');
      setFate(null);
      return;
    }

    setError('');
    setImageBroken(false);
    setRolledName(trimmed);
    setFate(rollFate());
  }

  return (
    <section className="frame-dashed mt-12 p-5 sm:mt-16 sm:p-8">
      <h2 className="text-panel text-scene">What will happened with you?</h2>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4 border-t border-dashed border-scene-rule pt-6 sm:flex-row sm:items-center"
      >
        <label htmlFor="fate-name" className="text-panel text-scene">
          Input you name here:
        </label>
        <input
          id="fate-name"
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          className="frame-dashed min-w-0 flex-1 bg-transparent px-3 py-2 text-panel text-scene caret-current outline-none focus-visible:ring-1 focus-visible:ring-scene-rule"
        />
        <button
          type="submit"
          className="frame-dashed px-6 py-2 text-panel text-scene transition-opacity hover:opacity-70 focus-visible:ring-1 focus-visible:ring-scene-rule"
        >
          Enter
        </button>
      </form>

      <div className="mt-6 border-t border-dashed border-scene-rule pt-6">
        <p className="text-panel text-scene">Result:</p>

        {error && (
          <p role="alert" className="mt-4 text-panel text-fate-dead">
            {error}
          </p>
        )}

        {fate && !error && (
          <>
            <p className="mt-4 text-panel leading-loose text-scene-dim">
              <Slot>{rolledName}</Slot> ได้รับ <Slot>{fate.item.name}</Slot>{' '}
              โดยที่คุณจะมีโอกาส <Slot>{fate.damage}</Slot>
            </p>

            <div className="mt-8 text-center">
              {imageBroken ? (
                <p className="text-panel text-scene-dim">&lt;Image of Item&gt;</p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fate.item.imgUrl}
                  alt={fate.item.name}
                  onError={() => setImageBroken(true)}
                  className="mx-auto max-h-64 w-auto object-contain"
                />
              )}
              <p className="mx-auto mt-4 max-w-xl text-panel text-scene-dim">
                {fate.item.description}
              </p>
            </div>
          </>
        )}

        {!fate && !error && (
          <p className="mt-4 text-panel text-scene-dim">
            &lt;Image of Item&gt;
          </p>
        )}
      </div>
    </section>
  );
}
