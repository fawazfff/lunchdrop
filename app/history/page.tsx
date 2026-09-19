"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "../components/SiteNav";

type HistoryItem = {
  claimLink: string;
  claimId: string;
  senderKey: string;
  claimCode: string;
  dbBacked: boolean;
  recipient?: string;
  sender?: string;
  amount?: number;
  restaurant?: string;
  createdAt: number;
};

type RemoteStatus = {
  status: "created" | "opened" | "demo_claimed" | "connected_claimed" | "cancelled" | "expired";
  openedAt?: string;
  demoClaimedAt?: string;
  connectedClaimedAt?: string;
  expiresAt?: string;
};

const statusLabel: Record<string, string> = {
  created: "Created",
  opened: "Opened",
  demo_claimed: "Demo claimed",
  connected_claimed: "Blackbird claimed",
  cancelled: "Cancelled",
  expired: "Expired",
};

function validHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<HistoryItem>;
  return Boolean(
    typeof item.claimLink === "string" &&
    typeof item.claimId === "string" &&
    typeof item.senderKey === "string" &&
    typeof item.claimCode === "string" &&
    typeof item.dbBacked === "boolean" &&
    typeof item.createdAt === "number"
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RemoteStatus>>({});
  const [ready, setReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  function saveHistory(next: HistoryItem[]) {
    const safe = next.slice(0, 30);
    setItems(safe);
    window.localStorage.setItem("lunchdrop-history-v1", JSON.stringify(safe));
  }

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("lunchdrop-history-v1") ?? "[]") as HistoryItem[];
      setItems(parsed.filter(validHistoryItem).slice(0, 30));
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready || items.length === 0) return;

    let active = true;
    const refresh = async () => {
      const next: Record<string, RemoteStatus> = {};
      await Promise.all(items.map(async (item) => {
        if (!item.dbBacked || !item.claimCode || !item.senderKey) return;
        try {
          const response = await fetch(`/api/claims/code/${encodeURIComponent(item.claimCode)}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderKey: item.senderKey }),
            cache: "no-store",
          });
          if (!response.ok) return;
          next[item.claimId] = await response.json();
        } catch {
          // Keep history usable even if a status refresh fails.
        }
      }));

      if (active) setStatuses((current) => ({ ...current, ...next }));
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [items, ready]);

  const activeCount = useMemo(
    () => items.filter((item) => !["connected_claimed", "cancelled", "expired"].includes(statuses[item.claimId]?.status ?? "")).length,
    [items, statuses],
  );

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "LunchDrop link copied." }));
  }

  function forget(claimId: string) {
    saveHistory(items.filter((item) => item.claimId !== claimId));
  }

  function exportRecoveryFile() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "LunchDrop",
      warning: "Private sender recovery file. Anyone with this file can view sender-side LunchDrop status.",
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lunchdrop-recovery-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSyncMessage("Recovery file saved. Keep it private.");
    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "Private LunchDrop recovery file saved." }));
  }

  async function importRecoveryFile(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { version?: number; items?: unknown[] };
      if (parsed.version !== 1 || !Array.isArray(parsed.items)) throw new Error("Unsupported recovery file");
      const incoming = parsed.items.filter(validHistoryItem);
      if (incoming.length === 0) throw new Error("No LunchDrops found in this recovery file");

      const merged = [...incoming, ...items]
        .filter((item, index, all) => all.findIndex((candidate) => candidate.claimId === item.claimId) === index)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 30);

      saveHistory(merged);
      setSyncMessage(`Recovered ${incoming.length} LunchDrop${incoming.length === 1 ? "" : "s"} on this device.`);
      window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "LunchDrop history recovered on this device." }));
    } catch {
      setSyncMessage("That file is not a valid LunchDrop recovery file.");
      window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "Could not import that recovery file." }));
    }
  }

  return (
    <main className="info-page history-page">
      <SiteNav current="history" />

      <section className="info-hero shell">
        <span className="eyebrow">MY LUNCHDROPS</span>
        <h1>Keep an eye on the lunches you sent.</h1>
        <p>
          This browser remembers the LunchDrops you sent. No account is required, and you can move this history to another device with a private recovery file.
        </p>
        <div className="history-summary">
          <span><b>{items.length}</b> saved here</span>
          <span><b>{activeCount}</b> still active</span>
          <a className="primary-button" href="/send">Send another <span>→</span></a>
        </div>
      </section>

      <section className="info-content shell">
        <section className="history-sync-card">
          <div>
            <span className="eyebrow">MOVE TO ANOTHER DEVICE</span>
            <h2>Move your LunchDrops to another device.</h2>
            <p>
              Export saves the private recovery information for your LunchDrops. Import that file on another browser to restore your list and live status. Keep the file private.
            </p>
          </div>
          <div className="history-sync-actions">
            <button className="secondary-action" type="button" onClick={exportRecoveryFile} disabled={items.length === 0}>Export recovery file</button>
            <label className="secondary-action history-import-label">
              Import recovery file
              <input type="file" accept="application/json,.json" onChange={(event) => void importRecoveryFile(event.target.files?.[0])} />
            </label>
          </div>
          {syncMessage ? <p className="history-sync-message" aria-live="polite">{syncMessage}</p> : null}
        </section>

        {!ready ? <div className="status-loading">Loading your LunchDrops…</div> : null}

        {ready && items.length === 0 ? (
          <div className="history-empty">
            <span className="eyebrow">NOTHING HERE YET</span>
            <h2>Your first LunchDrop will appear here.</h2>
            <p>Create one, then this browser will remember the sender-side status controls for you.</p>
            <a className="primary-button" href="/send">Create a LunchDrop <span>→</span></a>
          </div>
        ) : null}

        <div className="history-grid">
          {items.map((item) => {
            const remote = statuses[item.claimId];
            const state = remote?.status ?? "created";
            const terminal = ["connected_claimed", "cancelled", "expired"].includes(state);
            return (
              <article className="history-card" key={item.claimId}>
                <div className="history-card-top">
                  <span className={`history-status ${state}`}><i />{statusLabel[state] ?? state}</span>
                  <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                </div>
                <h2>{item.recipient ? `Lunch for ${item.recipient}` : "LunchDrop"}</h2>
                <p>{item.restaurant || "Blackbird restaurant recommendation"}</p>
                <div className="history-meta">
                  <span><small>AMOUNT</small><b>{item.amount ? `${item.amount} FLY` : "FLY gift"}</b></span>
                  <span><small>CODE</small><b>{item.claimCode || "Legacy"}</b></span>
                </div>
                <div className="history-card-actions">
                  {!terminal ? <a className="secondary-action" href={item.claimLink} target="_blank" rel="noreferrer">Open gift</a> : null}
                  <button className="secondary-action" type="button" onClick={() => void copy(item.claimLink)}>Copy link</button>
                  <button className="history-forget" type="button" onClick={() => forget(item.claimId)}>Forget</button>
                </div>
              </article>
            );
          })}
        </div>

        {items.length > 0 ? (
          <div className="truth-card">
            <b>Your status stays live</b>
            <p>
              The gift status updates from the server. This browser keeps the private recovery information needed to see those updates. Exporting a recovery file lets you carry that access to another device without creating an account.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
