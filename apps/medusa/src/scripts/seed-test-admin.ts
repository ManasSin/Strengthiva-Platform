// Creates one reusable admin-dashboard test account, since none exist in seedable
// form today — see docs/deployment.md's "Test users & seed data" section. Medusa's
// own `medusa user -e <email> -p <password>` CLI command does this too, but is NOT
// idempotent (verified directly: re-running it against an existing email throws
// rather than no-op'ing) — this wraps the same underlying workflow with an
// existence check first, matching apps/app's seed-test-user.ts pattern.
//
// Deliberately NOT run automatically on every deploy (see apps/medusa/Dockerfile's
// CMD, which only runs `db:migrate`, never this) — auto-creating a known-password
// admin account on every production deploy would be a real credential-hygiene
// issue. Run manually:
//   pnpm --filter @strengthiva/medusa seed:test-admin
//
// A Medusa admin user needs two linked records to actually log in — a User (the
// Modules.USER entity) and an AuthIdentity (Modules.AUTH, emailpass provider) —
// created together via createUserAccountWorkflow, the same internal workflow the
// `medusa user` CLI command itself uses.
import { MedusaContainer } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { createUserAccountWorkflow } from "@medusajs/core-flows";

const TEST_EMAIL = "admin@strengthiva.dev";
const TEST_PASSWORD = "AdminTest123!";

export default async function seedTestAdmin({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve("logger");
  const userModuleService = container.resolve(Modules.USER);
  const authModuleService = container.resolve(Modules.AUTH);

  const existing = await userModuleService.listUsers({ email: TEST_EMAIL });
  if (existing.length > 0) {
    logger.info(`Already exists, skipping: ${TEST_EMAIL}`);
    return;
  }

  const authResult = await authModuleService.register("emailpass", {
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  if (!authResult.success || !authResult.authIdentity) {
    throw new Error(`Failed to register auth identity: ${authResult.error}`);
  }

  await createUserAccountWorkflow(container).run({
    input: {
      authIdentityId: authResult.authIdentity.id,
      userData: {
        email: TEST_EMAIL,
        first_name: "Admin",
        last_name: "Test",
      },
    },
  });

  logger.info(`Created test admin: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}
