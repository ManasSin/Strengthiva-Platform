"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/assessment/questionnaire";

  // A `redirect` pointing at a different origin (i.e. store.strengthiva.com, not
  // an in-app path) means the user arrived here wanting to log in on the store —
  // e.g. from store.'s login page's "Continue with your Strengthiva account"
  // button. That needs the SSO handoff (mint a code, full-page-navigate to
  // store.'s exchange route) instead of an in-app router.push, since store. is a
  // separate origin in dev (and a separate subdomain in production) with its own
  // cookies. See docs/platform-architecture/tech-specs/store-frontend/
  // integration-notes.md's "Login/register" note.
  const isStoreRedirect =
    typeof window !== "undefined" &&
    redirectTo.startsWith("http") &&
    new URL(redirectTo).origin !== window.location.origin;

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Set after sign-up (requireEmailVerification means signUp.email() creates
  // the user but returns no session — verified directly against Better Auth's
  // own sign-up route source) or after a sign-in attempt that Better Auth
  // rejects with EMAIL_NOT_VERIFIED. Holds the email so "Resend" doesn't need
  // the user to retype it.
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent"
  >("idle");

  const { data: session } = authClient.useSession();

  async function afterAuthenticated() {
    if (isStoreRedirect) {
      const { store_login_url } = await api.storeLoginHandoff();
      window.location.href = store_login_url;
      return;
    }
    router.push(redirectTo);
  }

  // Handles landing back here after clicking the emailed verification link —
  // Better Auth's autoSignInAfterVerification means the session already exists
  // by the time this page reloads at `callbackURL` (this same URL), so this
  // page doubles as both the form and the post-verification landing target.
  useEffect(() => {
    if (session) {
      afterAuthenticated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const callbackURL =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined;

      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ email, password, name, callbackURL })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          // Better Auth already sends a fresh verification email itself in
          // this case (verified in its sign-in route source) — no extra
          // resend call needed here.
          setPendingVerificationEmail(email);
          return;
        }
        setError(result.error.message || "Something went wrong.");
        return;
      }

      if (mode === "sign-up" && !result.data?.token) {
        // Verification required — no session was created (see the comment on
        // pendingVerificationEmail above).
        setPendingVerificationEmail(email);
        return;
      }

      await afterAuthenticated();
    } catch {
      setError("Signed in, but couldn't connect your account to the store. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendingVerificationEmail) return;
    setResendStatus("sending");
    const callbackURL =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : undefined;
    await authClient.sendVerificationEmail({
      email: pendingVerificationEmail,
      callbackURL,
    });
    setResendStatus("sent");
  }

  if (pendingVerificationEmail) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 text-center">
        <h1 className="text-subhead text-foreground">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">
            {pendingVerificationEmail}
          </span>
          . Click it to finish signing in.
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-6 w-full"
          disabled={resendStatus === "sending"}
          onClick={handleResend}
        >
          {resendStatus === "sent"
            ? "Sent again"
            : resendStatus === "sending"
              ? "Sending…"
              : "Resend email"}
        </Button>
        <button
          type="button"
          onClick={() => setPendingVerificationEmail(null)}
          className="mt-4 w-full text-center text-sm text-primary hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8">
      <h1 className="text-subhead text-foreground">
        {mode === "sign-up" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "sign-up"
          ? "One account works across app. and store."
          : "Sign in to continue your wellness journey."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "sign-up" && (
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : mode === "sign-up" ? "Create Account" : "Sign In"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}
        className="mt-4 w-full text-center text-sm text-primary hover:underline"
      >
        {mode === "sign-up" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </div>
  );
}
