import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjects } from "@/lib/projects";
import { AppHeader } from "@/components/AppHeader";
import { SearchPanel } from "@/components/SearchPanel";

// Next.js 16: searchParams is async.
type PageProps = { searchParams: Promise<{ projectId?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { projectId } = await searchParams;

  // Active projects only, for the scope filter (own projects — scoped helper).
  const projects = (await listProjects(session.user.id))
    .filter((p) => !p.archivedAt)
    .map((p) => ({ id: p.id, name: p.name }));

  // Only honor a projectId the user actually owns.
  const initialProjectId = projects.some((p) => p.id === projectId)
    ? projectId
    : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={session.user.email}
        back={{ href: "/dashboard", label: "Projects" }}
      />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Search
        </p>
        <h1 className="mb-8 mt-2 font-serif text-3xl text-parchment">
          Ask your decision log
        </h1>

        <SearchPanel projects={projects} initialProjectId={initialProjectId} />
      </main>
    </div>
  );
}
