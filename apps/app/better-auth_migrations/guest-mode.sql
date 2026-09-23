-- Guest sign-in while OTP delivery isn't live (OTP_BYPASS, see src/lib/auth-mode.ts).
-- isAnonymous: Better Auth anonymous plugin. contactPhone/contactEmail: unverified
-- contact details a guest gives before the assessment (auth.ts user.additionalFields).
-- Additive and nullable; safe to run before or after the app deploy.
alter table "user" add column if not exists "isAnonymous" boolean;
alter table "user" add column if not exists "contactPhone" text;
alter table "user" add column if not exists "contactEmail" text;
