import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { Pool } from "pg";
import { sendVerificationEmail } from "./email";
import { normalizeIndianMobile, sendOtpSms } from "./sms";

// Temp email assigned when a user is created by phone-OTP sign-up, before they
// have given us a real one (the assessment collects it on the very next screen).
//
// Must be a syntactically valid address on a real TLD — NOT something like
// "@phone.local". This value is forwarded to Medusa when the Cart Bridge creates
// the customer record, and Medusa rejects a domain with no TLD outright ("Invalid
// request: Invalid email address"), which surfaces as a 502 on add-to-cart. That
// exact bug was hit with the dev user's "dev@localhost" — see
// strengthiva-backend/app/dependencies/auth.py::dev_user.
//
// The phone. subdomain does not need to accept mail; it only needs to parse.
const phoneTempEmail = (phone: string) => `${phone}@phone.strengthiva.com`;

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
  // Self-serve account deletion, exposed at /account/security. Off by default in
  // Better Auth, so this opt-in is what makes delete-user reachable at all.
  // The client purges this service's data via FastAPI first — see
  // strengthiva-backend/app/routers/users.py::delete_my_data — because Better Auth
  // owns only the auth tables and would otherwise leave health records behind.
  user: {
    deleteUser: { enabled: true },
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
  plugins: [
    admin(),
    // Mobile + OTP is the primary customer path (collected in assessment step 1);
    // emailAndPassword above stays enabled for /admin accounts, which keep signing
    // in by email. Decided 2026-07-22.
    phoneNumber({
      // Better Auth generates and verifies the code itself and MSG91 is only the
      // transport, so expiry and attempt-limiting have exactly one owner. These
      // three are Better Auth's own defaults, set explicitly because they are the
      // brute-force envelope for a 6-digit code and shouldn't drift silently.
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,

      sendOTP: async ({ phoneNumber: to, code }) => {
        // Throws on failure (see sms.ts) — Better Auth turns that into an error
        // response, so the user is told the SMS didn't go out instead of waiting
        // for a code that was never sent.
        await sendOtpSms(to, code);
      },

      // Reuses the same validator the SMS layer applies, so the browser, Better
      // Auth, and MSG91 all agree on what counts as a valid number rather than
      // discovering the disagreement at send time.
      phoneNumberValidator: (value) => normalizeIndianMobile(value) !== null,

      // A verified phone IS the sign-up: no separate registration step. The user
      // row is created on first successful OTP, and the assessment collects the
      // real email on the next screen, which replaces the temp one below.
      signUpOnVerification: {
        getTempEmail: phoneTempEmail,
        // Without this the phone number becomes the display name, which then shows
        // up in the report greeting. The assessment asks for a real name anyway.
        getTempName: () => "there",
      },

      requireVerification: true,
    }),
  ],
});
