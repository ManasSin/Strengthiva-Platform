"use client";

import { useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { STORE_URL } from "@/lib/site";

/**
 * A link into store.strengthiva.com that opens in a new tab and — for a signed-in
 * user — carries their login across.
 *
 * The store is a separate origin (a different port in dev, a sibling subdomain in
 * prod) with its own Medusa customer cookie, so following a plain link lands you
 * there signed out. When a session exists we instead route through the existing
 * SSO handoff (POST /auth/store-login-handoff → store /api/auth-handoff), which
 * sets the store cookie and drops the user on `path`. Signed-out users just get a
 * normal new-tab link.
 *
 * Rendered as a real <a> so middle-click, "open in new tab", and keyboard all
 * work; the SSO dance only overrides a plain left-click.
 */
export function StoreLink({
  path = "/",
  className,
  children,
}: {
  path?: string;
  className?: string;
  children: ReactNode;
}) {
  const { data: session } = authClient.useSession();
  const [pending, setPending] = useState(false);

  async function handleSsoOpen(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);

    // Open the tab synchronously, inside the click gesture — opening it after the
    // await would be caught by the popup blocker. It's redirected once the
    // one-time handoff URL is minted.
    const tab = window.open("about:blank", "_blank");
    try {
      const { store_login_url } = await api.storeLoginHandoff();
      const url = new URL(store_login_url);
      url.searchParams.set("redirect", path);
      if (tab) tab.location.href = url.toString();
      else window.open(url.toString(), "_blank", "noopener");
    } catch {
      // Handoff unavailable (e.g. Medusa not configured) — still honour the click
      // by opening the store directly, just signed out.
      const fallback = `${STORE_URL}${path}`;
      if (tab) tab.location.href = fallback;
      else window.open(fallback, "_blank", "noopener");
    } finally {
      setPending(false);
    }
  }

  return (
    <a
      href={`${STORE_URL}${path}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={session ? handleSsoOpen : undefined}
      aria-busy={pending || undefined}
      className={className}
    >
      {children}
    </a>
  );
}
