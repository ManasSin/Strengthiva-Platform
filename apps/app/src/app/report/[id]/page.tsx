"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { doshaIcon, parseDoshaHero } from "@/lib/dosha";
import { api, ApiError, type ReportResponse, type ResolvedProduct } from "@/lib/api-client";

// Output / Report page — ported from the Figma "Output pages" export, reviewed
// in docs/platform-architecture/modules/app-frontend.md §5. Diet is single-day
// (decided 2026-07-14 — not the Figma mockup's "7-Day Plan"/PDF export framing).
// Products are re-resolved live by FastAPI on every fetch (never cached) —
// see tech-specs/backend/product-resolution-service.md — so "in stock" here can
// genuinely differ between two page loads of the same report.
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
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center text-red-700">
        {error}
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </main>
    );
  }

  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="text-center font-headline text-3xl font-bold text-foreground">
            Your Path to Vitality is Ready!
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            We&apos;ve analyzed your profile. Here is your balanced blueprint for peak performance.
          </p>

          <div className="mt-6 flex justify-center">
            <Button variant="secondary" size="lg" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? "Preparing PDF…" : "Download PDF Report"}
            </Button>
          </div>

          {(() => {
            const hero = parseDoshaHero(report.dosha);
            return (
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-white">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                    Primary Constitution
                  </span>
                  <h2 className="mt-4 font-headline text-2xl font-bold">Your Dosha: {hero.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/90">{hero.blurb}</p>
                  {hero.components.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {hero.components.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium"
                        >
                          <span aria-hidden>{doshaIcon(c)}</span> {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-3xl border border-border bg-white p-8">
                  <h3 className="text-sm font-semibold text-foreground">Summary</h3>
                  <Markdown className="mt-3 text-muted-foreground">{report.summary}</Markdown>
                </div>
              </div>
            );
          })()}

          <section className="mt-10 rounded-2xl border border-border bg-white p-8">
            <h2 className="font-headline text-lg font-bold text-foreground">
              Your Ayurvedic Constitution — Full Analysis
            </h2>
            <Markdown className="mt-4 text-foreground">{report.dosha}</Markdown>
          </section>

          <section className="mt-10 rounded-2xl border border-border bg-white p-6">
            <h2 className="font-headline text-lg font-bold text-foreground">Daily Diet Plan</h2>
            <Markdown className="mt-4 text-foreground">{report.diet}</Markdown>
          </section>

          <section className="mt-10">
            <h2 className="font-headline text-lg font-bold text-foreground">
              <span className="text-secondary">Therapeutic</span> Recommendations
            </h2>
            {/* Products withheld for a clinical reason (under-18, pregnancy, lactation).
                Rendered INSTEAD of the product grid, never alongside it — and never as
                the plain "no recommendations" line below, which would read as "nothing
                suits you" rather than "we're deliberately not advising here". */}
            {report.product_disclaimer ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm text-amber-900">{report.product_disclaimer}</p>
                <Link
                  href="/contact"
                  className="mt-3 inline-block text-sm font-medium text-amber-900 underline"
                >
                  Book a call with us
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {report.products.map((product, i) => (
                  <ProductCard key={`${product.name}-${i}`} product={product} />
                ))}
                {report.products.length === 0 && (
                  <p className="text-sm italic text-muted-foreground">No product recommendations for this report.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}

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

  return (
    <div className="relative rounded-xl border border-border bg-white p-5">
      <StatusBadge resolution={product.resolution} />
      <h3 className="pr-24 text-sm font-bold text-foreground">{product.name}</h3>
      {product.purpose && <p className="mt-1 text-sm text-muted-foreground">{product.purpose}</p>}
      {product.conditions && product.conditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.conditions.map((c) => (
            <span key={c} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {c}
            </span>
          ))}
        </div>
      )}
      {product.complement && (
        <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">↗ {product.complement}</p>
      )}

      {product.resolution.status === "resolved" && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold text-foreground">
            {product.resolution.price !== null
              ? `${product.resolution.currency_code?.toUpperCase()} ${product.resolution.price}`
              : "Price unavailable"}
          </span>
          <Button
            variant="secondary"
            className="px-4 py-2 text-xs"
            disabled={adding}
            onClick={() => handleAddToCart(product.resolution.status === "resolved" ? product.resolution.medusa_variant_id : "")}
          >
            {adding ? "Adding…" : "+ Add to Cart"}
          </Button>
        </div>
      )}

      {/* A recommended product that isn't purchasable online is still shown (it may be
          a genuine fit) — the client also sells through offline stores, so we point the
          user there instead of hiding the recommendation. */}
      {product.resolution.status !== "resolved" && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {product.resolution.status === "out_of_stock"
            ? "Out of stock online — available at Strengthiva stores near you."
            : "Available at Strengthiva stores — ask for it by name."}
        </p>
      )}

      {cartError && <p className="mt-3 text-xs text-red-600">{cartError}</p>}
    </div>
  );
}

function StatusBadge({ resolution }: { resolution: ResolvedProduct["resolution"] }) {
  const map = {
    resolved: { label: "In Stock", className: "bg-green-100 text-green-800" },
    out_of_stock: { label: "In-store only", className: "bg-yellow-100 text-yellow-800" },
    unmapped: { label: "In-store only", className: "bg-gray-100 text-gray-600" },
  } as const;
  const { label, className } = map[resolution.status];
  return (
    <span className={`absolute right-4 top-4 rounded px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {label}
    </span>
  );
}
