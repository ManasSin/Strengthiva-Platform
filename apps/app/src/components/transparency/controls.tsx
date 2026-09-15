"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon, Notice } from "@strengthiva/transparency/ui";
import { TransparencyError } from "@/lib/transparency-api";

export function Action({
  children,
  tone = "secondary",
  ...props
}: React.ComponentProps<typeof Button> & {
  tone?: "primary" | "secondary" | "danger" | "quiet";
}) {
  return (
    <Button
      {...props}
      type={props.type || "button"}
      className={`btn btn-${tone} ${props.className || ""}`}
    >
      {children}
    </Button>
  );
}
export function ErrorNotice({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <Notice title="Something needs attention" tone="bad">
      <p>{error.message}</p>
      {error instanceof TransparencyError && error.blockers.length > 0 && (
        <ul>
          {error.blockers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {error instanceof TransparencyError &&
      [401, 403].includes(error.status) ? (
        <Link className="text-btn" href="/login?redirect=/admin/batches">
          Sign in
        </Link>
      ) : (
        retry && <Action onClick={retry}>Try again</Action>
      )}
    </Notice>
  );
}

export function useActiveRail<T extends HTMLElement>(activeKey: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const rail = ref.current;
      const active = rail?.querySelector<HTMLElement>(
        '[aria-current], [aria-pressed="true"], .active'
      );
      if (!rail || !active) return;

      rail.scrollTo({
        left: Math.max(
          0,
          active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2
        ),
        behavior: "auto",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeKey]);

  return ref;
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal tp-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-btn"
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="x" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Dropzone({
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  title,
  copy,
}: {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  title: string;
  copy: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled)
          onFiles(
            Array.from(event.dataTransfer.files).slice(
              0,
              multiple ? undefined : 1
            )
          );
      }}
    >
      <span className="drop-icon">
        <Icon name="upload" />
      </span>
      <h2>{title}</h2>
      <p>{copy}</p>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={title}
        onChange={(event) => {
          if (event.target.files) onFiles(Array.from(event.target.files));
          event.target.value = "";
        }}
      />
      <Action
        tone="primary"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        {disabled ? "Working…" : multiple ? "Choose files" : "Choose file"}
      </Action>
    </div>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="breadcrumb-item" key={index}>
          {index > 0 && <Icon name="chevron-right" />}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
