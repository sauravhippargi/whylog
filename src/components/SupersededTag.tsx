// Compact brass-seal tag for a superseded decision shown as a ledger list row.
// Reuses the exact badge treatment from the decision detail page (Phase 7/8) —
// same brass border/fill and mono label — just tightened to sit inline after a
// row title. Only the older (superseded) entry gets this; the newer decision
// doing the superseding carries no indicator in list views.
export function SupersededTag() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-sm border border-brass/50 bg-brass/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brass">
      ◈ Superseded
    </span>
  );
}
