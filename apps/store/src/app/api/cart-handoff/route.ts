import { NextRequest, NextResponse } from "next/server"
import { setAuthToken, setCartId } from "@lib/data/cookies"
import { getBaseURL } from "@lib/util/env"

// Cart Bridge handoff — the counterpart to strengthiva-backend's
// POST /api/v1/cart/add (docs/platform-architecture/tech-specs/backend/
// cart-bridge.md). app. opens a new tab at this URL with a short-lived,
// single-use handoff code (never the Medusa customer JWT itself, which defaults
// to a 1-day expiry — too long-lived to put in a URL). We exchange it server-side
// here and set the same cookies Medusa's own login flow sets
// (@lib/data/cookies.ts's setAuthToken/setCartId), so the browser lands on /cart
// already authenticated as that customer, viewing the exact cart app. built —
// not whatever cart the empty session/cookie would otherwise resolve to.
//
// Lives under app/api/ deliberately, not a bare app/cart-handoff/ — middleware.ts's
// matcher excludes /api/* from its country-code redirect; confirmed by testing
// directly, the bare-path version got redirected to /dk/cart-handoff (which has no
// route) before ever reaching this handler.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/cart", getBaseURL()))
  }

  try {
    const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/cart/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    if (response.ok) {
      const { medusa_customer_token, cart_id } = await response.json()
      await setAuthToken(medusa_customer_token)
      await setCartId(cart_id)
    }
    // A non-OK response (expired/already-used code) isn't fatal — the user just
    // lands on an ordinary cart page instead of the one app. built for them.
  } catch {
    // FastAPI unreachable — same graceful degradation as an expired code.
  }

  return NextResponse.redirect(new URL("/cart", request.url))
}
