// Cross-app links that leave app.strengthiva.com.
//
// The storefront URL was previously hardcoded as "http://localhost:3001" in both
// nav.tsx and footer.tsx, which meant the production build shipped a "Products"
// link pointing at the visitor's own machine. NEXT_PUBLIC_* is inlined at build
// time, so this must also be passed as a Docker build arg in production — see
// docker-compose.prod.yml and .env.production.example at the repo root, which
// already do exactly this for NEXT_PUBLIC_API_URL.
export const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3001";
