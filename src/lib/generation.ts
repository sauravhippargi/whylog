// Gemini text generation for structured extraction (FR8/FR9).
//
// Uses gemini-2.5-flash at temperature 0 (rules.md §1 — determinism) with
// JSON response mode + a response schema, so the model returns parseable JSON.
// Called via REST (no SDK dependency), same pattern as embeddings.ts.

export const GENERATION_MODEL = "gemini-2.5-flash";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent`;

// Minimal subset of the Gemini responseSchema shape we use.
export type ResponseSchema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN" | "INTEGER";
  properties?: Record<string, ResponseSchema>;
  items?: ResponseSchema;
  required?: string[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call gemini-2.5-flash with a system instruction + user text, forcing JSON
 * output that conforms to `responseSchema`. Returns the parsed JSON (unknown —
 * callers must zod-validate; never trust the model blindly, rules.md §1).
 */
export async function generateJson(
  systemInstruction: string,
  userText: string,
  responseSchema: ResponseSchema,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema,
    },
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
        const message = `Generation API ${res.status}: ${detail}`;
        if (res.status !== 429 && res.status < 500) {
          throw Object.assign(new Error(message), { fatal: true });
        }
        throw new Error(message);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Generation API returned no content.");
      }

      return JSON.parse(text);
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
    : new Error("Failed to generate content.");
}
