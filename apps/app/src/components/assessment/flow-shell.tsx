import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import type { ReactNode } from "react";

import { MarketingNav } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

// Shared chrome for the three-step assessment flow — Upload · Questions · Your
// plan. Introduced in the 2026-08 rebrand: docs/redesign's upload, assessment,
// report-confirmation and output screenshots all show the same sage-surface
// shell, back link and stepper, and before this each of those four pages
// open-coded its own header with slightly different spacing.

export type FlowStepState = "done" | "current" | "todo";

// `note` is declared on the element type rather than inferred per-entry, so the
// two steps that omit it still narrow to a shape that has the key.
const FLOW_STEPS: readonly { id: "upload" | "questions" | "plan"; label: string; note?: string }[] =
  [
    { id: "upload", label: "Upload", note: "optional" },
    { id: "questions", label: "Questions" },
    { id: "plan", label: "Your plan" },
  ];

export type FlowStepId = (typeof FLOW_STEPS)[number]["id"];

/**
 * Three-step progress rail.
 *
 * Semantics before ornament: it's an <ol>, the current step carries
 * `aria-current="step"`, and completed steps say so in text for a screen reader
 * rather than relying on the tick glyph alone.
 */
export function FlowStepper({
  current,
  completed = [],
  className,
}: {
  current: FlowStepId;
  completed?: FlowStepId[];
  className?: string;
}) {
  const stateOf = (id: FlowStepId): FlowStepState =>
    completed.includes(id) ? "done" : id === current ? "current" : "todo";

  return (
    <nav aria-label="Assessment progress" className={className}>
      <ol className="flex items-center">
        {FLOW_STEPS.map((step, i) => {
          const state = stateOf(step.id);
          return (
            <li
              key={step.id}
              className={cn("flex items-center", i > 0 && "min-w-0 flex-1")}
              aria-current={state === "current" ? "step" : undefined}
            >
              {/* Connector first, so the flex-1 growth lands between pills
                  rather than after the last one — that trailing gap was what
                  pushed the rail off-centre against the content below it. */}
              {i > 0 && <span aria-hidden className="mx-3.5 h-px min-w-6 flex-1 bg-border" />}
              <span className="flex shrink-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-7 place-items-center rounded-full border text-[0.8125rem] font-semibold",
                    state === "done" && "border-primary bg-primary text-white",
                    state === "current" && "border-accent bg-accent text-accent-foreground",
                    state === "todo" && "border-border bg-background text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" strokeWidth={2.2} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[0.84375rem]",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                    state === "current" ? "font-semibold" : "font-medium",
                  )}
                >
                  {state === "done" && <span className="sr-only">Completed: </span>}
                  {step.label}
                  {step.note && (
                    <span className="font-normal text-muted-foreground"> · {step.note}</span>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The muted "← Back" affordance above the stepper. */
export function FlowBack({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[0.84375rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" strokeWidth={1.7} />
      {children}
    </Link>
  );
}

/**
 * Page shell: nav, the sage flow surface, back link, stepper, then the page's
 * own content.
 *
 * `width` picks the measure — the upload/questions screens sit in a 940px
 * column, the finished plan needs the full 1160px wrap for its three-up grids.
 */
export function FlowShell({
  step,
  completed,
  back,
  width = "narrow",
  children,
}: {
  step: FlowStepId;
  completed?: FlowStepId[];
  back?: { href: string; label: string };
  width?: "narrow" | "wide";
  children: ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      <main className="flex-1 bg-leaf-motif">
        <div
          className={cn(
            "mx-auto px-5 pb-20 pt-8 sm:px-7",
            width === "narrow" ? "max-w-[58.75rem]" : "max-w-measure",
          )}
        >
          {back && (
            <div className="mb-4">
              <FlowBack href={back.href}>{back.label}</FlowBack>
            </div>
          )}
          <FlowStepper current={step} completed={completed} className="mb-8" />
          {children}
        </div>
      </main>
    </>
  );
}
