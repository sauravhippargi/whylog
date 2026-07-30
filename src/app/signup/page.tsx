import { redirect } from "next/navigation";

// Legacy route, consolidated onto "/" like /login. It deep-links to the
// sign-up tab rather than plain "/" so someone arriving from an old link or
// bookmark still lands on the form they asked for, instead of having to find
// the tab themselves.
export default function SignupPage() {
  redirect("/?tab=signup");
}
