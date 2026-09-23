// Accounts created without a real email get a syntactically valid placeholder (Medusa
// rejects addresses without a TLD, so these can't be "@phone.local"). Anything shown to
// the user or treated as a send target must skip them.

/** Assigned by auth.ts's phone-OTP sign-up. */
export const PHONE_TEMP_EMAIL_DOMAIN = "@phone.strengthiva.com";
/** Assigned by the anonymous (guest) plugin while OTP_BYPASS is on. */
export const GUEST_EMAIL_DOMAIN = "guest.strengthiva.com";

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.endsWith(PHONE_TEMP_EMAIL_DOMAIN) || email.endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}
