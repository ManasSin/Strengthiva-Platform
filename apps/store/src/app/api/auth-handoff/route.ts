import { NextRequest, NextResponse } from "next/server"
import { setAuthToken } from "@lib/data/cookies"

// Plain-login SSO handoff — the counterpart to strengthiva-backend's
// POST /api/v1/auth/store-login-handoff, for a user who signs in on app.
// wanting to land already-authenticated on store. without adding anything to a
// cart first (that's cart-handoff/route.ts's job, kept separate rather than
// merged — see auth/store-login-handoff's docstring). Same reasoning as
// cart-handoff for using a short-lived single-use code instead of the raw
// Medusa customer JWT, and the same /api/ placement to dodge middleware.ts's
// country-code redirect.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/account", request.url))
  }

  try {
    const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/auth/store-login-exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    if (response.ok) {
      const { medusa_customer_token } = await response.json()
      await setAuthToken(medusa_customer_token)
    }
    // A non-OK response (expired/already-used code) isn't fatal — the user just
    // lands on the ordinary (signed-out) account page instead.
  } catch {
    // FastAPI unreachable — same graceful degradation as an expired code.
  }

  return NextResponse.redirect(new URL("/account", request.url))
}
