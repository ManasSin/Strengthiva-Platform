import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";

// Customer account section. Server-rendered gate, same shape as /admin's — a
// signed-out visitor never receives the markup, rather than being bounced by a
// client-side effect after it has already rendered.
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?redirect=/account");
  }

  return (
    <>
      <MarketingNav />
      <main className="flex-1 bg-tertiary/20">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-[clamp(1.875rem,4vw,2.5rem)]">Your account</h1>
          <p className="mt-2 text-muted-foreground">
            Signed in as {session.user.email}
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
            <AccountNav />
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
