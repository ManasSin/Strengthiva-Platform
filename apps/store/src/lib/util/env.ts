export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}

// Cross-app links that leave store.strengthiva.com — the footer's "Health
// Assessment"/"Diet Plans" links and the account page's SSO handoff. The mirror
// image of apps/app/src/lib/site.ts's STORE_URL, which points the other way.
//
// The footer links were previously hardcoded to "http://localhost:3000", so the
// production storefront shipped two dead links pointing at the visitor's own
// machine. NEXT_PUBLIC_* is inlined at build time, so this has to be passed as a
// Docker build arg — apps/store/Dockerfile and docker-compose.prod.yml already
// do that, resolving it from the repo-root .env (not apps/store/.env.local).
export const getAppURL = () => {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}
