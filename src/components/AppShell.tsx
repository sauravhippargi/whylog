"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { ShellSearch } from "@/components/ShellSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

export type ShellProject = { id: string; name: string };

type Props = {
  email?: string | null;
  /** The account's own active projects (already ownership-scoped server-side). */
  projects: ShellProject[];
  /** Highlighted in the sidebar and enables the search scope toggle. */
  currentProject?: ShellProject;
  initialQuery?: string;
  scopedToProject?: boolean;
  children: React.ReactNode;
};

function initialsFrom(email?: string | null): string {
  if (!email) return "··";
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`
      : name.slice(0, 2) || "··";
  return letters.toUpperCase();
}

// The persistent navigation shell for every authenticated page: a full-width
// top bar (logo, search, account) over a sidebar of the user's projects plus
// the page content. Because project navigation is always present here, no page
// needs a "back to project" link.
export function AppShell({
  email,
  projects,
  currentProject,
  initialQuery,
  scopedToProject,
  children,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shell">
      <header className="topbar">
        <button
          type="button"
          className="tb-menu"
          aria-label={navOpen ? "Close project menu" : "Open project menu"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          ☰
        </button>

        <Link href="/dashboard" className="tb-brand">
          <Image
            src="/logo-mark.png"
            alt=""
            width={26}
            height={26}
            className="tb-seal"
            priority
          />
          <span>WHYLOG</span>
        </Link>

        <ShellSearch
          initialQuery={initialQuery}
          currentProject={currentProject}
          scopedToProject={scopedToProject}
        />

        <div className="tb-right">
          <div className="tb-account">
            <button
              type="button"
              className="tb-avatar"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {initialsFrom(email)}
            </button>
            {menuOpen && (
              <div className="tb-menu-pop">
                <span className="email">{email}</span>
                <ThemeToggle />
                <button type="button" onClick={() => signOut({ redirectTo: "/" })}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="shell-body">
        <div
          className={`side-backdrop${navOpen ? " open" : ""}`}
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />

        <nav className={`side${navOpen ? " open" : ""}`} aria-label="Projects">
          <p className="side-lbl">Projects</p>

          {projects.length === 0 ? (
            <p className="side-empty">No projects yet.</p>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                onClick={() => setNavOpen(false)}
                className={`side-item${p.id === currentProject?.id ? " active" : ""}`}
                aria-current={p.id === currentProject?.id ? "page" : undefined}
              >
                <span className="dot" aria-hidden="true" />
                {p.name}
              </Link>
            ))
          )}

          <div className="side-new">
            <Link
              href="/dashboard#new-project"
              onClick={() => setNavOpen(false)}
              className="shell-btn shell-btn-primary"
            >
              + New project
            </Link>
          </div>
        </nav>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
