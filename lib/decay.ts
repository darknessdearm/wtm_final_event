// ---------------------------------------------------------------------------
// Campaign decay.
//
// 0 = the campaign just opened (scene1, green), 1 = the deadline has arrived
// (scene2, red). Every themed colour in globals.css is a color-mix() driven by
// this single number, so the whole page interpolates from one value.
// ---------------------------------------------------------------------------

/**
 * Fraction of the campaign window that has elapsed, clamped to [0, 1].
 *
 * Returns 1 for an inverted or zero-length window (a misconfigured deadline
 * should read as "over", not as NaN), and 0 if any input is non-finite.
 */
export function computeDecay(
  now: number,
  start: number,
  deadline: number,
): number {
  if (!Number.isFinite(now) || !Number.isFinite(start) || !Number.isFinite(deadline)) {
    return 0;
  }
  if (deadline <= start) return 1;

  const elapsed = (now - start) / (deadline - start);
  if (elapsed < 0) return 0;
  if (elapsed > 1) return 1;
  return elapsed;
}
