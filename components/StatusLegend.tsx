/** The four-chip status key above the roster. */
export default function StatusLegend() {
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-panel">
      <li className="text-scene">Status</li>
      <li className="text-fate-alive">· Alive</li>
      <li className="text-fate-dead">· Dead</li>
      <li className="text-fate-lost">· Lost</li>
      <li className="text-fate-npc">· Npc - Alive if Dead, will censor</li>
    </ul>
  );
}
