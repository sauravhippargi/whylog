import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { updateProject, archiveProject } from "@/lib/projects";
import { projectUpdateSchema } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

// Next.js 16: dynamic route params are async.
type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/projects/[id] — rename / edit (ownership enforced in the helper).
export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const data: { name?: string; description?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description || null;
  }

  try {
    const project = await updateProject(userId, id, data);
    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    throw error;
  }
}

// DELETE /api/projects/[id] — archive (soft removal, the only removal path).
export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await archiveProject(userId, id);
    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    throw error;
  }
}
