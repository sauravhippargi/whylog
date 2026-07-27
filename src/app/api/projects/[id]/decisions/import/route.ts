import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { getOwnedProject } from "@/lib/projects";
import { importRequestSchema } from "@/lib/validation";
import { importDecisions } from "@/lib/extraction";
import { NotFoundError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/decisions/import — FR9. Segment a document into MANY
// candidate decisions. Nothing is saved; the client renders a review queue and
// commits accepted candidates via the normal create endpoint.
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

  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    await getOwnedProject(userId, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    throw error;
  }

  try {
    const candidates = await importDecisions(parsed.data.rawDoc);
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Import extraction failed:", error);
    return NextResponse.json(
      { error: "Couldn't extract decisions from that document. Try again." },
      { status: 502 },
    );
  }
}
