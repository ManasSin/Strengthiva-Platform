import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";

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
          <span className="mx-auto block w-fit rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary">
            Sample Plan — Illustrative Only
          </span>
          <h1 className="mt-4 text-center font-headline text-3xl font-bold text-foreground">
            Here&apos;s What Your Path to Vitality Looks Like
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            A real assessment takes about 5 minutes and produces a plan tailored to your
            answers — here&apos;s an example of one.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                Ayurvedic Constitution
              </span>
              <h2 className="mt-4 font-headline text-2xl font-bold">Pitta-Vata</h2>
              <p className="mt-3 text-sm text-white/90">
                A dual constitution — dominant Pitta (fire/metabolism) with a Vata
                (air/movement) secondary influence, prone to stress-driven energy dips.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-semibold text-foreground">Summary</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Priya, managing your reported fatigue and occasional stress is the primary
                focus here. Your regular exercise habit is a strong foundation — we&apos;ll
                build on it with targeted nutrition and calming daily rituals.
              </p>
            </div>
          </div>

          <section className="mt-10 rounded-2xl border border-border bg-white p-6">
            <h2 className="font-headline text-lg font-bold text-foreground">Daily Diet Plan</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
              <p><strong>Early Morning:</strong> Warm water with lemon, soaked almonds (5)</p>
              <p><strong>Breakfast:</strong> Moong dal chilla with mint chutney, herbal tea</p>
              <p><strong>Lunch:</strong> Steamed rice, dal, seasonal cooked vegetables, ghee</p>
              <p><strong>Evening:</strong> Roasted chana or fruit, chamomile tea</p>
              <p><strong>Dinner:</strong> Light khichdi with cumin and coriander</p>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-headline text-lg font-bold text-foreground">
              <span className="text-secondary">Therapeutic</span> Recommendations
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="relative rounded-xl border border-border bg-white p-5">
                <span className="absolute right-4 top-4 rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                  In Stock
                </span>
                <h3 className="pr-24 text-sm font-bold text-foreground">Ashwagandha Capsules</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Supports healthy stress response and steady energy levels.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Stress
                  </span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Fatigue
                  </span>
                </div>
              </div>
              <div className="relative rounded-xl border border-border bg-white p-5">
                <span className="absolute right-4 top-4 rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                  In Stock
                </span>
                <h3 className="pr-24 text-sm font-bold text-foreground">Triphala Churna</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gentle daily support for digestion and regularity.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Digestion
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-12 rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-12 text-center text-white">
            <h2 className="font-headline text-2xl font-bold">Ready to see your own plan?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Take the real assessment — it takes about 5 minutes.
            </p>
            <ButtonLink href="/assessment" variant="secondary" size="lg" className="mt-6">
              Start Your Free Assessment
            </ButtonLink>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
