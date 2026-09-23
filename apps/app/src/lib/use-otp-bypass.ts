"use client";

import { useEffect, useState } from "react";

// Client view of the server's OTP_BYPASS switch (lib/auth-mode.ts). One request per
// page load, shared by every caller, so the gate's heading and the form under it
// can't disagree. null while unknown.
let pending: Promise<boolean> | null = null;

function fetchOtpBypass(): Promise<boolean> {
  pending ??= fetch("/api/auth-mode")
    .then((r) => (r.ok ? r.json() : { otpBypass: false }))
    .then((d: { otpBypass?: boolean }) => !!d.otpBypass)
    .catch(() => false);
  return pending;
}

export function useOtpBypass(): boolean | null {
  const [value, setValue] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchOtpBypass().then((v) => {
      if (!cancelled) setValue(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return value;
}
