// SMS delivery via MSG91, used by Better Auth's phone-number plugin to send
// login/sign-up OTPs (see src/lib/auth.ts). MSG91 is the transport only —
// Better Auth generates the code, owns its expiry, and counts failed attempts,
// so there is exactly one source of truth for OTP validity.
//
// Contrast with src/lib/email.ts, which deliberately swallows send failures:
// there, a failed verification email is recoverable ("Resend email"). Here it is
// not — if the SMS never goes out and we report success, the user sits waiting
// for a code that does not exist. So send failures THROW, and the caller surfaces
// them. What must never throw is module-scope setup (email.ts's comment explains
// why: it would take down the whole /api/auth/[...all] route, every auth action
// rather than just this one), which is why config is read lazily inside send().

const MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow";

// MSG91 rejects a request that hangs anyway; the point of the explicit timeout is
// that an unreachable MSG91 must not hold an auth request open indefinitely.
const REQUEST_TIMEOUT_MS = 10_000;

export class SmsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsError";
  }
}

/**
 * Normalizes user input to the `91XXXXXXXXXX` form MSG91 expects, and rejects
 * anything that isn't a plausible Indian mobile number.
 *
 * Validation lives here rather than only in the UI because this is the last point
 * before we spend money on a send — and because Better Auth's phoneNumberValidator
 * hook (auth.ts) reuses it, so the browser and the server agree on what's valid.
 */
export function normalizeIndianMobile(input: string): string | null {
  // Strip everything a person might reasonably type: +, spaces, dashes, brackets.
  const digits = input.replace(/[^\d]/g, "");

  // 10 digits (bare), or 12 with the 91 country code, or 13 with a leading 0 after
  // the country code — anything else isn't an Indian mobile number.
  let local: string;
  if (digits.length === 10) {
    local = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    local = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    local = digits.slice(1);
  } else {
    return null;
  }

  // Indian mobile numbers start with 6-9. Landlines and service codes don't, and
  // an SMS to one is a guaranteed silent failure.
  if (!/^[6-9]\d{9}$/.test(local)) {
    return null;
  }

  return `91${local}`;
}

/** Last 4 digits only — enough to debug a delivery report, not enough to be PII in a log. */
function redact(mobile: string): string {
  return `•••••${mobile.slice(-4)}`;
}

type Msg91Config = {
  authKey: string;
  templateId: string;
  otpVariable: string;
};

/**
 * Reads MSG91 config at call time. Returns null when unconfigured, which callers
 * treat as "fall back to console delivery" — but only outside production, where
 * that is enforced as a hard failure instead.
 */
function readConfig(): Msg91Config | null {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    return null;
  }

  return {
    authKey,
    templateId,
    // Which template variable carries the code. MSG91 templates name their own
    // variables, so this can't be hardcoded — it has to match what was approved
    // in the MSG91 dashboard for MSG91_TEMPLATE_ID.
    otpVariable: process.env.MSG91_OTP_VARIABLE || "otp",
  };
}

/**
 * Sends `code` to `phoneNumber` over MSG91's Flow API.
 *
 * Throws SmsError on any failure — an undelivered OTP must not look like success.
 * Deliberately does NOT retry: a retry risks delivering two codes for one request,
 * and Better Auth invalidates the previous code when a new one is issued, so the
 * user could receive a working code and a dead one with no way to tell them apart.
 */
export async function sendOtpSms(phoneNumber: string, code: string): Promise<void> {
  const mobile = normalizeIndianMobile(phoneNumber);
  if (!mobile) {
    throw new SmsError(`Not a valid Indian mobile number: ${phoneNumber}`);
  }

  const config = readConfig();

  if (!config) {
    // Production must never silently degrade to console delivery — that would
    // mean nobody can log in, with no visible cause. Same reasoning as
    // strengthiva-backend/app/config.py refusing to start with DEV_MODE=true
    // under ENVIRONMENT=production.
    if (process.env.NODE_ENV === "production") {
      throw new SmsError(
        "MSG91_AUTH_KEY / MSG91_TEMPLATE_ID are not set. Refusing to fall back to " +
          "console OTP delivery in production.",
      );
    }
    // Local development before MSG91 credentials exist: print the code so the
    // whole phone-auth flow is exercisable end to end without an account.
    console.warn(
      `[sms] MSG91 not configured — OTP for ${redact(mobile)} is ${code} ` +
        "(development-only console delivery)",
    );
    return;
  }

  let response: Response;
  try {
    response = await fetch(MSG91_FLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: config.authKey,
      },
      body: JSON.stringify({
        template_id: config.templateId,
        recipients: [{ mobiles: mobile, [config.otpVariable]: code }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Network failure or timeout. The code is never included here — logs are the
    // one place an OTP must not end up.
    console.error(`[sms] MSG91 request failed for ${redact(mobile)}`, err);
    throw new SmsError("Could not reach the SMS provider. Please try again.");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      `[sms] MSG91 rejected the send for ${redact(mobile)} — HTTP ${response.status} ${detail.slice(0, 200)}`,
    );
    throw new SmsError("The SMS provider rejected this request. Please try again.");
  }

  // MSG91 returns HTTP 200 with {"type":"error","message":...} for application-level
  // failures (bad template id, insufficient balance, DLT template mismatch) — a
  // status check alone would report those as delivered.
  const body = (await response.json().catch(() => null)) as { type?: string; message?: string } | null;
  if (body?.type === "error") {
    console.error(`[sms] MSG91 returned an error for ${redact(mobile)} — ${body.message}`);
    throw new SmsError("The SMS could not be sent. Please try again.");
  }

  console.info(`[sms] OTP sent to ${redact(mobile)}`);
}
