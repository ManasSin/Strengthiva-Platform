import type { ReactNode } from "react";
import { Icon } from "./icons";
export { Icon } from "./icons";

export function Status({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
  icon?: string;
}) {
  return (
    <span className={`status ${tone}`}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}
export function QualityStatus({ value }: { value: "pass" | "fail" | null }) {
  return (
    <Status
      tone={value === "pass" ? "good" : value === "fail" ? "bad" : "neutral"}
      icon={value === "pass" ? "check" : value === "fail" ? "x" : "alert"}
    >
      {value === "pass"
        ? "Passed"
        : value === "fail"
        ? "Failed"
        : "Not recorded"}
    </Status>
  );
}
export function PageHead({
  eyebrow,
  title,
  copy,
  actions,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="page-title">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
export function Panel({
  title,
  copy,
  actions,
  children,
  className = "",
}: {
  title?: string;
  copy?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel panel-pad ${className}`}>
      {title && (
        <div className="panel-title">
          <div>
            <h2>{title}</h2>
            {copy && <p>{copy}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
export function Notice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children?: ReactNode;
  tone?: "info" | "warn" | "bad" | "good";
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "bad" ? "alert" : undefined}
    >
      <Icon name={tone === "good" ? "check" : "alert"} />
      <div>
        <strong>{title}</strong>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
  icon = "layers",
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-symbol">
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Loading({ label = "Loading records" }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <a className="brand" href={href} aria-label="Strengthiva home">
      {/* Served from each app's public/ (apps/app and apps/store both ship it). A plain
          <img> because this package is framework-agnostic. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-logo" src="/logo-green.png" alt="Strengthiva" width={400} height={321} />
    </a>
  );
}
