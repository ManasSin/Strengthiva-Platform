import type { ReactNode } from "react";
import type { PublicRecord as RecordData } from "./types";
import { DOCUMENT_LABELS, formatDate, outcome, quantity } from "./domain";
import { Brand, Icon, QualityStatus, Status } from "./ui";
import { PrintButton, Theme, ThemeToggle } from "./theme";

function Section({
  title,
  copy,
  extra,
  children,
}: {
  title: string;
  copy: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="public-section">
      <div className="public-section-head">
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}
export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <Theme>
      <div className="public-shell">
        <a className="skip-link" href="#product-record">
          Skip to product record
        </a>
        <header className="public-bar">
          <Brand />
          <div className="public-actions">
            <PrintButton />
            <ThemeToggle />
          </div>
        </header>
        {children}
      </div>
    </Theme>
  );
}
export function PublicRecord({
  data,
  preview = false,
}: {
  data: RecordData;
  preview?: boolean;
}) {
  const expired = data.expiry_state === "expired";
  const expiring = data.expiry_state === "expiring_soon";
  const passes = data.quality_checks.filter(
    (check) => check.outcome === "pass"
  ).length;
  return (
    <div className="public-main" id="product-record">
      {preview && (
        <div className="notice info">
          <Icon name="eye" />
          <div>
            <strong>Customer preview</strong>
            <p>
              This preview uses the saved record. Drafts are visible only to
              administrators.
            </p>
          </div>
        </div>
      )}
      <section className="public-hero">
        <article className="product-identity">
          <div>
            <div className="eyebrow">Product transparency</div>
            {preview ? (
              <h2>{data.product_name}</h2>
            ) : (
              <h1>{data.product_name}</h1>
            )}
            <p>
              Manufacturing details and ingredient traceability, shared by
              Strengthiva.
            </p>
          </div>
          <div className="identity-foot">
            <div className="identity-code">
              <strong>{data.batch_number}</strong>
              <span>One product · one batch</span>
            </div>
            <span className="identity-seal">
              <Icon name="leaf" />
            </span>
          </div>
        </article>
        <article
          className={`verification-card ${
            expired ? "is-expired" : expiring ? "is-expiring" : ""
          }`}
        >
          <div className="verify-head">
            <div>
              <h2>
                {expired ? "This batch has expired" : "Verified batch record"}
              </h2>
              <p>
                {expired
                  ? `This record remains available for reference. The product expired on ${formatDate(
                      data.expiry_date
                    )}.`
                  : expiring
                  ? `This batch is approaching its expiry date. Expiry: ${formatDate(
                      data.expiry_date
                    )}.`
                  : "This product and batch record was published by Strengthiva. Review the recorded quality results below."}
              </p>
            </div>
            <Status
              tone={expired ? "bad" : expiring ? "warn" : "good"}
              icon={expired || expiring ? "alert" : "check"}
            >
              {expired ? "Expired" : expiring ? "Expiring soon" : "Published"}
            </Status>
          </div>
          <div className="fact-grid">
            <Fact label="Manufactured">
              {formatDate(data.manufacturing_date)}
            </Fact>
            <Fact label="Expiry">
              <span className="expiry-date">
                {formatDate(data.expiry_date)}
              </span>
            </Fact>
            <Fact label="Batch">
              <span className="mono">{data.batch_number}</span>
            </Fact>
            <Fact label="FSSAI licence">
              {data.fssai_licence || "Not recorded"}
            </Fact>
            <Fact label="AYUSH licence">
              {data.ayush_licence || "Not recorded"}
            </Fact>
            <Fact label="Manufacturer">
              {data.manufacturer_name || "Not recorded"}
            </Fact>
          </div>
          <div className="scope-note">
            <Icon name="lock" />
            <span>
              This QR identifies{" "}
              <strong>
                {data.product_name} from {data.batch_number} only
              </strong>
              . The same code is shared by units in this batch; it does not
              authenticate an individual bottle.
            </span>
          </div>
        </article>
      </section>
      <Section
        title="Quality checks"
        copy="Recorded release checks for this product. Open a check for more information."
        extra={
          <Status
            tone={
              passes === data.quality_checks.length && passes > 0
                ? "good"
                : "neutral"
            }
          >
            {passes} of {data.quality_checks.length} passed
          </Status>
        }
      >
        <div className="quality-grid">
          {data.quality_checks.map((check) => (
            <div className="quality-item" key={check.label}>
              <strong>{check.label}</strong>
              <QualityStatus value={check.outcome} />
            </div>
          ))}
        </div>
        <div className="quality-evidence">
          {data.quality_checks.map((check) => (
            <details className="disclosure" key={check.label}>
              <summary>
                <Icon name={check.outcome === "pass" ? "check" : "alert"} />
                <strong>
                  {check.label}
                  <span className="tiny muted disclosure-hint">
                    More information
                  </span>
                </strong>
                <QualityStatus value={check.outcome} />
                <Icon name="chevron-down" className="chevron" />
              </summary>
              <div className="evidence-grid">
                <div>
                  <span>Recorded result</span>
                  <strong>
                    {check.recorded || "No result has been recorded."}
                  </strong>
                </div>
                <div>
                  <span>Permitted limit</span>
                  <strong>Not provided in this record</strong>
                </div>
                <div>
                  <span>Measured value</span>
                  <strong>
                    Refer to the published laboratory report, if available.
                  </strong>
                </div>
              </div>
            </details>
          ))}
        </div>
        <p className="tiny muted">
          A missing or unrecognised result is shown as “Not recorded”; it is
          never counted as a pass.
        </p>
      </Section>
      <Section
        title="Ingredient traceability"
        copy="The materials, quantities, sources, and laboratory evidence recorded for this product."
        extra={
          <span className="small muted">
            {data.ingredients.length} ingredients
          </span>
        }
      >
        <div className="trace-list">
          {data.ingredients.map((ingredient, index) => (
            <article className="trace-row" key={`${index}-${ingredient.name}`}>
              <div className="botanical-wrap">
                <strong>{ingredient.name}</strong>
                {ingredient.botanical_name ? (
                  <em className="botanical">{ingredient.botanical_name}</em>
                ) : (
                  <span className="tiny muted">
                    Botanical name not recorded
                  </span>
                )}
              </div>
              <div className="trace-meta">
                <div>
                  <span>Quantity</span>
                  <strong>
                    {quantity(ingredient.qty_value, ingredient.qty_unit)}
                  </strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>
                    {ingredient.source_location || "Not recorded"}
                  </strong>
                </div>
              </div>
              <div className="trace-meta trace-evidence">
                <div>
                  <span>Internal quality score*</span>
                  <strong>
                    {ingredient.quality_score === null
                      ? "Not recorded"
                      : `${ingredient.quality_score} / 100`}
                  </strong>
                </div>
                <div>
                  <span>Lab report</span>
                  {ingredient.lab_report_url ? (
                    <a
                      className="text-btn"
                      href={ingredient.lab_report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF <Icon name="external" />
                    </a>
                  ) : (
                    <strong>Not attached</strong>
                  )}
                </div>
              </div>
              <QualityStatus value={outcome(ingredient.qc_status)} />
            </article>
          ))}
        </div>
        <p className="tiny muted trace-footnote">
          * Strengthiva scores are internal quality indicators, not regulatory
          ratings.
        </p>
      </Section>
      <Section
        title="Published documents"
        copy="Evidence released with this product and batch record."
      >
        <div className="public-docs">
          {data.documents.map((document) => (
            <a
              className="public-doc"
              key={document.id}
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="file" />
              <div>
                <strong>
                  {DOCUMENT_LABELS[document.kind] || document.kind}
                </strong>
                <span>{document.filename}</span>
                <span>
                  View / download PDF <Icon name="external" />
                </span>
              </div>
            </a>
          ))}
        </div>
        {data.documents.length === 0 && (
          <p className="muted">
            No documents have been attached to this record.
          </p>
        )}
      </Section>
      <Section
        title="Manufacturer and certifications"
        copy={data.manufacturer_name || "Manufacturer not recorded"}
      >
        <p className="small muted">
          {data.manufacturer_address || "Address not recorded"}
        </p>
        <div className="certs">
          {data.certifications?.map((mark) => (
            <span className="cert" key={mark}>
              {mark}
            </span>
          ))}
        </div>
        {!data.certifications?.length && (
          <p className="small muted">No certification marks recorded.</p>
        )}
      </Section>
      <footer className="public-footer">
        <strong>{data.manufacturer_name || "Strengthiva"}</strong>
        <br />
        Information shown is a product record, not medical advice. Consult a
        qualified professional for medical decisions.
      </footer>
    </div>
  );
}
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
export function VerificationUnavailable({
  unavailable = false,
}: {
  unavailable?: boolean;
}) {
  return (
    <PublicChrome>
      <div className="state-hero" id="product-record">
        <section className="state-card">
          <span className="state-symbol bad">
            <Icon name={unavailable ? "refresh" : "search"} />
          </span>
          <div className="eyebrow">Product record</div>
          <h1>
            {unavailable
              ? "The record is temporarily unavailable"
              : "We can’t verify this code"}
          </h1>
          <p>
            {unavailable
              ? "We couldn’t reach the record service. Please try scanning the code again in a moment."
              : "The code may be incomplete, damaged, or not associated with a published Strengthiva batch record. Check the code on your packaging and scan it again."}
          </p>
          <p>
            This page cannot determine whether an individual bottle is genuine.
          </p>
          <a className="btn btn-primary" href="/">
            Visit Strengthiva
          </a>
        </section>
      </div>
    </PublicChrome>
  );
}
