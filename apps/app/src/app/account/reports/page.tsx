"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, type ReportListItem } from "@/lib/api-client";
import { ButtonLink } from "@/components/ui/button-link";
import { AccountCard, EmptyState } from "@/components/account/account-ui";

// GET /api/v1/reports has existed since reports were built but had no UI — a
// customer could only reach a report by holding on to its URL.
export default function AccountReportsPage() {
  const [reports, setReports] = useState<ReportListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listReports()
      .then(setReports)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load your reports."),
      );
  }, []);

  return (
    <AccountCard title="My reports" description="Every assessment you've completed.">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!reports && !error && <div className="h-24 animate-pulse rounded-lg bg-border/40" />}

      {reports?.length === 0 && (
        <EmptyState
          title="No reports yet"
          body="Take the assessment and your Ayurvedic reading and diet plan will appear here."
          action={
            <ButtonLink href="/assessment" variant="default" size="lg">
              Take the assessment
            </ButtonLink>
          }
        />
      )}

      {reports && reports.length > 0 && (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li key={report.id}>
              <Link
                href={`/report/${report.id}`}
                className="block rounded-xl border border-border p-5 transition-colors hover:border-primary/50 hover:bg-tertiary/20"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {/* The stored summary is full prose; this is a list, so clamp it. */}
                <p className="mt-2 line-clamp-2 text-sm text-foreground">{report.summary}</p>
                <span className="mt-3 inline-block text-sm font-medium text-primary">
                  View report →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountCard>
  );
}
