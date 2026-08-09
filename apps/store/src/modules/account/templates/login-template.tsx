import { getAppURL } from "@lib/util/env"
import { Heading, Text, Button } from "@modules/common/components/ui"

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
    <div className="w-full flex justify-center px-8 py-16">
      <div className="max-w-sm w-full flex flex-col items-center text-center">
        <Heading level="h1" className="txt-large-plus">
          One account, everywhere
        </Heading>
        <Text className="mt-2 text-grey-60">
          Your Strengthiva account works across the assessment app and the store.
          Sign in once on app.strengthiva.com.
        </Text>
        <a href={continueUrl} className="w-full mt-8">
          <Button className="w-full">Continue with your Strengthiva account</Button>
        </a>
      </div>
    </div>
  )
}

export default LoginTemplate
