// Gemini embeddings for decision text.
//
// Model + dimension are fixed here and must match the pgvector column
// (vector(768)). We call the REST embedContent endpoint directly (no SDK
// dependency). See rules.md §1 (verify model), §4 (consistent input).

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

// The exact fields, order, and separator used to build embedding input. This is
// the SINGLE source of truth — creation, edit, and any future backfill must all
// go through it, or search quality silently degrades (rules.md §4).
export function buildEmbeddingInput(fields: {
  title: string;
  decisionSummary: string;
  rationale: string;
  alternativesConsidered?: string | null;
}): string {
  return [
    fields.title,
    fields.decisionSummary,
    fields.rationale,
    fields.alternativesConsidered ?? "",
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join("\n\n");
}

function l2Normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return values;
  return values.map((v) => v / norm);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// gemini-embedding-001's embedding space is asymmetric between task types:
// stored documents and search queries must be embedded with DIFFERENT task
// types (RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY), or match quality silently
// degrades (architecture.md §5). To make that impossible to get wrong, the
// task type is NOT a public parameter — callers use embedDocument / embedQuery.
type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/**
 * Embed text with gemini-embedding-001 at 768 dimensions. Returns an
 * L2-normalized vector (Google does not normalize sub-3072 outputs; normalizing
 * keeps cosine/inner-product search well-behaved). Retries transient failures.
 */
async function requestEmbedding(
  text: string,
  taskType: TaskType,
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const body = JSON.stringify({
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const message = `Embedding API ${res.status}: ${detail}`;
        // 4xx other than rate-limiting (bad key/model/request) won't fix
        // themselves — fail immediately instead of retrying.
        if (res.status !== 429 && res.status < 500) {
          throw Object.assign(new Error(message), { fatal: true });
        }
        throw new Error(message);
      }

      const data = (await res.json()) as { embedding?: { values?: number[] } };
      const values = data.embedding?.values;
      if (!values || values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding API returned ${values?.length ?? 0} dims, expected ${EMBEDDING_DIMENSIONS}.`,
        );
      }

      return l2Normalize(values);
    } catch (error) {
      lastError = error;
      if ((error as { fatal?: boolean })?.fatal || attempt === maxAttempts) {
        break;
      }
      await sleep(500 * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to generate embedding.");
}

/** Embed a stored decision's text (write path). Uses RETRIEVAL_DOCUMENT. */
export function embedDocument(text: string): Promise<number[]> {
  return requestEmbedding(text, "RETRIEVAL_DOCUMENT");
}

/** Embed a user's search query (search path). Uses RETRIEVAL_QUERY. */
export function embedQuery(text: string): Promise<number[]> {
  return requestEmbedding(text, "RETRIEVAL_QUERY");
}
