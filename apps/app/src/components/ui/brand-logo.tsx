import Image from "next/image";
import { cn } from "@/lib/utils";

// The Strengthiva lockup (orange bolt + green wordmark), from
// docs/figma exports/Logo-green.png → public/logo-green.png. It already contains the
// name, so it's never paired with a "Strengthiva" text label. Needs a light
// background: the green wordmark disappears on the forest bands.
export function BrandLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-green.png"
      alt="Strengthiva"
      width={400}
      height={321}
      priority={priority}
      className={cn("h-12 w-auto", className)}
    />
  );
}
