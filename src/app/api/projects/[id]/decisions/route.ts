import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { listDecisions, createDecision } from "@/lib/decisions";
import { decisionCreateSchema } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

// Next.js 16: dynamic route params are async. `id` here is the projectId.
type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/decisions — list the project's decisions (owned only).
export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const decisions = await listDecisions(userId, id);
    return NextResponse.json({ decisions });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    throw error;
  }
}

// POST /api/projects/[id]/decisions — create a decision in the project.
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

  const parsed = decisionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const decision = await createDecision(userId, id, {
      title: parsed.data.title,
      decisionSummary: parsed.data.decisionSummary,
      rationale: parsed.data.rationale,
      decisionDate: parsed.data.decisionDate,
      alternativesConsidered: parsed.data.alternativesConsidered ?? null,
      decidedBy: parsed.data.decidedBy ?? null,
      tags: parsed.data.tags ?? [],
      links: parsed.data.links ?? [],
    });
    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    throw error;
  }
}
