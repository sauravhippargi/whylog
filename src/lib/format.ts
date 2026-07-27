// Ledger date stamp: YYYY.MM.DD (design.md's timestamped log style).
// Formatted in UTC so server and client render identically (no hydration drift).
export function formatStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

// YYYY-MM-DD for prefilling a native <input type="date"> (UTC-based to match
// how decisionDate is stored and stamped).
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
