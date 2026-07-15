import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";

const FAQS = [
  {
    q: "What is a dosha, and why does it matter?",
    a: "In Ayurveda, doshas (Vata, Pitta, Kapha) describe the balance of energies that shape your physical and mental tendencies. Knowing your dominant dosha and current imbalances helps us recommend diet and lifestyle changes suited to your specific constitution, rather than generic advice.",
  },
  {
    q: "How long does the health assessment take?",
    a: "Most people finish in about 5 minutes. The number of questions adjusts based on your answers — for example, selecting a chronic condition adds a short set of follow-up questions specific to that condition.",
  },
  {
    q: "Can I upload a doctor's prescription instead of taking the assessment?",
    a: "Yes — use \"Upload Existing Prescription\" from the assessment page. We'll read the symptoms, duration, and prescribed items from it and pre-fill matching fields in the assessment so you don't have to re-enter what your doctor already told you.",
  },
  {
    q: "Is my health information kept private?",
    a: "Yes. Your assessment answers and any uploaded prescriptions are used only to generate your personal report and recommendations. See our Privacy Policy for details on what we collect and how it's used.",
  },
  {
    q: "Are the recommended products reviewed by a real doctor?",
    a: "Yes — product recommendations come from a curated list mapped by our Ayurvedic doctors to specific health conditions, not generated freely by AI.",
  },
  {
    q: "What if a recommended product is out of stock?",
    a: "We'll show its status honestly (in stock, temporarily unavailable, or coming soon) rather than substituting a different product — since each recommendation is chosen for a specific reason.",
  },
  {
    q: "Do I need a separate account for the store?",
    a: "No — one account works across the assessment app and the store. Adding a recommended product to your cart signs you in automatically on the store.",
  },
];

export default function FaqsPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-center font-headline text-3xl font-bold text-primary md:text-4xl">
            Frequently Asked Questions
          </h1>
          <div className="mt-10 space-y-4">
            {FAQS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-border bg-white p-6">
                <h2 className="font-headline text-base font-semibold text-foreground">{item.q}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
