"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Pre-fills the field when the results page was reached from a search. */
  initialQuery?: string;
  /** The project providing context, if any — enables the scope toggle. */
  currentProject?: { id: string; name: string };
  /**
   * Whether the project scope is active. Omit to take the default, which is
   * scoped whenever there is a current project (PRD FR5).
   */
  scopedToProject?: boolean;
};

// The top bar's search field — the app's primary control, present on every
// authenticated page. Submits to the /search results page, which runs the
// existing /api/search unchanged.
//
// Scope follows PRD FR5: inside a project, search defaults to THAT project and
// "All projects" is the opt-in widening choice; from the dashboard there is no
// current project, so no toggle appears and search is global.
export function ShellSearch({
  initialQuery = "",
  currentProject,
  scopedToProject,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  // Default: scoped whenever we're in a project context.
  const [scoped, setScoped] = useState(scopedToProject ?? !!currentProject);

  const scopeActive = scoped && !!currentProject;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (currentProject) {
      // `projectId` is the applied scope; `ctx` only carries the project
      // context forward so the toggle stays available (and reversible) on the
      // results page after widening.
      params.set(scopeActive ? "projectId" : "ctx", currentProject.id);
    }
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
          scopeActive
            ? "Ask about this project's decisions…"
            : "Ask across all your decisions…"
        }
        aria-label="Search your decisions"
      />
      {/* Carries scope (or bare context) through the no-JS fallback submission. */}
      {currentProject && (
        <input
          type="hidden"
          name={scopeActive ? "projectId" : "ctx"}
          value={currentProject.id}
        />
      )}
      {currentProject && (
        <span className="tb-scope" role="group" aria-label="Search scope">
          <button
            type="button"
            className={scopeActive ? "on" : undefined}
            aria-pressed={scopeActive}
            onClick={() => setScoped(true)}
          >
            This project
          </button>
          <button
            type="button"
            className={scopeActive ? undefined : "on"}
            aria-pressed={!scopeActive}
            onClick={() => setScoped(false)}
          >
            All projects
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
