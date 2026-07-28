import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LandingAuth } from "@/components/LandingAuth";
import { LandingChart } from "@/components/LandingChart";
import { LandingSearchDemo } from "@/components/LandingSearchDemo";

// Combined landing + sign-in page for the root route. Signed-out visitors see
// the marketing/demo page; already-authenticated users are sent to the
// dashboard (same rule proxy.ts applies to /login and /signup).
export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="landing">
      <nav>
        <div className="brand">
          <Image
            src="/logo-mark.png"
            alt=""
            width={28}
            height={28}
            className="seal-img"
            priority
          />
          <span className="wordmark mono">WHYLOG</span>
        </div>
        <div className="nav-links mono">
          <a href="#demo">See how it works</a>
          <a href="#auth">Sign in</a>
        </div>
      </nav>

      <section className="hero" id="auth">
        <div>
          <span className="eyebrow mono">DECISION LOG FOR PMS</span>
          <h1>Find out why — even if you don&apos;t remember how you phrased it.</h1>
          <p className="sub">
            WhyLog keeps the record of what got decided, why, and what you passed
            on — grouped by project, then found later by asking in plain English.
            Semantic search over your own history, not a keyword match.
          </p>
          <a className="see-how mono" href="#demo">
            See how it works ↓
          </a>
        </div>

        <LandingAuth />
      </section>

      <section className="demo-wrap" id="demo">
        <span className="eyebrow mono">SEE IT WORK</span>
        <h2>Ask it something you never typed.</h2>
        <LandingSearchDemo />
      </section>

      <section className="mechanism-wrap" id="mechanism">
        <span className="eyebrow mono">HOW THE SEARCH ACTUALLY WORKS</span>
        <h2>Decisions, plotted by meaning — not wording.</h2>
        <p className="mechanism-sub">
          A ship&apos;s log records where you are. WhyLog does the same for
          meaning — every decision gets a position on this chart, and a new
          question is plotted right alongside it, then matched to whichever
          logged decision sits closest.
        </p>
        <LandingChart />
      </section>

      <section className="paths-wrap">
        <span className="eyebrow mono">THREE WAYS TO LOG A DECISION</span>
        <h2>However the decision actually happened.</h2>
        <div className="paths">
          <div className="path-card">
            <span className="path-tag">MANUAL</span>
            <h3>Fill it in yourself</h3>
            <p>
              What was decided, why, and what you considered instead. Two
              minutes, start to finish.
            </p>
          </div>
          <div className="path-card">
            <span className="path-tag">PASTE &amp; DRAFT</span>
            <h3>Paste it, review it</h3>
            <p>
              Drop in a Slack thread or rough notes. Get a clean draft back — you
              edit and confirm before anything saves.
            </p>
          </div>
          <div className="path-card">
            <span className="path-tag">BULK IMPORT</span>
            <h3>Import a whole document</h3>
            <p>
              Paste an existing PR-FAQ or decision doc. Every decision inside it
              comes back as a queue to approve, not retype.
            </p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <h2>Your decisions are already happening.</h2>
          <p>Start keeping the why.</p>
          <a className="cta-btn" href="#auth">
            START YOUR LOG
          </a>
        </div>
      </section>

      <footer>
        <span>WHYLOG</span>
        <span>Next.js · Prisma · Supabase · Gemini</span>
      </footer>
    </div>
  );
}
