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
