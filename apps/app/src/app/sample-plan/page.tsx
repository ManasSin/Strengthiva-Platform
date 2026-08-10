import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";

// "View Sample Plan" — linked from the landing page hero. Illustrative, hardcoded
// content (not a real report — no live assessment behind it) so a prospective
// user can see the shape of the output before taking the real assessment. Mirrors
// report/[id]/page.tsx's layout so the sample matches what they'll actually get.
export default function SamplePlanPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <span className="mx-auto block w-fit rounded-full border border-accent bg-accent/15 px-4 py-1.5 text-sm font-medium text-neutral">
            Sample Plan — Illustrative Only
          </span>
          <h1 className="mt-4 text-center text-[clamp(1.875rem,4vw,2.5rem)]">
            Here&apos;s What Your Path to Vitality Looks Like
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            A real assessment takes about 5 minutes and produces a plan tailored to your
            answers — here&apos;s an example of one.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="on-forest rounded-lg bg-forest p-6 text-surface">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                Ayurvedic Constitution
              </span>
              <h2 className="mt-4 text-heading">Pitta-Vata</h2>
              <p className="mt-3 text-sm leading-relaxed text-surface/80">
                A dual constitution — dominant Pitta (fire/metabolism) with a Vata
                (air/movement) secondary influence, prone to stress-driven energy dips.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground">Summary</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Priya, managing your reported fatigue and occasional stress is the primary
                focus here. Your regular exercise habit is a strong foundation — we&apos;ll
                build on it with targeted nutrition and calming daily rituals.
              </p>
            </div>
          </div>

          <section className="mt-10 rounded-lg border border-border bg-background p-6">
            <h2 className="text-subhead text-foreground">Daily Diet Plan</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
              <p><strong>Early Morning:</strong> Warm water with lemon, soaked almonds (5)</p>
              <p><strong>Breakfast:</strong> Moong dal chilla with mint chutney, herbal tea</p>
              <p><strong>Lunch:</strong> Steamed rice, dal, seasonal cooked vegetables, ghee</p>
              <p><strong>Evening:</strong> Roasted chana or fruit, chamomile tea</p>
              <p><strong>Dinner:</strong> Light khichdi with cumin and coriander</p>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-subhead text-foreground">
              <span className="mark-accent">Therapeutic</span> recommendations
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SampleProduct
                name="Ashwagandha Capsules"
                purpose="Supports healthy stress response and steady energy levels."
                tags={["Stress", "Fatigue"]}
              />
              <SampleProduct
                name="Triphala Churna"
                purpose="Gentle daily support for digestion and regularity."
                tags={["Digestion"]}
              />
            </div>
          </section>

          <div className="on-forest mt-12 rounded-xl bg-forest px-8 py-12 text-center text-surface">
            <h2 className="text-heading">Ready to see your own plan?</h2>
            <p className="mx-auto mt-3 max-w-xl text-surface/80">
              Take the real assessment — it takes about 5 minutes.
            </p>
            <ButtonLink href="/assessment" variant="onforest" size="lg" className="mt-6">
              Start Your Free Assessment
            </ButtonLink>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}

/**
 * One illustrative product card.
 *
 * The status badge sits in a flex header rather than `absolute right-4 top-4`
 * with a guessed `pr-24` on the title — the same hack that was clipping long
 * product names on the real report page. Two hand-written copies of this markup
 * were also drifting apart; one component keeps them honest.
 */
function SampleProduct({
  name,
  purpose,
  tags,
}: {
  name: string;
  purpose: string;
  tags: string[];
}) {
  return (
    <article className="rounded-md border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-[1.0625rem] leading-snug">{name}</h3>
        <Badge variant="flag" size="sm" className="shrink-0">
          In stock
        </Badge>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{purpose}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge key={t} size="sm">
            {t}
          </Badge>
        ))}
      </div>
    </article>
  );
}
