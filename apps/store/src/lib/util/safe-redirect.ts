// Post-handoff destinations (api/auth-handoff, api/cart-handoff) must stay on this
// origin, so a crafted ?redirect= can't bounce a freshly-authenticated session off to
// another site. Must start with a single "/" and contain no backslash: WHATWG URL
// parsing treats "\" as "/", so "/\evil.com" resolves to https://evil.com/.
export function safeRedirect(raw: string | null, fallback: string): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    return raw
  }
  return fallback
}
