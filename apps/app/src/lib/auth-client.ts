import { createAuthClient } from "better-auth/react";
import { adminClient, phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // phoneNumberClient exposes authClient.phoneNumber.{sendOtp,verify} — the
  // mobile+OTP path used by the assessment wizard. Must stay in step with the
  // server plugin list in auth.ts.
  plugins: [adminClient(), phoneNumberClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
