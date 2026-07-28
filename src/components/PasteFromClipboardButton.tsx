"use client";

import { useState } from "react";

// Secondary / outline pill — matches the app's button language (same shape,
// height, and padding as a primary brass button, brass border + transparent
// fill instead of a brass fill). Shared with the upload control.
export const SECONDARY_PILL =
  "inline-flex cursor-pointer items-center rounded-sm border border-brass/40 px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-brass-light transition-colors hover:border-brass disabled:opacity-50";

// Reads the clipboard with the native Web API and hands the text back to the
// parent (which fills its textarea). Manual Cmd/Ctrl+V into the textarea is
// unaffected and always works; this is only a convenience on top of it. Any
// failure (no API, permission denied, empty clipboard) surfaces a plain,
// in-voice message via onError instead of throwing or failing silently.
export function PasteFromClipboardButton({
  onText,
  onError,
}: {
  onText: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [reading, setReading] = useState(false);

  async function onClick() {
    setReading(true);
    try {
      if (!navigator.clipboard?.readText) {
        onError(
          "Can't read the clipboard in this browser. Paste with Cmd/Ctrl+V instead.",
        );
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text.trim().length === 0) {
        onError("The clipboard is empty. Copy some text, then try again.");
        return;
      }
      onText(text);
    } catch {
      onError(
        "Couldn't read the clipboard. Allow access, or paste with Cmd/Ctrl+V instead.",
      );
    } finally {
      setReading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={reading}
      className={SECONDARY_PILL}
    >
      {reading ? "Reading…" : "Paste from clipboard"}
    </button>
  );
}
