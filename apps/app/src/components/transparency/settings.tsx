"use client";
import { useState } from "react";
import type { CompanySettings } from "@strengthiva/transparency/types";
import { formatDate } from "@strengthiva/transparency/domain";
import {
  Loading,
  Notice,
  PageHead,
  Panel,
  Status,
} from "@strengthiva/transparency/ui";
import { transparencyApi } from "@/lib/transparency-api";
import { useResource } from "./use-resource";
import { Action, ErrorNotice, Modal } from "./controls";
export function SettingsPage() {
  const resource = useResource("company-settings", (signal) =>
    transparencyApi.settings(signal)
  );
  if (resource.loading) return <Loading />;
  if (resource.error || !resource.data)
    return (
      <ErrorNotice
        error={resource.error || new Error("Company settings unavailable.")}
        retry={resource.reload}
      />
    );
  return <SettingsForm initial={resource.data} />;
}
function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [settings, setSettings] = useState(initial);
  const [marks, setMarks] = useState((initial.certifications || []).join("\n"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const update = (key: keyof CompanySettings, value: string) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value || null }));
  };
  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      const { updated_at: _, ...values } = settings;
      void _;
      setSettings(
        await transparencyApi.saveSettings({
          ...values,
          certifications: Array.from(
            new Set(
              marks
                .split("\n")
                .map((mark) => mark.trim())
                .filter(Boolean)
            )
          ),
        })
      );
      setConfirm(false);
      setSaved(true);
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="Workspace configuration"
        title="Company settings"
        copy="These details appear consistently on every published transparency record."
        actions={
          settings.updated_at && (
            <Status tone="good">
              Updated {formatDate(settings.updated_at)}
            </Status>
          )
        }
      />
      {saved && (
        <div role="status">
          <Notice title="Company settings saved" tone="good" />
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setConfirm(true);
        }}
      >
        <div className="split">
          <Panel
            title="Company details"
            copy="Public manufacturer identity and licence information."
          >
            <div className="form-grid">
              {[
                ["manufacturer_name", "Manufacturer name"],
                ["fssai_licence", "FSSAI licence"],
                ["ayush_licence", "AYUSH licence"],
              ].map(([key, label]) => (
                <label className="field" key={key}>
                  <span>{label}</span>
                  <input
                    className="input"
                    value={String(settings[key as keyof CompanySettings] || "")}
                    onChange={(event) =>
                      update(key as keyof CompanySettings, event.target.value)
                    }
                  />
                </label>
              ))}
              <label className="field full-span">
                <span>Registered address</span>
                <textarea
                  className="textarea"
                  value={settings.manufacturer_address || ""}
                  onChange={(event) =>
                    update("manufacturer_address", event.target.value)
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <Action tone="primary" type="submit" disabled={busy}>
                Save company details
              </Action>
            </div>
          </Panel>
          <aside className="section-stack">
            <Panel
              title="Certification marks"
              copy="Only include certifications that the company holds."
            >
              <label className="field">
                <span>Certification labels · one per line</span>
                <textarea
                  className="textarea"
                  value={marks}
                  placeholder="GMP\nISO 22000:2018"
                  onChange={(event) => {
                    setMarks(event.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              <div className="certs section-gap">
                {Array.from(
                  new Set(
                    marks
                      .split("\n")
                      .map((mark) => mark.trim())
                      .filter(Boolean)
                  )
                ).map((mark) => (
                  <span className="cert" key={mark}>
                    {mark}
                  </span>
                ))}
              </div>
            </Panel>
            <Panel title="Customer-page footer">
              <p className="small muted">
                Information shown is a product record, not medical advice.
                Consult a qualified professional for medical decisions.
              </p>
            </Panel>
          </aside>
        </div>
      </form>
      {confirm && (
        <Modal
          title="Update company details on every public record?"
          onClose={() => !busy && setConfirm(false)}
        >
          <p>
            Manufacturer information, licence numbers, and certification labels
            will update across all published product records.
          </p>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setConfirm(false)}>
              Keep editing
            </Action>
            <Action tone="primary" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save public details"}
            </Action>
          </div>
        </Modal>
      )}
    </>
  );
}
