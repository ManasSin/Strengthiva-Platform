"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, LogOut, ShoppingBag, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useLogout } from "@/lib/use-logout";
import { cn } from "@/lib/utils";

const TEMP_EMAIL_DOMAIN = "@phone.strengthiva.com";
const PLACEHOLDER_NAME = "there"; // auth.ts's getTempName for OTP sign-ups
// Long enough to cross the gap between the avatar and the panel without the panel
// closing, short enough not to linger after the pointer has genuinely left.
const HOVER_CLOSE_DELAY = 140;

type SessionUser = { name?: string | null; email: string; phoneNumber?: string };

function accountInitials(user: SessionUser): string | null {
  const name = user.name?.trim();
  if (name && name.toLowerCase() !== PLACEHOLDER_NAME) {
    const [first, second] = name.split(/\s+/);
    return (first[0] + (second?.[0] ?? "")).toUpperCase();
  }
  if (user.email && !user.email.endsWith(TEMP_EMAIL_DOMAIN)) {
    return user.email[0].toUpperCase();
  }
  return null;
}

/** A readable secondary line for the menu header: real email, or the phone. */
function contactLine(user: SessionUser): string | null {
  if (user.email && !user.email.endsWith(TEMP_EMAIL_DOMAIN)) return user.email;
  const phone = user.phoneNumber;
  if (phone) {
    const d = phone.replace(/\D/g, "").slice(-10);
    return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : phone;
  }
  return null;
}

const pillClass =
  "rounded-full px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * The account entry point in the nav. Signed in, it's a profile avatar that
 * reveals a quick-action panel — on hover for pointer users, on tap/click for
 * touch and keyboard — with shortcuts into the account sections and a Log out.
 * Signed out, a "Log in" pill; while the session resolves, a fixed-size
 * placeholder so the header doesn't shift.
 */
export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const { logout, loggingOut } = useLogout();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerType = useRef<string>("");

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  }
  // Hover-to-open is for pointer devices only. On touch, a tap emits a synthetic
  // mouseenter right before the click — if that opened the menu, the click would
  // then toggle it straight back closed. Gating on pointerType leaves touch to the
  // click handler alone.
  function onPointerEnter(e: React.PointerEvent) {
    if (e.pointerType === "mouse") openMenu();
  }
  function onPointerLeave(e: React.PointerEvent) {
    if (e.pointerType === "mouse") scheduleClose();
  }

  // Close on Escape (returning focus to the trigger) and on any pointer press
  // outside the menu — the two ways a user signals they're done with it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  if (isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-foreground/10" aria-hidden />;
  }

  if (!session) {
    return (
      <Link href="/login" className={pillClass}>
        Log in
      </Link>
    );
  }

  const user = session.user as SessionUser;
  const initials = accountInitials(user);
  const displayName =
    user.name && user.name.toLowerCase() !== PLACEHOLDER_NAME ? user.name : "Your account";
  const contact = contactLine(user);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        onPointerDown={(e) => {
          lastPointerType.current = e.pointerType;
        }}
        onClick={(e) => {
          // Mouse users already have the menu on hover, so a click is a shortcut
          // straight to the account page. Touch and keyboard have no hover, so for
          // them a tap / Enter opens the menu instead. e.detail === 0 marks a
          // keyboard activation (Enter/Space), which must open, never navigate.
          if (e.detail !== 0 && lastPointerType.current === "mouse") {
            router.push("/account");
          } else {
            setOpen((o) => !o);
          }
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        aria-label="Your account"
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20",
          open && "bg-primary/20",
          focusRing,
        )}
      >
        {initials ?? <UserRound className="size-[18px]" aria-hidden />}
      </button>

      {open && (
        <div
          id="user-menu-panel"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-xl border border-border bg-popover p-1.5 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:slide-in-from-top-1 motion-safe:duration-150"
        >
          <div className="px-3 py-2">
            <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
            {contact && <div className="truncate text-xs text-muted-foreground">{contact}</div>}
          </div>

          <div className="my-1 h-px bg-border" />

          <MenuLink href="/account" icon={UserRound} onNavigate={() => setOpen(false)}>
            Your account
          </MenuLink>
          <MenuLink href="/account/reports" icon={FileText} onNavigate={() => setOpen(false)}>
            My reports
          </MenuLink>
          <MenuLink href="/account/orders" icon={ShoppingBag} onNavigate={() => setOpen(false)}>
            Orders
          </MenuLink>

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            disabled={loggingOut}
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-60",
              focusRing,
            )}
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden />
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onNavigate,
  children,
}: {
  href: string;
  icon: typeof UserRound;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]",
        focusRing,
      )}
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      {children}
    </Link>
  );
}
