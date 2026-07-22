import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

// One-time email capture for phone-OTP sign-ups. A user created by OTP starts with
// the placeholder address auth.ts's phoneTempEmail() assigns; assessment step 1 asks
// for their real one immediately afterwards and posts it here, which also triggers
// the welcome message.
//
// Deliberately NOT Better Auth's changeEmail: that sends a verification link and
// withholds the change until it's clicked, which would leave the user on a
// placeholder address for the whole assessment. Phone is the verified identity for
// these accounts — the email is contact information, not a login credential.
//
// The write path is intentionally narrow, because it does set an address the user
// hasn't proven they own:
//   - only replaces the placeholder, never an email already set (so this can't be
//     used to move an established account to an attacker's address),
//   - refuses an address already registered to someone else.

const TEMP_EMAIL_DOMAIN = "@phone.strengthiva.com";
// Must match auth.ts's signUpOnVerification.getTempName.
const PLACEHOLDER_NAME = "there";

// Deliberately permissive: real-world addresses defeat clever patterns, and the
// value is only ever used as a send target, never as a credential.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let email: unknown;
  let name: unknown;
  try {
    ({ email, name } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();

  if (!session.user.email.endsWith(TEMP_EMAIL_DOMAIN)) {
    return NextResponse.json(
      { error: "This account already has an email address." },
      { status: 409 },
    );
  }

  const ctx = await auth.$context;

  const existing = await ctx.internalAdapter.findUserByEmail(normalized);
  if (existing) {
    return NextResponse.json(
      { error: "That email is already registered to another account." },
      { status: 409 },
    );
  }

  // OTP sign-up assigns the placeholder display name auth.ts's getTempName returns,
  // because no name is known at that point. The assessment asks for one on the same
  // screen, so adopt it — otherwise the placeholder is what reaches the welcome
  // email and, via the Cart Bridge, the customer's first name in Medusa. Same
  // narrow-write rule as the email: only ever replaces the placeholder.
  const realName =
    typeof name === "string" && name.trim() && session.user.name === PLACEHOLDER_NAME
      ? name.trim().slice(0, 100)
      : undefined;

  await ctx.internalAdapter.updateUser(session.user.id, {
    email: normalized,
    // Not verified — nobody has clicked anything. Stated explicitly so this
    // account can't be mistaken for one that went through email verification.
    emailVerified: false,
    ...(realName ? { name: realName } : {}),
  });

  // After the update, never before: a failed send must not cost the user their
  // email address. sendWelcomeEmail swallows its own errors for the same reason.
  await sendWelcomeEmail(normalized, realName ?? session.user.name);

  return NextResponse.json({ ok: true });
}
