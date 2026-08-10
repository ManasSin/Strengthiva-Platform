import Link from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

// shadcn/ui ships `Button` for <button> elements only — this is the standard
// composition pattern (documented in shadcn's own examples) for rendering an
// <a>/<Link> styled identically, reusing the same `buttonVariants` CVA config
// rather than duplicating the class list.
type ButtonLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & { className?: string };

export function ButtonLink({ href, variant, size, className, children, ...props }: ButtonLinkProps) {
  // The pill shape now lives in `buttonVariants` itself (every brand control is
  // a pill), so this no longer force-appends `rounded-full` — doing so used to
  // override the `link` variant's square underline treatment.
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
