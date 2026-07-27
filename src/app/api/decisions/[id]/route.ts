import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import {
  getOwnedDecision,
  updateDecision,
  deleteDecision,
} from "@/lib/decisions";
import { decisionUpdateSchema } from "@/lib/validation";
import { NotFoundError, ValidationError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/decisions/[id] — read a single decision (owned only).
export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const decision = await getOwnedDecision(userId, id);
    return NextResponse.json({ decision });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Decision not found." }, { status: 404 });
    }
    throw error;
  }
}

// PATCH /api/decisions/[id] — edit a decision.
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

  const parsed = decisionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const decision = await updateDecision(userId, id, parsed.data);
    return NextResponse.json({ decision });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Decision not found." }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

// DELETE /api/decisions/[id] — hard delete (decisions have no soft-delete).
export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteDecision(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Decision not found." }, { status: 404 });
    }
    throw error;
  }
}
