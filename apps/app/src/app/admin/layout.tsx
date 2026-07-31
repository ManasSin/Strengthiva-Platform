import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

// Real per-person admin gate — replaces the shared X-Admin-Key model as the
// primary way a human reaches admin tooling (document indexing, batch
// certificates). See docs/platform-architecture/tech-specs/backend/
// admin-authentication.md. Server-rendered so a non-admin never even receives
// the admin UI's markup, not just a client-side redirect after the fact.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  const role = (session.user as { role?: string | null }).role;
  if (role !== "admin") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
        <div>
          <h1 className="text-xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-gray-500">
            Your account ({session.user.email}) doesn&apos;t have admin access.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4 flex items-center gap-6">
        <span className="font-semibold">Strengthiva Admin</span>
        <Link href="/admin/knowledge-base" className="text-sm text-gray-600 hover:text-gray-900">
          Knowledge Base
        </Link>
        <Link href="/admin/batch-certificates" className="text-sm text-gray-600 hover:text-gray-900">
          Batch Certificates
        </Link>
        <Link href="/admin/questionnaire" className="text-sm text-gray-600 hover:text-gray-900">
          Questionnaire
        </Link>
        <Link href="/admin/products" className="text-sm text-gray-600 hover:text-gray-900">
          Products
        </Link>
        <span className="ml-auto text-sm text-gray-400">{session.user.email}</span>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
