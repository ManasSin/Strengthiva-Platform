// Server-only switch for the temporary "no OTP" launch mode.
//
// While SMS delivery isn't live (MSG91 verification pending), OTP_BYPASS=true lets a
// visitor start the assessment as a guest: they give a mobile number and email as
// unverified contact details, and Better Auth's anonymous plugin gives them their own
// session. Each guest gets a fresh account, so typing someone else's number never
// opens that person's reports (which is what "skip the code" would have done with
// the phone plugin).
//
// Read at runtime (never NEXT_PUBLIC_*), so turning it off is an env change and a
// restart, not a rebuild. Defaults to off.
export function isOtpBypassEnabled(): boolean {
  return process.env.OTP_BYPASS === "true";
}
