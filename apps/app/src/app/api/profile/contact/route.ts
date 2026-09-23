import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isOtpBypassEnabled } from "@/lib/auth-mode";
import { sendWelcomeEmail } from "@/lib/email";
import { normalizeIndianMobile } from "@/lib/sms";

// Contact capture for guest (anonymous) sessions while OTP_BYPASS is on — the
// guest-mode counterpart of /api/profile/email. Stores the mobile and email as
// unverified contact details (user.contactPhone / contactEmail), never as the
// account's login identity: nothing was proven, and both of those columns are unique,
// so a returning visitor would collide with their own earlier guest account.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Must match auth.ts's anonymous generateName.
const PLACEHOLDER_NAME = "there";

export async function POST(request: Request) {
  if (!isOtpBypassEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // Only guest accounts. A real account's contact details are its verified identity
  // and are managed from /account.
  if (!(session.user as { isAnonymous?: boolean | null }).isAnonymous) {
    return NextResponse.json({ error: "Not a guest session." }, { status: 409 });
  }

  let mobile: unknown;
  let email: unknown;
  let name: unknown;
  try {
    ({ mobile, email, name } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const phone = typeof mobile === "string" ? normalizeIndianMobile(mobile) : null;
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const contactEmail = email.trim().toLowerCase();

  const realName =
    typeof name === "string" && name.trim() && session.user.name === PLACEHOLDER_NAME
      ? name.trim().slice(0, 100)
      : undefined;

  const ctx = await auth.$context;
  await ctx.internalAdapter.updateUser(session.user.id, {
    contactPhone: phone,
    contactEmail,
    ...(realName ? { name: realName } : {}),
  });

  // After the write: a failed send must not cost the user their details.
  // sendWelcomeEmail swallows its own errors and honours EMAIL_ENABLED.
  await sendWelcomeEmail(contactEmail, realName ?? session.user.name);

  return NextResponse.json({ ok: true });
}
