"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@strengthiva/transparency/ui";

export function DestructiveConfirmDialog({
  title,
  description,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-border bg-background p-0 text-foreground shadow-[0_26px_60px_-24px_rgba(21,32,26,0.32)] backdrop:bg-foreground/45"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="p-6 sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Icon name="alert" className="size-5" />
        </span>
        <h2
          id={titleId}
          className="mt-5 font-display text-heading text-foreground"
        >
          {title}
        </h2>
        <div id={descriptionId} className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-border bg-surface px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
        <Button variant="secondary" size="sm" disabled={busy} onClick={onCancel}>
          Keep files
        </Button>
        <Button variant="destructive" size="sm" disabled={busy} onClick={onConfirm}>
          {busy ? "Removing…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
