"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon, Loading, Notice } from "@strengthiva/transparency/ui";
import { downloadBlob, transparencyApi } from "@/lib/transparency-api";
import { Action, ErrorNotice, Modal } from "./controls";
export function QrImage({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<Error>();
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    transparencyApi
      .qr(id)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((error) => {
        if (active) setError(error);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  if (error) return <ErrorNotice error={error} />;
  return url ? (
    <Image
      unoptimized
      className="qr-image"
      src={url}
      width={200}
      height={200}
      alt={`QR code for ${name}`}
    />
  ) : (
    <Loading label="Generating QR code" />
  );
}
export function QrDownload({ id, name }: { id: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  return (
    <>
      <Action
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(undefined);
          try {
            downloadBlob(
              await transparencyApi.qr(id),
              `${name.replace(/[^a-z0-9-]/gi, "-")}-qr.png`
            );
          } catch (error) {
            setError(error as Error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Icon name="download" />
        {busy ? "Preparing…" : "Download QR"}
      </Action>
      {error && <ErrorNotice error={error} />}
    </>
  );
}
export function QrSheet({
  products,
  batchNumber,
  onClose,
}: {
  products: { id: string; product_name: string; status: string }[];
  batchNumber: string;
  onClose: () => void;
}) {
  return (
    <Modal title={`${batchNumber} · QR print sheet`} onClose={onClose}>
      <div className="no-print">
        <Notice title="Check each record before printing" tone="info">
          Draft codes will not resolve publicly until the product record is
          published. Use your browser’s print dialog to print or save this sheet
          as a PDF.
        </Notice>
      </div>
      <div className="qr-sheet">
        {products.map((product) => (
          <div className="qr-label" key={product.id}>
            <QrImage id={product.id} name={product.product_name} />
            <strong>{product.product_name}</strong>
            <span>
              {batchNumber} · {product.status}
            </span>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <Action onClick={onClose}>Close</Action>
        <Action tone="primary" onClick={() => window.print()}>
          <Icon name="printer" />
          Print / save PDF
        </Action>
      </div>
    </Modal>
  );
}
