import { z } from "zod";

// Server-side validation for credentials (rules.md §2 — never rely on
// client-side form validation alone).
//
// Password max length is 72 because bcrypt silently truncates input beyond 72
// bytes; rejecting longer input avoids a surprising security footgun.
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type Credentials = z.infer<typeof credentialsSchema>;

// Server-side validation for projects (rules.md §2). Length caps keep names
// list-friendly and bound stored text.
const projectName = z
  .string()
  .trim()
  .min(1, "Project name is required")
  .max(100, "Project name must be 100 characters or fewer");

const projectDescription = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer");

export const projectCreateSchema = z.object({
  name: projectName,
  description: projectDescription.optional(),
});

// PATCH is a partial update; require at least one field so an empty request
// isn't silently a no-op. `description: null` explicitly clears it.
export const projectUpdateSchema = z
  .object({
    name: projectName.optional(),
    description: projectDescription.nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "Provide a name or description to update",
  });

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

// Server-side validation for decisions (rules.md §2). Required: title,
// decisionSummary, rationale, decisionDate. Optional: alternativesConsidered,
// decidedBy, tags, links. `date format` is enforced via z.coerce.date().
const decisionFields = {
  title: z.string().trim().min(1, "Title is required").max(200),
  decisionSummary: z
    .string()
    .trim()
    .min(1, "A summary of what was decided is required")
    .max(2000),
  rationale: z.string().trim().min(1, "Rationale is required").max(5000),
  decisionDate: z.coerce.date({ message: "A valid decision date is required" }),
  alternativesConsidered: z.string().trim().max(5000).nullish(),
  decidedBy: z.string().trim().max(200).nullish(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  links: z.array(z.string().trim().url("Links must be valid URLs").max(2000)).max(30).optional(),
};

export const decisionCreateSchema = z.object(decisionFields);

// PATCH is a partial update; require at least one field.
export const decisionUpdateSchema = z
  .object(decisionFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type DecisionCreateInput = z.infer<typeof decisionCreateSchema>;
export type DecisionUpdateInput = z.infer<typeof decisionUpdateSchema>;

// Capture-flow request bodies (FR8/FR9). Caps bound how much text we send to
// Gemini in one call; generous enough for a Slack thread or a full PR-FAQ.
export const draftRequestSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(1, "Paste some text to draft from")
    .max(20000, "That text is too long — trim it and try again"),
});

export const importRequestSchema = z.object({
  rawDoc: z
    .string()
    .trim()
    .min(1, "Paste or upload a document to import")
    .max(100000, "That document is too long — split it and try again"),
});

// Semantic search request (FR5). projectId optional — absent = search across
// all of the user's projects.
export const searchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Enter a question to search")
    .max(1000, "That question is too long"),
  projectId: z.string().min(1).optional(),
});
