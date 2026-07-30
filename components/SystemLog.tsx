/** The terminal banner across the very top of the page, plus its hairline. */
export default function SystemLog() {
  return (
    <div className="w-full">
      <p className="text-log tracking-term text-scene">
        SYSTEM LOG V.2.0.1 - May 07, 2001
      </p>
      <hr className="mt-3 h-px border-0 bg-scene-rule" />
    </div>
  );
}
