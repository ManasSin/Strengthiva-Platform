import { createAuthClient } from "better-auth/react";
import { adminClient, anonymousClient, phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // phoneNumberClient exposes authClient.phoneNumber.{sendOtp,verify} — the
  // mobile+OTP path used by the assessment wizard. Must stay in step with the
  // server plugin list in auth.ts.
  // anonymousClient backs the guest path while OTP_BYPASS is on; harmless when the
  // server plugin is off (the call just 404s and is never made — see auth-mode.ts).
  plugins: [adminClient(), phoneNumberClient(), anonymousClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
