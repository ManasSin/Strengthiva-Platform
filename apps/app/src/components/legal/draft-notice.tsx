// Shared across Privacy/Terms/Shipping Policy — these are structural drafts, not
// reviewed legal copy. Real health/commerce legal documents need actual legal
// review before publication; presenting invented terms as authoritative would be
// actively misleading, not just incomplete. Keep this visible until that review
// happens, don't quietly drop it.
export function DraftNotice() {
  return (
    <div className="mb-8 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-foreground">
      <strong>Draft — pending legal review.</strong> This page describes our intended
      practices but has not yet been reviewed by legal counsel. Do not treat it as a final,
      binding policy.
    </div>
  );
}
