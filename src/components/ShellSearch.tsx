"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Pre-fills the field when the results page was reached from a search. */
  initialQuery?: string;
  /** The project being viewed, if any — enables the scope toggle. */
  currentProject?: { id: string; name: string };
  /** True when the current results are already narrowed to that project. */
  scopedToProject?: boolean;
};

// The top bar's search field — the app's primary control, present on every
// authenticated page. Submits to the /search results page, which runs the
// existing /api/search. Global by default (PRD FR5): a projectId is sent only
// when the user deliberately picks "This project", and that toggle only exists
// while viewing one.
export function ShellSearch({
  initialQuery = "",
  currentProject,
  scopedToProject = false,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [scoped, setScoped] = useState(scopedToProject);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (scoped && currentProject) params.set("projectId", currentProject.id);
    router.push(`/search?${params.toString()}`);
  }

  return (
    // action/method make this work before hydration (and with JS off): the
    // browser's own GET lands on /search?q=… with the same shape router.push
    // builds. Once hydrated, onSubmit preventDefaults and navigates client-side.
    <form
      onSubmit={onSubmit}
      action="/search"
      method="get"
      className="tb-search"
      role="search"
    >
      <span className="q" aria-hidden="true">
        ?
      </span>
      <input
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          scoped && currentProject
            ? `Ask across ${currentProject.name}…`
            : "Ask across all your decisions…"
        }
        aria-label="Search your decisions"
      />
      {/* Carries the scope through the no-JS fallback submission too. */}
      {scoped && currentProject && (
        <input type="hidden" name="projectId" value={currentProject.id} />
      )}
      {currentProject && (
        <span className="tb-scope" role="group" aria-label="Search scope">
          <button
            type="button"
            className={scoped ? undefined : "on"}
            aria-pressed={!scoped}
            onClick={() => setScoped(false)}
          >
            All projects
          </button>
          <button
            type="button"
            className={scoped ? "on" : undefined}
            aria-pressed={scoped}
            onClick={() => setScoped(true)}
          >
            This project
          </button>
        </span>
      )}
      {/* A real submit button — without one the browser won't submit on Enter. */}
      <button type="submit" className="tb-go" aria-label="Search">
        →
      </button>
    </form>
  );
}
