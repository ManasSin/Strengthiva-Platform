"use client";

import type { ReactNode } from "react";

/** Shared shell for every account section, so the four pages stay visually consistent. */
export function AccountCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 md:p-8">
      {title && <h2 className="font-headline text-xl font-bold text-foreground">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className={title ? "mt-6" : ""}>{children}</div>
    </section>
  );
}

/**
 * One label/value row that swaps into an editor in place. Keeping the read and
 * edit states in the same row means the page doesn't reflow when you start
 * editing, and only one field can be open at a time (the parent owns that).
 */
export function FieldRow({
  label,
  value,
  editing,
  onEdit,
  onCancel,
  last = false,
  children,
}: {
  label: string;
  value: ReactNode;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "py-4" : "border-b border-border py-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <button
          type="button"
          onClick={editing ? onCancel : onEdit}
          className="text-sm font-medium text-primary hover:underline"
        >
          {editing ? "Cancel" : "Change"}
        </button>
      </div>
      {editing ? (
        <div className="mt-3">{children}</div>
      ) : (
        <div className="mt-1 text-base text-foreground">{value}</div>
      )}
    </div>
  );
}

export function Notice({
  children,
  onDismiss,
}: {
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 font-medium">
          ✕
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <div className="font-medium text-foreground">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
