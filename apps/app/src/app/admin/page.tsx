import Link from "next/link";
import { Icon } from "@strengthiva/transparency/ui";

const supportingTools = [
  {
    href: "/admin/knowledge-base",
    icon: "file",
    name: "Knowledge base",
    description:
      "Index diet charts and product recommendation documents for the AI.",
  },
  {
    href: "/admin/questionnaire",
    icon: "flask",
    name: "Questionnaire",
    description:
      "Maintain the questions and condition steps in the health assessment.",
  },
  {
    href: "/admin/products",
    icon: "settings",
    name: "Products",
    description:
      "Import and update the catalogue items used in recommendations.",
  },
];

export default function AdminHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-2 sm:py-6">
      <section className="max-w-3xl">
        <h1 className="font-display text-title text-foreground text-balance">
          Admin workspace
        </h1>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-muted-foreground">
          Manage the systems behind Strengthiva&apos;s products, assessments, and
          customer guidance.
        </p>
      </section>

      <section
        className="overflow-hidden rounded-2xl bg-[#15201a] text-white shadow-[0_26px_60px_-32px_rgba(21,32,26,0.52)]"
        aria-labelledby="transparency-title"
      >
        <div className="grid gap-8 px-6 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-end lg:gap-12">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#a8c6b2] text-[#15201a]">
              <Icon name="layers" className="size-5" />
            </div>
            <h2
              id="transparency-title"
              className="mt-6 font-display text-[2.1rem] leading-[1.02] tracking-[-0.025em] sm:text-[2.6rem]"
            >
              Product transparency
            </h2>
            <p className="mt-3 max-w-xl text-[0.98rem] leading-7 text-[#d8e5dd]">
              Turn manufacturing workbooks and verified evidence into the
              records customers reach from a product QR code.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/admin/batches"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#a8c6b2] px-4 py-2.5 text-sm font-semibold text-[#15201a] transition-colors hover:bg-[#93b6a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8e5dd]"
              >
                Open workspace
                <Icon name="arrow-right" className="size-4" />
              </Link>
              <Link
                href="/admin/import"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#d8e5dd] underline decoration-[#a8c6b2]/70 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8e5dd]"
              >
                Import a workbook
              </Link>
              <Link
                href="/admin/documents"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#d8e5dd] underline decoration-[#a8c6b2]/70 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8e5dd]"
              >
                Manage documents
              </Link>
            </div>
          </div>

          <ol className="grid gap-4 border-t border-white/15 pt-5 text-sm lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            {[
              "Import the manufacturing workbook.",
              "Review the extracted product records.",
              "Publish QR-ready product details.",
            ].map((step, index) => (
              <li className="flex gap-3 leading-6 text-[#d8e5dd]" key={step}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="other-tools-title" className="pb-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 id="other-tools-title" className="font-display text-heading text-foreground">
              Other systems
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Keep the content and catalogue that power the wider experience in
              step.
            </p>
          </div>
        </div>
        <div className="divide-y divide-border rounded-b-2xl border-x border-b border-border bg-background">
          {supportingTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex min-h-24 items-center gap-4 px-5 py-5 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:gap-5 sm:px-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-foreground">
                <Icon name={tool.icon} className="size-[1.1rem]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.98rem] font-semibold text-foreground">
                  {tool.name}
                </span>
                <span className="mt-1 block max-w-2xl text-sm leading-6 text-muted-foreground">
                  {tool.description}
                </span>
              </span>
              <Icon
                name="arrow-right"
                className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-foreground"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
