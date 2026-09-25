import { getAppURL } from "@lib/util/env"

// One shared Strengthiva account across app. and store. (decided
// docs/platform-architecture/02-decisions-log.md) — store. no longer owns its
// own email/password login (that was Medusa's stock emailpass provider, never
// actually wired to Better Auth). Signing in happens on app., which — after a
// successful sign-in/sign-up — mints a short-lived SSO handoff code and lands
// the browser back here already authenticated, via app/api/auth-handoff/route.ts.
// See docs/platform-architecture/tech-specs/store-frontend/integration-notes.md's
// "Login/register: Medusa-default → SSO-aware" note (this is the "redirect"
// option that note left undecided).
const LoginTemplate = () => {
  const appUrl = getAppURL()
  // Not getBaseURL() — that falls back to https://localhost:8000 (FastAPI's port),
  // which would be the wrong origin to send a signed-in user back to in local dev.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001"
  const continueUrl = `${appUrl}/login?redirect=${encodeURIComponent(`${baseUrl}/account`)}`

  return (
    <div className="row" style={{ justifyContent: "center", padding: "64px 24px" }}>
      <div className="panel" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <p className="eyebrow">Account</p>
        <h1 className="h2">Sign in to Strengthiva</h1>
        <p className="lead" style={{ margin: "12px auto 0" }}>
          Your Strengthiva account works across the assessment app and the store.
          Sign in once on app.strengthiva.com.
        </p>
        <a href={continueUrl} className="btn btn-primary btn-block" style={{ marginTop: 28 }}>
          Continue with your Strengthiva account
        </a>
      </div>
    </div>
  )
}

export default LoginTemplate
