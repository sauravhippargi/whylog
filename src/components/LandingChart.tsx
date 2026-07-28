"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Illustrative only — the coordinates, labels, tooltips and the 0.12 cosine
// distance are hardcoded from the mockup. This never queries the DB or Gemini,
// and shows no real per-account data (the page is public / signed-out).
type Phase = "idle" | "asked" | "matched";

const CAPTIONS: Record<Phase, string> = {
  idle: "Every decision you log gets a position here, based on meaning — not wording.",
  asked: "Ask something — WhyLog plots your question the same way.",
  matched: "Whichever point sits closest is the match — cosine distance: 0.12.",
};

// Faint background decisions — position + hover tooltip carried from the mockup.
const BACKGROUND_DOTS: { cx: number; cy: number; title: string }[] = [
  { cx: 250, cy: 55, title: "Hiring freeze extended through Q1" },
  { cx: 90, cy: 245, title: "Support tier structure reorganized" },
  { cx: 480, cy: 55, title: "Legacy admin panel scheduled for sunset" },
  { cx: 55, cy: 95, title: "Consolidating onto a single CRM" },
  { cx: 305, cy: 345, title: "Loyalty program relaunch delayed" },
  { cx: 410, cy: 330, title: "On-call rotation switched to weekly" },
  { cx: 240, cy: 215, title: "Old design system marked for retirement" },
  { cx: 350, cy: 245, title: "Status page moved off internal infra" },
  { cx: 90, cy: 60, title: "Enterprise SSO project paused" },
  { cx: 530, cy: 300, title: "Free-tier usage caps introduced" },
  { cx: 270, cy: 130, title: 'Workspace terminology renamed to "teams"' },
  { cx: 420, cy: 170, title: "Beta feedback channel archived" },
];

export function LandingChart() {
  const reduced = usePrefersReducedMotion();
  const [phaseState, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (reduced) return;

    let toAsked: ReturnType<typeof setTimeout>;
    let toMatched: ReturnType<typeof setTimeout>;

    function cycle() {
      setPhase("idle");
      toAsked = setTimeout(() => setPhase("asked"), 300);
      toMatched = setTimeout(() => setPhase("matched"), 1200);
    }

    // First pass: state already starts "idle", so just schedule the transitions.
    toAsked = setTimeout(() => setPhase("asked"), 300);
    toMatched = setTimeout(() => setPhase("matched"), 1200);
    const loop = setInterval(cycle, 6500);

    return () => {
      clearTimeout(toAsked);
      clearTimeout(toMatched);
      clearInterval(loop);
    };
  }, [reduced]);

  const phase: Phase = reduced ? "matched" : phaseState;
  const show = phase === "asked" || phase === "matched";
  const hit = phase === "matched";
  const showClass = show ? " show" : "";
  const hitClass = hit ? " hit" : "";

  return (
    <>
      <div className="chart-box">
        <svg viewBox="0 0 600 380" width="100%" height={380}>
          <g className="grid">
            <circle cx={300} cy={190} r={80} />
            <circle cx={300} cy={190} r={150} />
            <line x1={300} y1={20} x2={300} y2={360} />
            <line x1={120} y1={190} x2={480} y2={190} />
          </g>

          <g>
            <circle
              className={`dot dot-strong dot-match${hitClass}`}
              cx={150}
              cy={120}
              r={5}
            >
              <title>Guest checkout kept — no account required to buy</title>
            </circle>
            <circle className="dot dot-faint" cx={112} cy={158} r={4}>
              <title>Fraud checks scoped to post-purchase, not signup</title>
            </circle>
            <text
              className={`dot-label dot-label-strong${hitClass}`}
              x={160}
              y={116}
            >
              GUEST CHECKOUT KEPT
            </text>
          </g>

          <g>
            <circle className="dot dot-strong" cx={430} cy={270} r={4}>
              <title>Amplitude chosen as the analytics provider</title>
            </circle>
            <circle className="dot dot-faint" cx={468} cy={238} r={4}>
              <title>Transaction history moved to a columnar store</title>
            </circle>
            <text className="dot-label" x={440} y={266}>
              ANALYTICS PROVIDER
            </text>
          </g>

          <g>
            <circle className="dot dot-strong" cx={380} cy={95} r={4}>
              <title>Apple Pay set as the default payment option</title>
            </circle>
            <circle className="dot dot-faint" cx={342} cy={132} r={4}>
              <title>Inline error messages replace toast notifications</title>
            </circle>
            <text className="dot-label" x={390} y={91}>
              APPLE PAY DEFAULT
            </text>
          </g>

          <g>
            <circle className="dot dot-strong" cx={200} cy={300} r={4}>
              <title>Annual billing discount introduced at 15%</title>
            </circle>
            <circle className="dot dot-faint" cx={160} cy={322} r={4}>
              <title>Quarterly discount tier considered, then rejected</title>
            </circle>
            <text className="dot-label" x={210} y={296}>
              ANNUAL DISCOUNT
            </text>
          </g>

          <g>
            <circle className="dot dot-strong" cx={510} cy={150} r={4}>
              <title>Legacy checkout iframe retired</title>
            </circle>
            <circle className="dot dot-faint" cx={545} cy={180} r={4}>
              <title>New partner SDK deferred to next year</title>
            </circle>
            <text className="dot-label" x={480} y={140}>
              IFRAME RETIRED
            </text>
          </g>

          <g className="dot-faint">
            {BACKGROUND_DOTS.map((d) => (
              <circle
                key={`${d.cx}-${d.cy}`}
                className="dot"
                cx={d.cx}
                cy={d.cy}
                r={4}
              >
                <title>{d.title}</title>
              </circle>
            ))}
          </g>

          <line
            className={`query-line${showClass}`}
            x1={196}
            y1={92}
            x2={150}
            y2={120}
          />
          <circle
            className={`query-dot${showClass}`}
            cx={196}
            cy={92}
            r={5}
          >
            <title>Your question, plotted the same way as any decision</title>
          </circle>
          <text className={`dot-label query-label${showClass}`} x={204} y={88}>
            SIGN UP BEFORE BUYING?
          </text>
        </svg>
      </div>

      <div className="chart-caption">{CAPTIONS[phase]}</div>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch brass" />
          Logged decision
        </span>
        <span className="legend-item">
          <span className="legend-swatch verdigris" />
          Your question
        </span>
        <span className="legend-item">
          <span className="legend-line" />
          Nearest match
        </span>
      </div>
    </>
  );
}
