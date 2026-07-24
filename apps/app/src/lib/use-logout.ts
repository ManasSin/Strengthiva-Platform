"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Shared sign-out, used by both the nav's profile menu and the account sidebar so
 * the behaviour is identical wherever a user logs out.
 *
 * Clears the app (Better Auth) session only. The Medusa store session lives on a
 * separate origin with its own cookie the app can't clear cross-origin; a reliable
 * single logout needs shared-domain SSO-logout infrastructure (a production
 * concern), not a fragile cookie hack. The store session is short-lived and only
 * exists if the user visited the store.
 *
 * Landing: the user asked to "stay on the current page". Public pages do exactly
 * that — router.refresh() re-runs server components so the page reflects the
 * signed-out state in place. Account/admin pages can't be stayed on (they require
 * a session), so rather than let the server gate bounce to /login, we send the
 * user home — a friendlier end to a logout than a login screen.
 */
export function useLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      if (pathname.startsWith("/account") || pathname.startsWith("/admin")) {
        router.push("/");
      } else {
        router.refresh();
      }
    } finally {
      setLoggingOut(false);
    }
  }, [router, pathname]);

  return { logout, loggingOut };
}
