import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { listProjects, createProject } from "@/lib/projects";
import { projectCreateSchema } from "@/lib/validation";

// GET /api/projects — list the session user's own projects.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await listProjects(userId);
  return NextResponse.json({ projects });
}

// POST /api/projects — create a project owned by the session user.
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

  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const project = await createProject(userId, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  });

  return NextResponse.json({ project }, { status: 201 });
}
