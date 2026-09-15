"use client";

import { useEffect, useState } from "react";

const FUNCTION_URL = "https://ifqrvugxfmeclaqadqbd.supabase.co/functions/v1/admin-birding-import";
const EBIRD_FUNCTION_URL = "https://ifqrvugxfmeclaqadqbd.supabase.co/functions/v1/admin-ebird-import";
const OBSERVATIONS_FUNCTION_URL = "https://ifqrvugxfmeclaqadqbd.supabase.co/functions/v1/admin-ebird-observations";

type UploadKind = "ml_photo" | "ml_video" | "ml_audio" | "ebird";
type UploadState = { last_success_at: string | null; metadata?: Record<string, unknown> } | null;
type Uploads = Record<string, UploadState>;

const rows: { kind: UploadKind; label: string; note: string }[] = [
  { kind: "ml_photo", label: "Macaulay — Photo", note: "Photo CSV export" },
  { kind: "ml_video", label: "Macaulay — Video", note: "Video CSV export" },
  { kind: "ml_audio", label: "Macaulay — Audio", note: "Audio CSV export" },
  { kind: "ebird", label: "eBird — Checklists", note: "My eBird Data CSV" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminBirdingUploader() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [uploads, setUploads] = useState<Uploads>({});
  const [busy, setBusy] = useState<UploadKind | "unlock" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("birding-admin-key");
    if (saved) {
      setAdminKey(saved);
      void unlock(saved, false);
    }
  }, []);

  async function request(key: string, init?: RequestInit) {
    return fetch(FUNCTION_URL, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        "x-admin-key": key,
      },
    });
  }

  async function requestEbird(key: string, form: FormData) {
    return fetch(EBIRD_FUNCTION_URL, {
      method: "POST",
      headers: { "x-admin-key": key },
      body: form,
    });
  }

  async function requestObservations(key: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return fetch(OBSERVATIONS_FUNCTION_URL, {
      method: "POST",
      headers: { "x-admin-key": key },
      body: form,
    });
  }

  async function unlock(key = adminKey, showError = true) {
    if (!key) return;
    setBusy("unlock");
    setMessage("");
    try {
      const response = await request(key);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not unlock admin page");
      setUploads(body.uploads || {});
      setUnlocked(true);
      window.sessionStorage.setItem("birding-admin-key", key);
    } catch (error) {
      setUnlocked(false);
      window.sessionStorage.removeItem("birding-admin-key");
      if (showError) setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  async function upload(kind: UploadKind, file: File) {
    setBusy(kind);
    setMessage("");
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const response = kind === "ebird"
        ? await requestEbird(adminKey, form)
        : await request(adminKey, { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Upload failed");

      let observationCount: number | undefined;
      if (kind === "ebird") {
        const observationResponse = await requestObservations(adminKey, file);
        const observationBody = await observationResponse.json();
        if (!observationResponse.ok) {
          throw new Error(`eBird data uploaded, but observation locations failed: ${observationBody.error || "Unknown error"}`);
        }
        if (typeof observationBody.observations === "number") observationCount = observationBody.observations;
      }

      setUploads(body.uploads || {});
      const count = body.result?.rows;
      const observations = typeof observationCount === "number" ? ` · ${observationCount} observations` : "";
      setMessage(`${file.name} uploaded${typeof count === "number" ? ` · ${count} rows` : ""}${observations}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  if (!unlocked) {
    return (
      <div className="admin-lock">
        <form onSubmit={(event) => { event.preventDefault(); void unlock(); }}>
          <label htmlFor="admin-key">Admin key <span style={{ color: "var(--muted)", fontWeight: 400 }}>· Hint: Murodo</span></label>
          <div>
            <input id="admin-key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} autoComplete="current-password" />
            <button type="submit" disabled={busy === "unlock"}>{busy === "unlock" ? "Checking…" : "Enter"}</button>
          </div>
        </form>
        {message && <p className="admin-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="admin-uploader">
      <div className="admin-upload-list">
        {rows.map((row) => {
          const state = uploads[`admin_${row.kind}`];
          const isBusy = busy === row.kind;
          return (
            <div className="admin-upload-row" key={row.kind}>
              <div className="admin-upload-copy">
                <strong>{row.label}</strong>
                <span>{row.note}</span>
              </div>
              <time>{formatDate(state?.last_success_at)}</time>
              <label className={isBusy ? "upload-button disabled" : "upload-button"}>
                {isBusy ? "Uploading…" : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isBusy || busy !== null}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void upload(row.kind, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
      {message && <p className="admin-message">{message}</p>}
      <button
        className="admin-lock-button"
        type="button"
        onClick={() => {
          window.sessionStorage.removeItem("birding-admin-key");
          setUnlocked(false);
          setAdminKey("");
          setMessage("");
        }}
      >
        Lock
      </button>
    </div>
  );
}
