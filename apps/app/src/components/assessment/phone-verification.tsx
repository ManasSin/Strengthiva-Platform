"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// Mobile + OTP is how customers sign up: verifying the number IS the sign-up
// (auth.ts's signUpOnVerification), and the real email is collected here on the
// very next line, replacing the placeholder address assigned at that moment.
// Rendered inside assessment step 1, directly under the name field.
//
// Deliberately NOT a questionnaire field. Phone and email are identity, and the
// questionnaire's answers are fed verbatim into the LLM prompt by
// profile_builder.build_patient_profile — adding them to the schema would leak a
// contact number into every AI call.

const TEMP_EMAIL_DOMAIN = "@phone.strengthiva.com";
const RESEND_COOLDOWN_SECONDS = 30;

// Better Auth's phone-number error codes → something a person can act on.
const ERROR_TEXT: Record<string, string> = {
  INVALID_OTP: "That code doesn't match. Check it and try again.",
  OTP_EXPIRED: "That code has expired. Send a new one.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Send a new code to try again.",
  OTP_NOT_FOUND: "That code is no longer valid. Send a new one.",
  INVALID_PHONE_NUMBER: "Enter a valid 10-digit Indian mobile number.",
};

function errorText(code: string | undefined, fallback: string): string {
  return (code && ERROR_TEXT[code]) || fallback;
}

/** Display-only grouping: 9876543210 → 98765 43210. */
function formatMobile(value: string): string {
  const digits = value.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : value;
}

export function PhoneVerification({
  name,
  onVerifiedChange,
}: {
  /** The Full Name answer, adopted as the account's display name on first save. */
  name?: string;
  onVerifiedChange: (verified: boolean) => void;
}) {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter-number" | "enter-code">("enter-number");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // Being signed in is what the assessment actually requires — but it is NOT the
  // same as having verified a mobile number. An email/password account (every
  // admin, and anyone predating phone auth) has a session and no phone at all;
  // treating the two as one thing told those users "Mobile verified" over a
  // number they had never given.
  const signedIn = !!session;
  const phoneNumber =
    session?.user && "phoneNumber" in session.user && typeof session.user.phoneNumber === "string"
      ? session.user.phoneNumber
      : null;
  const phoneVerified =
    !!session?.user &&
    "phoneNumberVerified" in session.user &&
    session.user.phoneNumberVerified === true;

  // A session created by OTP starts on a placeholder address (auth.ts's
  // phoneTempEmail). Anything else — an existing account, an admin — already has
  // a real one and must not be asked again.
  const needsEmail = signedIn && !!session?.user.email.endsWith(TEMP_EMAIL_DOMAIN) && !emailSaved;

  useEffect(() => {
    // The step can't be completed until the user is signed in and, if this is a
    // fresh OTP sign-up, has given us an email. Gating on `signedIn` rather than
    // on a verified phone deliberately: an already-authenticated user has nothing
    // left to prove, and making an admin verify a mobile to open the assessment
    // would be a regression.
    onVerifiedChange(signedIn && !needsEmail);
  }, [signedIn, needsEmail, onVerifiedChange]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    setBusy(true);
    setError(null);
    try {
      const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: mobile });
      if (sendError) {
        setError(errorText(sendError.code, sendError.message || "Couldn't send the code. Please try again."));
        return;
      }
      setStage("enter-code");
      // Every send costs money and invalidates the previous code, so rate-limit
      // the button rather than relying on people not double-tapping it.
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await authClient.phoneNumber.verify({
        phoneNumber: mobile,
        code,
      });
      if (verifyError) {
        setError(errorText(verifyError.code, verifyError.message || "Couldn't verify that code."));
        return;
      }
      // useSession picks the new session up via the plugin's atomListener, which
      // flips `verified` and reveals the email field.
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    setEmailError(null);
    try {
      const response = await fetch("/api/profile/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setEmailError(body.error || "Couldn't save that email. Please try again.");
        return;
      }
      setEmailSaved(true);
    } catch {
      setEmailError("Couldn't reach the server. Please try again.");
    } finally {
      setSavingEmail(false);
    }
  }

  if (sessionPending) {
    return <div className="mb-8 h-20 animate-pulse rounded-lg bg-border/40" />;
  }

  return (
    <div className="mb-8">
      {!signedIn && (
        <>
          <label htmlFor="mobile" className="mb-2 block text-base font-medium text-foreground">
            Mobile Number
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </label>
          <p className="mb-2.5 text-sm text-muted-foreground">
            We&apos;ll text you a 6-digit code. This is how you sign in to Strengthiva.
          </p>

          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-lg border border-border bg-surface px-3 text-base text-muted-foreground">
              +91
            </span>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={mobile}
              disabled={stage === "enter-code"}
              placeholder="10-digit mobile number"
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none disabled:bg-surface disabled:text-muted-foreground"
            />
            {stage === "enter-number" && (
              <Button
                type="button"
                variant="default"
                className="shrink-0 px-4"
                disabled={busy || mobile.replace(/\D/g, "").length < 10}
                onClick={handleSendOtp}
              >
                {busy ? "Sending…" : "Send code"}
              </Button>
            )}
          </div>

          {stage === "enter-code" && (
            <div className="mt-4 rounded-lg border border-border bg-tertiary/20 p-4">
              <div className="flex items-center justify-between">
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  Enter the 6-digit code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStage("enter-number");
                    setCode("");
                    setError(null);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Change number
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sent to +91 {formatMobile(mobile)}
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  placeholder="······"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-center text-lg tracking-[0.4em] focus:border-primary focus:outline-none"
                />
                <Button
                  type="button"
                  variant="default"
                  className="shrink-0 px-5"
                  disabled={busy || code.length < 6}
                  onClick={handleVerify}
                >
                  {busy ? "Verifying…" : "Verify"}
                </Button>
              </div>
              <button
                type="button"
                disabled={cooldown > 0 || busy}
                onClick={handleSendOtp}
                className="mt-3 text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}

      {signedIn && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          {phoneVerified ? (
            <>
              <span aria-hidden>✓</span> Mobile verified
              {phoneNumber ? ` — +91 ${formatMobile(phoneNumber)}` : ""}
            </>
          ) : (
            // Signed in on an account with no phone — say what is actually true.
            <>
              <span aria-hidden>✓</span> Signed in as {session?.user.email}
            </>
          )}
        </div>
      )}

      {needsEmail && (
        <div className="mt-6">
          <label htmlFor="email" className="mb-2 block text-base font-medium text-foreground">
            Email Address
            <span className="ml-1 text-destructive" aria-hidden>*</span>
          </label>
          <p className="mb-2.5 text-sm text-muted-foreground">
            Where we&apos;ll send your report. We&apos;ll say hello too.
          </p>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
            />
            <Button
              type="button"
              variant="default"
              className="shrink-0 px-5"
              disabled={savingEmail || !email.includes("@")}
              onClick={handleSaveEmail}
            >
              {savingEmail ? "Saving…" : "Save"}
            </Button>
          </div>
          {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
        </div>
      )}

      {emailSaved && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span aria-hidden>✓</span> Email saved — check your inbox for a welcome note.
        </p>
      )}
    </div>
  );
}
