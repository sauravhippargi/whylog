// Ledger date stamp: YYYY.MM.DD (design.md's timestamped log style).
// Formatted in UTC so server and client render identically (no hydration drift).
export function formatStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}
