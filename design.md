# Design — WhyLog

## Concept

WhyLog's subject is the same one a ship's log or captain's log has always served: an official, timestamped record of decisions and reasoning, kept so someone later can reconstruct the "why." The design draws from that world — ink, brass, ledger lines, stamped entries — rather than a generic SaaS dashboard look. Deliberately distinct from SyncPM's light, Stripe-inspired palette: WhyLog is dark, archival, and quiet, with one warm metallic accent.

**Dark is the default and primary mode.** A light mode was added after v1 (superseding the original dark-only decision) — but as the *same* identity inverted onto warm paper, not a second design language. Typography, ledger structure, spacing, and the stamp motif are identical across both modes; only the palette changes. Two visual identities behind one toggle would drift apart and make the switch feel like changing apps.

## Color Tokens

### Dark mode (default)

| Token | Hex | Role |
|---|---|---|
| Ink | `#0B1220` | Page background |
| Surface | `#141D2E` | Card / panel background |
| Parchment | `#EDE6D6` | Primary text |
| Muted | `#7C8AA0` | Secondary text, timestamps, metadata |
| Brass | `#C89B4A` | Primary accent — interactive elements, the stamp motif |
| Verdigris | `#3F7A6E` | Secondary accent — status/supersession indicators (aged-copper patina) |

### Light mode

Warm paper, not clinical white — the archival feel has to survive the inversion.

| Token | Hex | Role |
|---|---|---|
| Paper | `#FBFAF7` | Page background |
| Surface | `#F3F1EC` | Card / panel background |
| Ink (text) | `#1C2230` | Primary text |
| Muted | `#706B60` | Secondary text, timestamps, metadata |
| Brass (dark) | `#7A5216` | Accent for **text and small elements** |
| Brass (fill) | `#D9A845` | Filled buttons / larger areas — pair with **Ink text, never white**, plus a `#B47E28` border for edge definition |
| Brass (tint) | `#EDE4D0` | Selected / active state backgrounds |
| Verdigris (dark) | `#2E5C53` | Secondary accent — supersession indicators |
| Rule | `#E4E0D8` | Borders, ledger separators |

**Critical:** dark mode's Brass (`#C89B4A`) must never be reused for text in light mode — it measures ~7.35:1 on Ink but drops to roughly 2:1 on Paper, failing contrast.

**Selected and active states must stack signals, not rely on one.** A tint background alone is too subtle at these luminances — on Surface, `#EDE4D0` is only about 1.13:1 against the panel behind it. Every selected state (sidebar project, segmented pills like All projects / This project, the theme toggle) uses tint background **plus** Brass (dark) text **plus** semibold weight; segmented controls add a `#E4E0D8` border or subtle shadow to lift the active segment out of its track.

**Measured light-mode ratios** (computed, not assumed — an earlier draft of this table shipped values that failed):

| Pair | Ratio | Verdict |
|---|---|---|
| Muted `#706B60` on Paper | 5.08:1 | passes AA |
| Muted `#706B60` on Surface | 4.69:1 | passes AA — binding constraint, since muted text sits on cards as well as the page |
| Brass (dark) `#7A5216` on Paper | 6.60:1 | passes AA |
| Brass (dark) `#7A5216` on Surface | 6.11:1 | passes AA |
| Brass (dark) `#7A5216` on Brass tint `#EDE4D0` | 5.45:1 | passes AA — this is why Brass (dark) is `#7A5216` and not `#8A5E1A`, which lands at 4.49:1 |
| Ink `#1C2230` on Brass fill `#D9A845` | 7.30:1 | passes AA |
| Verdigris (dark) `#2E5C53` on Paper | 7.26:1 | passes AA |
| White on Brass fill | 3.53:1 | **fails** — never use white text on brass fills |
| Brass fill `#D9A845` boundary vs Paper | 2.09:1 | below the 3:1 non-text floor — hence the required border |

## Typography

- **Display / label face — IBM Plex Mono** (Medium/SemiBold). Used for entry IDs, timestamps, section labels, tags, nav. This is "the log's voice" — mechanical, timestamped, official.
- **Body / reading face — Source Serif 4** (Regular/Italic). Used for the actual decision content — title, rationale, alternatives. This is the human reasoning being preserved, set in a warmer, more readable face than the mono chrome around it.

No third utility face needed — the mono covers both chrome and data.

## Layout Concepts

**Decision list (within a project) — a ledger, not a card grid.** This is genuinely chronological data, so a vertical timeline with date-stamps is structural, not decorative:

```
┌─ MOBILE REDESIGN ─────────────────────────┐
│ 2026.03.14  Deprioritized Q2 launch        │
│ 2026.02.02  Chose native over PWA          │
│ 2026.01.10  Scoped to iOS first            │
└────────────────────────────────────────────┘
```

**Decision detail page** — entry ID + date stamped top-left in mono, title in serif, then labeled ledger lines for each field (Decided / Why / Alternatives / Who / Tags). If superseded, an overlaid brass-seal badge: "Superseded by [link]." Related decisions appear below as smaller cross-referenced entries in the same ledger style.

**Search results** — the synthesized answer renders as a pinned "verdict" card in serif, with a small mono footer citing which entries it drew from. The matched decisions render below it as ordinary ledger entries, so the person can verify the answer against the actual record.

## Signature Element — The Stamp

Saving a new decision triggers one deliberate animated moment: a brass seal drops onto the entry, settles with a slight overshoot, and the timestamp prints into place character by character in the mono face — like a date-stamp machine. This is the single bold gesture. Everything else in the interface stays quiet and disciplined around it.

## Motion

- The stamp-on-save moment is the only fully orchestrated animation.
- Hover states: a subtle brass-glow border on interactive ledger lines. Nothing more.
- Respect `prefers-reduced-motion` — fall back to an instant state change, no animation.

## Voice / Copy

Terse, factual, log-register — matches the product's own subject. No exclamation points, no marketing tone.

- Empty states read like a blank ledger page: "No decisions logged yet for this project." — an invitation to act, not a mascot illustration.
- Errors state plainly what happened and how to fix it, no apology language: "Couldn't save this entry. Check your connection and try again."
- Button labels are active-voice and stay consistent through the flow (a button that says "Log decision" produces a confirmation that says "Logged," not "Success").

## Quality Floor

- Parchment-on-ink (`#EDE6D6` on `#0B1220`) comfortably clears contrast requirements for body text. Verified in Phase 8: dark-mode brass measures 7.35:1 on ink, clearing AAA.
- Light mode must be contrast-checked independently — dark-mode ratios say nothing about the inverted palette. Check Brass (dark) on Paper, Muted on Paper, and white on Brass (fill) specifically.
- Both modes need visible keyboard focus states; the focus ring color must be legible against each mode's background rather than one ring reused across both.
- Responsive down to mobile in both modes.
