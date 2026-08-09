"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  Download,
  Droplet,
  Flame,
  Sparkles,
  Star,
  Wind,
} from "lucide-react";

import { FlowShell } from "@/components/assessment/flow-shell";
import { MarketingFooter } from "@/components/layout/footer";
import { StoreLink } from "@/components/layout/store-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { Eyebrow } from "@/components/ui/label";
import { parseDoshaHero } from "@/lib/dosha";
import { api, ApiError, type ReportResponse, type ResolvedProduct } from "@/lib/api-client";

// Output / plan page — the flow's step 3.
//
// Restyled for the 2026-08 rebrand against docs/redesign/output page
// redesign.png: numbered sections (01 Understanding · 02 Direction · 03
// Support), a disclaimer band directly under the title, and a forest checkout
// band at the foot.
//
// Two things in that reference are presentation-only wishes the API can't back,
// and are handled rather than faked:
//
//  - The diet is rendered as a six-cell MORNING/BREAKFAST/LUNCH/EVENING/DINNER/
//    BE MINDFUL OF grid. `report.diet` is a single markdown blob (see
//    prompts.py), not a structured day, so splitting it into six labelled cells
//    would mean guessing at headings the model isn't contracted to emit. It's
//    rendered as one panel with the reference's typography instead; turning it
//    into a real grid is a backend schema change, not a CSS one.
//  - Product cards show a star rating and a review count. There is no ratings
//    data anywhere in the stack, so that line is omitted — inventing "4.8 ·
//    2,000+ readings" for a pre-launch brand is exactly the fabricated social
//    proof that was stripped out of the landing page.
//
// Diet is single-day (decided 2026-07-14 — not the older mockups' "7-Day Plan"
// framing). Products are re-resolved live by FastAPI on every fetch (never
// cached) — see tech-specs/backend/product-resolution-service.md — so "in stock"
// here can genuinely differ between two page loads of the same report.
export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPdf() {
    if (!report) return;
    setDownloading(true);
    try {
      const [{ pdf }, { ReportDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/report-pdf"),
      ]);
      const blob = await pdf(<ReportDocument report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "strengthiva-report.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    api
      .getReport(id)
      .then(setReport)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        setError("We couldn't load this report.");
      });
  }, [id]);

  if (error) {
    return (
      <FlowShell step="plan" completed={["upload", "questions"]} width="wide">
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
          {error}
        </p>
      </FlowShell>
    );
  }

  if (!report) {
    return (
      <FlowShell step="plan" completed={["upload", "questions"]} width="wide">
        <div className="flex justify-center py-24">
          <div className="size-10 rounded-full border-[3px] border-border border-t-primary motion-safe:animate-spin" />
          <span className="sr-only">Loading your plan</span>
        </div>
      </FlowShell>
    );
  }

  const hero = parseDoshaHero(report.dosha);
  const purchasable = report.products.filter((p) => p.resolution.status === "resolved");
  const total = purchasable.reduce(
    (sum, p) => sum + (p.resolution.status === "resolved" ? (p.resolution.price ?? 0) : 0),
    0,
  );
  const currency =
    purchasable.find((p) => p.resolution.status === "resolved" && p.resolution.currency_code)
      ?.resolution as { currency_code?: string | null } | undefined;

  return (
    <>
      <FlowShell
        step="plan"
        completed={["upload", "questions"]}
        back={{ href: "/assessment/questionnaire", label: "Back to questions" }}
        width="wide"
      >
        {/* Title and its actions on one baseline. `items-end` + `flex-wrap`
            rather than a two-column grid: the actions stay pinned to the
            heading's last line at every width, and drop cleanly beneath it on a
            phone instead of being squeezed into a 100px column. */}
        <header className="mb-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Your plan · built for you</Eyebrow>
            <h1 className="mt-2.5 text-[clamp(1.875rem,4.4vw,2.75rem)]">
              Here&rsquo;s you, and what supports you.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
              <Download strokeWidth={1.7} />
              {downloading ? "Preparing…" : "Save plan"}
            </Button>
          </div>
        </header>

        <p className="mb-9 mt-5 flex items-start gap-3 rounded-md border border-border bg-surface px-5 py-4 text-[0.84375rem] leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 size-[1.1875rem] shrink-0 text-primary" strokeWidth={1.7} />
          This is educational wellness guidance, not a medical diagnosis. For any medical
          decision — especially around medications or a diagnosed condition — please consult a
          qualified professional.
        </p>

        {/* ── 01 Understanding ─────────────────────────────────────────────── */}
        {/* The reference lays this out as three cards (constitution / main
            concern / goal) over a wide summary box. Only the constitution and
            its component doshas are real fields on this response — there is no
            "main concern" or "goal" — so it's two cards over the same wide
            box rather than a third card padded with something invented. */}
        <PlanSection n="01" title="Understanding — here's you">
          <div className="grid gap-4 md:grid-cols-2">
            <UnderstandingCard k="Your constitution" v={hero.name}>
              {hero.blurb}
            </UnderstandingCard>
            {hero.components.length > 0 && (
              <UnderstandingCard k="What's in the mix" v={hero.components.join(" · ")}>
                <span className="flex flex-wrap gap-1.5">
                  {hero.components.map((c) => (
                    <Badge key={c} variant="accent" size="sm">
                      <DoshaGlyph component={c} />
                      {c}
                    </Badge>
                  ))}
                </span>
              </UnderstandingCard>
            )}
          </div>

          <div className="mt-4 rounded-md border border-border bg-background p-6">
            <Markdown className="text-[0.96875rem] leading-relaxed">{report.summary}</Markdown>
          </div>

          <details className="group mt-4 rounded-md border border-border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-[0.90625rem] font-medium">
              The full reading
              <ArrowRight
                className="size-4 shrink-0 text-primary transition-transform group-open:rotate-90"
                strokeWidth={1.7}
              />
            </summary>
            <div className="border-t border-hairline-soft p-6 pt-5">
              <Markdown className="text-[0.96875rem] leading-relaxed">{report.dosha}</Markdown>
            </div>
          </details>
        </PlanSection>

        {/* ── 02 Direction ─────────────────────────────────────────────────── */}
        <PlanSection n="02" title="Direction — here's your diet" tag="A day, built around your reading">
          <div className="rounded-lg border border-border bg-background p-6">
            <Markdown className="text-[0.96875rem] leading-relaxed">{report.diet}</Markdown>
          </div>
        </PlanSection>

        {/* ── 03 Support ───────────────────────────────────────────────────── */}
        <PlanSection n="03" title="Support — only what's needed" tag="After the plan, never before">
          {/* Products withheld for a clinical reason (under-18, pregnancy,
              lactation). Rendered INSTEAD of the product grid, never alongside
              it — and never as the plain "no recommendations" line below, which
              would read as "nothing suits you" rather than "we're deliberately
              not advising here". */}
          {report.product_disclaimer ? (
            <div className="rounded-md border border-border bg-tertiary p-6">
              <p className="text-sm leading-relaxed text-foreground">{report.product_disclaimer}</p>
              <Link href="/contact" className="link-quiet mt-4 text-sm">
                Book a call with us
                <ArrowRight className="size-4" strokeWidth={1.7} />
              </Link>
            </div>
          ) : report.products.length === 0 ? (
            <p className="rounded-md border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
              Nothing to add right now — your plan is the diet and the routine above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {report.products.map((product, i) => (
                <ProductCard key={`${product.name}-${i}`} product={product} />
              ))}
            </div>
          )}
        </PlanSection>

        {purchasable.length > 0 && total > 0 && (
          <div className="on-forest mt-6 flex flex-wrap items-center justify-between gap-5 rounded-lg bg-forest px-7 py-6 text-surface">
            <div>
              <b className="font-display text-[1.625rem] font-normal text-white">
                {currency?.currency_code?.toUpperCase() ?? ""} {total.toLocaleString()}
              </b>
              <span className="block text-[0.8125rem] text-surface/70">
                {purchasable.length} formulation{purchasable.length === 1 ? "" : "s"} · resolved
                live, so availability is current
              </span>
            </div>
            {/* Checkout lives on the store, not here — StoreLink carries a
                signed-in user's session across the origin boundary so they
                don't land on the cart signed out. */}
            <StoreLink path="/in/cart" className={buttonVariants({ variant: "onforest" })}>
              Review &amp; checkout
              <ArrowRight strokeWidth={1.7} />
            </StoreLink>
          </div>
        )}

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Health changes — so should the plan.{" "}
          <Link href="/assessment" className="link-quiet">
            Reassess in a few weeks →
          </Link>
        </p>
      </FlowShell>
      <MarketingFooter />
    </>
  );
}

