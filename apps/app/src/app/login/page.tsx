import { Suspense } from "react";
import { MarketingNav } from "@/components/layout/nav";
import { LoginForm } from "@/components/auth/login-form";

// Minimal email/password auth — enough to exercise the real Better Auth flow
// end-to-end in the browser (see docs/platform-architecture/02-decisions-log.md,
// 2026-07-13's Better Auth setup). Not a Figma-matched screen — no login/signup
// page was in the reviewed export batch (modules/app-frontend.md's "still open"
// list) — this is a functional placeholder, not a final design.
//
// Split into a Suspense-wrapped page + a client LoginForm because useSearchParams
// (used to read ?redirect=) requires a Suspense boundary during static
// prerendering, or `next build` fails — confirmed by an actual build error, not
// assumed from docs.
export default function LoginPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
