// Creates one reusable test customer account, since none exist in seedable form
// today — see docs/deployment.md's "Test users & seed data" section. Covers the
// one real role that exists in this app (no admin/regular distinction anywhere
// in apps/app or apps/store), and, via the existing SSO handoff
// (app/api/auth-handoff), also covers logging into store.strengthiva.com as a
// customer.
//
// Deliberately NOT run automatically on container startup (see apps/app/Dockerfile)
// — auto-creating a known-password test account on every production deploy would
// be a real credential-hygiene issue, not just noise. Run manually:
//   pnpm --filter @strengthiva/app seed:test-user
//
// Idempotent: checks for the email directly via the `user` table before calling
// Better Auth's signup API, so re-running this is always safe.
import { Pool } from "pg";
import { auth } from "../src/lib/auth";

const TEST_EMAIL = "test-user@strengthiva.dev";
const TEST_PASSWORD = "TestUser123!";
const TEST_NAME = "Test User";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query('SELECT id FROM "user" WHERE email = $1', [
      TEST_EMAIL,
    ]);

    if (rows.length > 0) {
      console.log(`Already exists, skipping: ${TEST_EMAIL}`);
      return;
    }

    await auth.api.signUpEmail({
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      },
    });

    // requireEmailVerification is on (see src/lib/auth.ts) — signUpEmail alone
    // leaves this account unverified and unable to sign in. Marking it
    // verified directly is correct here specifically because this is a known
    // test fixture, not a real signup going through the real flow.
    await pool.query('UPDATE "user" SET "emailVerified" = true WHERE email = $1', [
      TEST_EMAIL,
    ]);

    console.log(`Created test user: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("seed-test-user failed:", err);
  process.exit(1);
});
