import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { getOwnedProject } from "@/lib/projects";
import { searchDecisions } from "@/lib/search";
import { searchRequestSchema } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

// POST /api/search — { query, projectId? } → { answer, matches }.
// Global across the user's decisions by default; scoped to projectId if given.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { query, projectId } = parsed.data;

  // If narrowing to a project, confirm it's the caller's (rules.md §2).
  if (projectId) {
    try {
      await getOwnedProject(userId, projectId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }
      throw error;
    }
  }

  try {
    const result = await searchDecisions(userId, query, projectId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Search failed. Try again." },
      { status: 502 },
    );
  }
}
