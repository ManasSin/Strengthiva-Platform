import { Resend } from "resend";

// EMAIL_FROM must be on a domain verified in Resend's dashboard — an unverified
// sender address makes every send fail, not just get flagged as spam.
const FROM = process.env.EMAIL_FROM || "Strengthiva <onboarding@resend.dev>";

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
