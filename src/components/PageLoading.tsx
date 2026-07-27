// Shown during route navigation while the server component streams in. Quiet
// and on-palette; the pulse stops under prefers-reduced-motion.
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <p className="animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-muted motion-reduce:animate-none">
        {label}
      </p>
    </main>
  );
}
