import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { Pool } from "pg";
import { sendVerificationEmail } from "./email";

// Writes to the SAME Postgres database strengthiva-backend's FastAPI reads from
// (app/models/auth.py — session/user/account/verification tables). Better Auth
// owns these tables exclusively; FastAPI's Alembic migrations never touch them.
// See docs/platform-architecture/tech-specs/backend/identity-sso-validation.md.
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    // Verified directly: with this on, Better Auth's own signUpEmail returns
    // `{ token: null, user }` instead of creating a session — the frontend
    // (login-form.tsx) checks for that null token to show a "check your email"
    // state rather than assuming sign-up == signed in.
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    // Skips a second manual sign-in after clicking the email link — the user
    // lands back on `callbackURL` already authenticated.
    autoSignInAfterVerification: true,
  },
  // Cookie must be readable by both app. and store. for shared SSO (decided
  // 2026-07-12) — scoped to the parent domain in production. Left unset for
  // local dev, where both apps run on localhost with different ports and
  // cookie domain scoping across ports isn't meaningful the same way.
  advanced: {
    crossSubDomainCookies:
      process.env.NODE_ENV === "production"
        ? { enabled: true, domain: ".strengthiva.com" }
        : undefined,
  },
  // Adds a `role` column to the user table (via Better Auth's own migration
  // tooling, not FastAPI's Alembic — see the file-level comment above). Backs
  // the real per-account admin authentication for /admin — see
  // docs/platform-architecture/tech-specs/backend/admin-authentication.md.
  // No sign-up flow ever sets role="admin" — bootstrap is a direct SQL UPDATE,
  // see that doc.
  plugins: [admin()],
});
