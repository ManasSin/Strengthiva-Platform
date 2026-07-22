import { Resend } from "resend";

// EMAIL_FROM must be on a domain verified in Resend's dashboard — an unverified
// sender address makes every send fail, not just get flagged as spam.
const FROM = process.env.EMAIL_FROM || "Strengthiva <onboarding@resend.dev>";

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
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping welcome email to", to);
    return;
  }

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
  if (!process.env.RESEND_API_KEY) {
    // Don't let a missing key break sign-up/sign-in entirely — verified
    // directly that `new Resend(undefined)` throws synchronously at
    // construction time ("Missing API key"), which would otherwise crash the
    // whole /api/auth/[...all] route (every auth action, not just this one)
    // if this were instantiated at module scope instead of lazily here.
    console.warn(
      "RESEND_API_KEY not set — skipping verification email to",
      to
    );
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
