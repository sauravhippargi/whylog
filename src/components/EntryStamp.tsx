"use client";

import { useEffect, useState } from "react";

// The entry's stamped header line: "Entry <id> · ◈ <date>". When `animate` is
// set (a decision was just logged and we navigated here with ?stamped=1), the
// brass seal drops onto the entry and the timestamp prints character by
// character — the one orchestrated moment (design.md). Under prefers-reduced-
// motion it appears instantly, no animation.
export function EntryStamp({
  entryId,
  dateStamp,
  animate = false,
}: {
  entryId: string;
  dateStamp: string;
  animate?: boolean;
}) {
  // Start empty when animating so server and client agree, then fill in JS.
  const [shown, setShown] = useState(animate ? 0 : dateStamp.length);

  useEffect(() => {
    if (!animate) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Instant reveal, deferred a tick so it isn't a synchronous effect setState.
      const t = setTimeout(() => setShown(dateStamp.length), 0);
      return () => clearTimeout(t);
    }

    // Let the seal drop and settle (~460ms) before the date prints.
    let printer: ReturnType<typeof setInterval>;
    const starter = setTimeout(() => {
      let i = 0;
      printer = setInterval(() => {
        i += 1;
        setShown(i);
        if (i >= dateStamp.length) clearInterval(printer);
      }, 55);
    }, 480);

    return () => {
      clearTimeout(starter);
      clearInterval(printer);
    };
  }, [animate, dateStamp]);

  const printing = animate && shown < dateStamp.length;

  return (
    <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
      <span>Entry {entryId} ·</span>
      <span
        aria-hidden
        className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-brass/70 bg-brass/10 text-[9px] leading-none text-brass ${animate ? "seal-drop" : ""}`}
      >
        ◈
      </span>
      <span className="tabular-nums text-parchment">
        {dateStamp.slice(0, shown)}
        {printing && <span className="text-brass">▌</span>}
      </span>
    </p>
  );
}
