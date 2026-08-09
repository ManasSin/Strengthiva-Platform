"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AccountCard, Notice } from "@/components/account/account-ui";

type SessionRow = {
  id: string;
  token: string;
  createdAt: string | Date;
  userAgent?: string | null;
};

/** "Chrome on macOS" from a UA string — enough to recognise your own devices. */
function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Safari\//.test(userAgent)
        ? "Safari"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : "Browser";
  const os = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Mac OS X/.test(userAgent)
        ? "macOS"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}

export default function SecurityPage() {
  const { data: session } = authClient.useSession();

  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const load = useCallback(async () => {
    const [sessionList, accounts] = await Promise.all([
      authClient.listSessions(),
      authClient.listAccounts(),
    ]);
    if (sessionList.data) setSessions(sessionList.data as unknown as SessionRow[]);
    // Customers sign in by OTP and have no password at all (decided 2026-07-22:
    // no password login for customers). The password controls appear only for
    // accounts that actually hold a credential — admins, in practice.
    setHasPassword(
      !!accounts.data?.some((a: { providerId?: string }) => a.providerId === "credential"),
    );
  }, []);

  useEffect(() => {
    load().catch(() => setError("Couldn't load your security settings."));
  }, [load]);

  async function revoke(token: string) {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.revokeSession({ token });
    setBusy(false);
    if (err) return setError(err.message || "Couldn't sign that device out.");
    setNotice("Signed that device out.");
    load();
  }

  async function revokeOthers() {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.revokeOtherSessions();
    setBusy(false);
    if (err) return setError(err.message || "Couldn't sign the other devices out.");
    setNotice("Signed out everywhere else.");
    load();
  }

  async function changePassword() {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setBusy(false);
    if (err) return setError(err.message || "Couldn't change your password.");
    setNotice("Password changed. Other devices have been signed out.");
    setChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    load();
  }

  async function deleteAccount() {
    setBusy(true);
    setError(null);
    try {
      // Erase this service's records FIRST. Better Auth owns only the auth tables;
      // reports, assessments and prescriptions are keyed by user id in FastAPI's
      // database with no foreign key, so deleting the account alone would strand
      // them. Doing it in this order means a failure here aborts the whole thing
      // and leaves a working account, rather than an auth-less pile of health data.
      // The id is sent so the backend can refuse if the request authenticates as
      // somebody else — which is exactly what happens with DEV_MODE=true, where
      // every call resolves to the synthetic dev user. Without it the purge
      // silently erased nothing and reported success.
      const purge = await fetch(
        `${API_URL}/api/v1/users/me/data?expected_user_id=${encodeURIComponent(session!.user.id)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!purge.ok) {
        const body = await purge.json().catch(() => ({}));
        setBusy(false);
        setError(
          body.detail ||
            "Couldn't remove your data, so your account was left untouched. Please try again.",
        );
        return;
      }

      const { error: err } = await authClient.deleteUser();
      if (err) {
        setBusy(false);
        setError(err.message || "Couldn't delete your account.");
        return;
      }
      window.location.href = "/";
    } catch {
      setBusy(false);
      setError("Couldn't reach the server. Your account was left untouched.");
    }
  }

  const currentToken = session?.session.token;

  return (
    <div className="flex flex-col gap-6">
      {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <AccountCard title="Where you're signed in" description="Sign out any device you don't recognise.">
        {!sessions && <div className="h-20 animate-pulse rounded-lg bg-border/40" />}
        {sessions && (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {sessions.map((row) => {
                const isCurrent = row.token === currentToken;
                return (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {describeDevice(row.userAgent)}
                        {isCurrent && (
                          <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            This device
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Signed in {new Date(row.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => revoke(row.token)}
                        className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground"
                      >
                        Sign out
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {sessions.length > 1 && (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={busy}
                onClick={revokeOthers}
              >
                Sign out everywhere else
              </Button>
            )}
          </>
        )}
      </AccountCard>

      {/* Only rendered for accounts that hold a password. Customers sign in by
          mobile OTP and have none, so showing password controls to them would
          offer something that cannot work. */}
      {hasPassword && (
        <AccountCard title="Password" description="Used with your email address to sign in.">
          {!changingPassword ? (
            <Button type="button" variant="outline" onClick={() => setChangingPassword(true)}>
              Change password
            </Button>
          ) : (
            <div className="flex max-w-md flex-col gap-3">
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  disabled={busy || !currentPassword || newPassword.length < 8}
                  onClick={changePassword}
                >
                  {busy ? "Saving…" : "Save password"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setChangingPassword(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </AccountCard>
      )}

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6 md:p-8">
        <h2 className="font-display text-xl font-bold text-foreground">Delete account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This removes your account and everything we store about your health — your
          assessments, reports and any uploaded prescriptions. It cannot be undone.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Records of completed orders are kept by our store for accounting and tax purposes,
          as required by law.
        </p>

        {!deleteOpen ? (
          <Button type="button" variant="outline" className="mt-5" onClick={() => setDeleteOpen(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="mt-5 max-w-md">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground">
              Type DELETE to confirm
            </label>
            <input
              id="confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-red-500 focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="default"
                disabled={busy || deleteConfirm !== "DELETE"}
                onClick={deleteAccount}
              >
                {busy ? "Deleting…" : "Permanently delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirm("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
