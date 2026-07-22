"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AccountCard, FieldRow, Notice } from "@/components/account/account-ui";

const TEMP_EMAIL_DOMAIN = "@phone.strengthiva.com";

function formatMobile(value: string): string {
  const digits = value.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : value;
}

export default function ProfilePage() {
  const { data: session, isPending, refetch } = authClient.useSession();

  const [editing, setEditing] = useState<"name" | "email" | "mobile" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  if (isPending) {
    return <AccountCard><div className="h-32 animate-pulse rounded-lg bg-border/40" /></AccountCard>;
  }
  if (!session) return null;

  const user = session.user;
  const phoneNumber =
    "phoneNumber" in user && typeof user.phoneNumber === "string" ? user.phoneNumber : null;
  // Set at OTP sign-up before the real address is known (auth.ts's phoneTempEmail).
  // Showing it as if it were the user's email would be misleading.
  const hasRealEmail = !user.email.endsWith(TEMP_EMAIL_DOMAIN);

  function reset() {
    setEditing(null);
    setBusy(false);
    setError(null);
    setCode("");
    setOtpSent(false);
  }

  async function saveName() {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.updateUser({ name: name.trim() });
    setBusy(false);
    if (err) return setError(err.message || "Couldn't update your name.");
    setNotice("Name updated.");
    reset();
    refetch();
  }

  async function saveEmail() {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.changeEmail({
      newEmail: email.trim().toLowerCase(),
      callbackURL: "/account",
    });
    setBusy(false);
    if (err) return setError(err.message || "Couldn't change your email.");
    // Better Auth sends a confirmation link rather than switching immediately when
    // the current address is verified — so don't claim the change is done.
    setNotice(
      "Check your inbox — we've sent a link to confirm the change. Your email updates once you click it.",
    );
    reset();
  }

  async function sendMobileOtp() {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: mobile });
    setBusy(false);
    if (err) return setError(err.message || "Couldn't send the code.");
    setOtpSent(true);
  }

  async function saveMobile() {
    setBusy(true);
    setError(null);
    // updatePhoneNumber moves the number on the signed-in account rather than
    // creating a new one — without it this would try to sign in as the new number.
    const { error: err } = await authClient.phoneNumber.verify({
      phoneNumber: mobile,
      code,
      updatePhoneNumber: true,
    });
    setBusy(false);
    if (err) return setError(err.message || "Couldn't verify that code.");
    setNotice("Mobile number updated.");
    reset();
    refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <AccountCard title="Profile" description="How we address you and how we reach you.">
        {/* ── Name ── */}
        <FieldRow
          label="Name"
          value={user.name || <span className="text-muted-foreground">Not set</span>}
          editing={editing === "name"}
          onEdit={() => {
            reset();
            setName(user.name || "");
            setEditing("name");
          }}
          onCancel={reset}
        >
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
            />
            <Button type="button" variant="secondary" disabled={busy || !name.trim()} onClick={saveName}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </FieldRow>

        {/* ── Email ── */}
        <FieldRow
          label="Email"
          value={
            hasRealEmail ? (
              <span className="flex flex-wrap items-center gap-2">
                {user.email}
                {!user.emailVerified && (
                  <span className="rounded bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                    Unverified
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )
          }
          editing={editing === "email"}
          onEdit={() => {
            reset();
            setEmail(hasRealEmail ? user.email : "");
            setEditing("email");
          }}
          onCancel={reset}
        >
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !email.includes("@")}
              onClick={saveEmail}
            >
              {busy ? "Sending…" : "Save"}
            </Button>
          </div>
        </FieldRow>

        {/* ── Mobile ── */}
        <FieldRow
          label="Mobile"
          value={
            phoneNumber ? (
              formatMobile(phoneNumber)
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )
          }
          editing={editing === "mobile"}
          onEdit={() => {
            reset();
            setMobile("");
            setEditing("mobile");
          }}
          onCancel={reset}
          last
        >
          {!otpSent ? (
            <div className="flex flex-wrap gap-2">
              <input
                type="tel"
                inputMode="numeric"
                value={mobile}
                placeholder="New 10-digit mobile number"
                onChange={(e) => setMobile(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={busy || mobile.replace(/\D/g, "").length < 10}
                onClick={sendMobileOtp}
              >
                {busy ? "Sending…" : "Send code"}
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Enter the code sent to {formatMobile(mobile)}.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  placeholder="······"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="min-w-0 flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-lg tracking-[0.4em] focus:border-primary focus:outline-none"
                />
                <Button
                  type="button"
                  variant="default"
                  disabled={busy || code.length < 6}
                  onClick={saveMobile}
                >
                  {busy ? "Verifying…" : "Verify & save"}
                </Button>
              </div>
            </div>
          )}
        </FieldRow>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </AccountCard>
    </div>
  );
}
