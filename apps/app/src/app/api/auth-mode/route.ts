import { NextResponse } from "next/server";
import { isOtpBypassEnabled } from "@/lib/auth-mode";

// Tells the assessment's sign-in step which flow to render. A route rather than a
// NEXT_PUBLIC_* var so the mode flips with a restart, not a rebuild.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ otpBypass: isOtpBypassEnabled() });
}
