import { Resend } from "resend";

// EMAIL_FROM must be on a domain verified in Resend's dashboard — an unverified
// sender address makes every send fail, not just get flagged as spam. Note that
// verifying `noreply.strengthiva.com` does NOT authorise `@strengthiva.com`:
// Resend matches the domain exactly, so the sender must be at the verified
// domain itself (this was live for a while as noreply@strengthiva.com against a
// verified noreply.strengthiva.com, which would have failed every send).
const FROM = process.env.EMAIL_FROM || "Strengthiva <onboarding@resend.dev>";

/**
 * Real email only goes out where it is explicitly switched on.
 *
 * Every environment shares one Resend account and one verified sending domain,
 * so anywhere without this gate sends genuine mail to whatever address is in the
 * database — real people's addresses, from a laptop or a staging box, against
 * the production sending reputation.
 *
 * WHY NOT NODE_ENV. Next statically replaces `process.env.NODE_ENV` in server
 * bundles, so `process.env.NODE_ENV !== "production"` compiles to
 * `"production" !== "production"` and the whole branch is dead-code eliminated —
 * verified by reading the deployed chunk, where the check had vanished entirely.
 * That silently fails open for any deployment BUILT in production mode but not
 * actually production: staging is built exactly like production, so it would
 * have sent real email with nothing in the code to suggest otherwise.
 *
 * EMAIL_ENABLED is an ordinary server-side variable, which Next does NOT inline,
 * so it is genuinely read at runtime and each deployment decides for itself with
 * no rebuild. Default is OFF: a new environment that forgets to set it sends
 * nothing, which is the safe direction to fail.
 */
function shouldSend(kind: string, to: string): boolean {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.info(
      `[email] skipped ${kind} to ${to} — EMAIL_ENABLED is not "true"; ` +
        "email sending is off in this environment",
    );
    return false;
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping ${kind} to ${to}`);
    return false;
  }
  return true;
}

/**
 * Sent once, right after a phone-OTP user gives us their email in assessment
 * step 1. Failure is non-fatal on purpose: the account already exists and works
 * at this point, so a missing welcome email must not block the assessment.
 *
 * The visual design of this is explicitly deferred ("which we can design later")
 * — this is the plain, correct version, matching sendVerificationEmail's markup
 * so both can be restyled together.
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  if (!shouldSend("welcome email", to)) return;

  const greeting = name && name !== "there" ? `Welcome, ${name}!` : "Welcome to Strengthiva!";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to Strengthiva",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #1a5c3a;">${greeting}</h1>
          <p>
            Your account is ready. Finish your health assessment and we'll build you a
            personalised Ayurvedic plan — your constitution, a daily diet plan, and the
            products suited to it.
          </p>
          <p style="color: #666; font-size: 13px;">
            You're receiving this because you signed up at Strengthiva with this email address.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send welcome email to", to, err);
  }
}

export async function sendVerificationEmail(to: string, url: string) {
  // Resend is still constructed lazily below, never at module scope: verified
  // directly that `new Resend(undefined)` throws synchronously at construction
  // time ("Missing API key"), which would otherwise crash the whole
  // /api/auth/[...all] route — every auth action, not just this one.
  if (!shouldSend("verification email", to)) {
    // Where sending is off, the link is logged rather than silently dropped.
    // Without this a developer is locked out of their own account:
    // requireEmailVerification is on, so sign-in fails until the link is
    // followed, and skipping the send would leave no way to follow it.
    console.info(`[email] verification link for ${to}: ${url}`);
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your Strengthiva account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #1a5c3a;">Strengthiva</h1>
          <p>Confirm your email address to finish setting up your account.</p>
          <p>
            <a href="${url}" style="display: inline-block; background: #ea580c; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verify email
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">
            If you didn't create a Strengthiva account, you can ignore this email.
          </p>
        </div>
      `,
    });
  } catch (err) {
    // A transactional-email failure shouldn't block account creation — the
    // user can always hit "Resend email" once the real cause is fixed.
    console.error("Failed to send verification email to", to, err);
  }
}
