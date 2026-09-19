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

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RemoteStatus>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("lunchdrop-history-v1") ?? "[]") as HistoryItem[];
      setItems(parsed.filter((item) => item?.claimId && item?.claimLink).slice(0, 30));
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
    const next = items.filter((item) => item.claimId !== claimId);
    setItems(next);
    window.localStorage.setItem("lunchdrop-history-v1", JSON.stringify(next));
  }

  return (
    <main className="info-page history-page">
      <SiteNav current="history" />

      <section className="info-hero shell">
        <span className="eyebrow">MY LUNCHDROPS</span>
        <h1>Keep an eye on the lunches you sent.</h1>
        <p>
          This browser keeps the sender keys needed to read each LunchDrop’s private cross-device status.
          No account is required.
        </p>
        <div className="history-summary">
          <span><b>{items.length}</b> saved here</span>
          <span><b>{activeCount}</b> still active</span>
          <a className="primary-button" href="/send">Send another <span>→</span></a>
        </div>
      </section>

      <section className="info-content shell">
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
            <b>Browser history, server status</b>
            <p>
              The gift itself and its Created → Opened → Claimed state live in Supabase. This page stores only the sender-side access keys in this browser, so clearing browser storage removes this local history.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
