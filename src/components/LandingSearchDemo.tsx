"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Illustrative only — hardcoded example, never touches the DB or Gemini.
const PHRASE = "why don't new customers need to sign up before buying?";

// Types the example question, then reveals the verdict card; loops. Reduced
// motion shows the finished state with no animation.
export function LandingSearchDemo() {
  const reduced = usePrefersReducedMotion();
  const [typedState, setTyped] = useState("");
  const [showVerdictState, setShowVerdict] = useState(false);

  useEffect(() => {
    if (reduced) return;

    let typer: ReturnType<typeof setInterval> | undefined;
    let verdictTimer: ReturnType<typeof setTimeout> | undefined;

    function startTyping() {
      let i = 0;
      typer = setInterval(() => {
        i += 1;
        setTyped(PHRASE.slice(0, i));
        if (i >= PHRASE.length) {
          if (typer) clearInterval(typer);
          verdictTimer = setTimeout(() => setShowVerdict(true), 500);
        }
      }, 55);
    }

    function restart() {
      setShowVerdict(false);
      setTyped("");
      startTyping();
    }

    // First pass: state already starts empty, so just begin typing.
    startTyping();
    const loop = setInterval(restart, 7000);

    return () => {
      if (typer) clearInterval(typer);
      if (verdictTimer) clearTimeout(verdictTimer);
      clearInterval(loop);
    };
  }, [reduced]);

  const typed = reduced ? PHRASE : typedState;
  const showVerdict = reduced ? true : showVerdictState;

  return (
    <div className="demo-box">
      <div className="demo-input">
        <span className="prompt-icon">?</span>
        <span className="typed">{typed}</span>
        <span className="cursor" aria-hidden="true" />
      </div>
      <div className={`verdict${showVerdict ? " show" : ""}`}>
        <div className="verdict-label">VERDICT</div>
        <div className="verdict-text">
          Checkout doesn&apos;t require creating an account — the team found that
          forcing sign-up hurt conversion more than skipping it hurt fraud
          prevention.
        </div>
        <div className="verdict-footer">DRAWN FROM: GUEST CHECKOUT KEPT</div>
      </div>
    </div>
  );
}
