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
