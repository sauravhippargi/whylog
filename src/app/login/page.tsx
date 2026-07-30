import { redirect } from "next/navigation";

// Legacy route. The landing page at "/" is the single sign-in surface — it
// carries the real Credentials form — so this no longer renders its own copy.
// Keeping a second form here would let the two drift apart visually over time.
export default function LoginPage() {
  redirect("/");
}