/* ── Section chrome ───────────────────────────────────────────────────────── */

function PlanSection({
  n,
  title,
  tag,
  children,
}: {
  n: string;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <span className="font-mono text-xs tracking-[0.08em] text-primary">{n}</span>
        <h2 className="text-heading">{title}</h2>
        {tag && <span className="ml-auto text-[0.78125rem] text-muted-foreground">{tag}</span>}
      </div>
      {children}
    </section>
  );
}

function UnderstandingCard({
  k,
  v,
  children,
}: {
  k: string;
  v: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-5">
      <div className="mb-2.5 font-mono text-label uppercase text-primary">{k}</div>
      <div className="mb-1.5 font-display text-2xl leading-tight">{v}</div>
      <div className="text-[0.84375rem] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

/** Vata / Pitta / Kapha as linear icons, replacing the emoji the old page used. */
function DoshaGlyph({ component }: { component: string }) {
  const Glyph =
    component === "Vata" ? Wind : component === "Pitta" ? Flame : component === "Kapha" ? Droplet : Star;
  return <Glyph className="size-3.5" strokeWidth={1.7} aria-hidden />;
}

/* ── Product card ─────────────────────────────────────────────────────────── */

function ProductCard({ product }: { product: ResolvedProduct }) {
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  async function handleAddToCart(variantId: string) {
    setAdding(true);
    setCartError(null);
    try {
      const { store_cart_url } = await api.addToCart(variantId);
      window.open(store_cart_url, "_blank");
    } catch (err) {
      // Cart Bridge failure — surface it and leave the button re-enabled so the
      // user can retry, per app/routers/cart.py's 502 on MedusaClientError.
      // Swallowing this silently made a broken Cart Bridge look like a dead
      // button, which is exactly how it was reported by the client.
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setCartError(
        err instanceof ApiError ? err.message : "Couldn't add this to your cart. Please try again.",
      );
    } finally {
      setAdding(false);
    }
  }

  const resolved = product.resolution.status === "resolved" ? product.resolution : null;

  return (
    // `flex flex-col` with the footer pushed by `mt-auto`: the price/CTA row now
    // sits on the same line across all three cards regardless of how long each
    // product's reason runs. The status badge is a normal flow element in the
    // header row too — it used to be `absolute right-4 top-4` with a matching
    // `pr-24` guess on the title, which clipped any product name long enough to
    // reach it.
    <article className="flex flex-col overflow-hidden rounded-md border border-border bg-background transition-[box-shadow,transform] duration-200 hover:shadow-soft motion-safe:hover:-translate-y-0.5">
      <div className="grid h-28 place-items-center bg-gradient-to-b from-sage-soft/70 to-surface-2">
        <BottleGlyph />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-[1.125rem] leading-snug">{product.name}</h3>
          <StatusBadge resolution={product.resolution} />
        </div>
        {product.purpose && (
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {product.purpose}
          </p>
        )}
        {product.conditions && product.conditions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.conditions.map((c) => (
              <Badge key={c} size="sm">
                {c}
              </Badge>
            ))}
          </div>
        )}
        {product.complement && (
          <p className="mt-3 border-t border-hairline-soft pt-2.5 text-xs text-muted-foreground">
            ↗ {product.complement}
          </p>
        )}

        <div className="mt-auto pt-4">
          {resolved ? (
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xl">
                {resolved.price !== null
                  ? `${resolved.currency_code?.toUpperCase() ?? ""} ${resolved.price}`
                  : "Price unavailable"}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={adding}
                onClick={() => handleAddToCart(resolved.medusa_variant_id)}
              >
                {adding ? "Adding…" : "Add to plan"}
              </Button>
            </div>
          ) : (
            // A recommended product that isn't purchasable online is still shown
            // (it may be a genuine fit) — the client also sells through offline
            // stores, so we point the user there instead of hiding it.
            <p className="border-t border-hairline-soft pt-3 text-xs text-muted-foreground">
              {product.resolution.status === "out_of_stock"
                ? "Out of stock online — available at Strengthiva stores near you."
                : "Available at Strengthiva stores — ask for it by name."}
            </p>
          )}
          {cartError && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {cartError}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ resolution }: { resolution: ResolvedProduct["resolution"] }) {
  const map = {
    resolved: { label: "In stock", variant: "flag" },
    out_of_stock: { label: "In-store only", variant: "flag-watch" },
    unmapped: { label: "In-store only", variant: "flag-watch" },
  } as const;
  const { label, variant } = map[resolution.status];
  return (
    <Badge variant={variant} size="sm" className="shrink-0">
      {label}
    </Badge>
  );
}

/** The line-drawn bottle that stands in for product photography. */
function BottleGlyph() {
  return (
    <span aria-hidden className="relative block h-[4.375rem] w-11">
      <span className="absolute -top-2 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-t-[3px] bg-primary" />
      <span className="absolute inset-0 rounded-lg border border-border bg-background shadow-hairline" />
      <span className="absolute inset-x-1.5 bottom-2.5 top-6 rounded-[3px] border border-hairline-soft bg-surface" />
    </span>
  );
}
