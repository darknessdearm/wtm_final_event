'use client';

import { useEffect } from 'react';
import { computeDecay } from '@/lib/decay';

/**
 * Writes the campaign's decay (0…1) onto <html> as --decay, once on mount and
 * then once a minute. Renders nothing.
 *
 * The value only ever drives colours, never text, so the server can ship the
 * default --decay: 0 from globals.css without any hydration mismatch.
 */
export default function DecayClock({
  start,
  deadline,
}: {
  start: string;
  deadline: string;
}) {
  useEffect(() => {
    const startMs = new Date(start).getTime();
    const endMs = new Date(deadline).getTime();

    const apply = () => {
      const decay = computeDecay(Date.now(), startMs, endMs);
      document.documentElement.style.setProperty('--decay', decay.toFixed(4));
    };

    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, [start, deadline]);

  return null;
}
