import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { getOwnedProject } from "@/lib/projects";
import { draftRequestSchema } from "@/lib/validation";
import { draftDecision } from "@/lib/extraction";
import { NotFoundError } from "@/lib/errors";

// Next.js 16: dynamic route params are async. `id` is the projectId.
type RouteContext = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/decisions/draft — FR8. Extract ONE candidate decision
// from pasted text. Nothing is saved; the result pre-fills the create form.
export async function POST(request: Request, { params }: RouteContext) {
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

  const parsed = draftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  // Confirm the target project is the caller's before spending a Gemini call.
  try {
    await getOwnedProject(userId, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    throw error;
  }

  try {
    const candidate = await draftDecision(parsed.data.rawText);
    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Draft extraction failed:", error);
    return NextResponse.json(
      { error: "Couldn't draft a decision from that text. Try again." },
      { status: 502 },
    );
  }
}
