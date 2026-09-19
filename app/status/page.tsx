"use client";

import { useEffect, useState } from "react";
import { LunchBuddy } from "../components/LunchBuddy";
import { SiteNav } from "../components/SiteNav";

type Check = {
  id: string;
  label: string;
  state: "connected" | "configured" | "not_verified" | "unavailable";
  message: string;
};

type StatusPayload = {
  environment: string;
  checkedAt: string;
  checks: Check[];
};

const labels = {
  connected: "Connected",
  configured: "Ready",
  not_verified: "Needs final test",
  unavailable: "Unavailable",
} as const;

export default function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(true);

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to check integrations");
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to check integrations");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <main className="info-page status-page">
      <SiteNav current="status" />

      <section className="info-hero shell">
        <span className="eyebrow">WHAT’S WORKING</span>
        <h1>What works right now, and what still needs one final test.</h1>
        <p>Green means it is working live. Amber means it is ready in the app but still needs the final Blackbird member test.</p>
      </section>

      <section className="info-content shell">
        <div className="status-toolbar"><span>Live checks from LunchDrop</span><button className="ghost-button" type="button" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Checking…" : "Check again"}</button></div>
        {refreshing && !data ? <div className="status-loading"><LunchBuddy message="Checking Flynet and Blackbird…" /><div className="loading-progress"><span /></div></div> : null}
        {error ? <div className="error-card"><b>Status check failed.</b><span>{error}</span></div> : null}
        {data ? (
          <>
            <div className="status-meta"><span><b>Mode</b>{data.environment}</span><span><b>Last checked</b>{new Date(data.checkedAt).toLocaleString()}</span></div>
            <div className="status-grid">
              {data.checks.map((check) => (
                <article className={`integration-check ${check.state}`} key={check.id}>
                  <div className="integration-check-top"><span className="status-dot" /><strong>{labels[check.state]}</strong></div>
                  <h2>{check.label}</h2>
                  <p>{check.message}</p>
                </article>
              ))}
            </div>
            <div className="truth-card">
              <b>Why one item still says “Needs final test”</b>
              <p>The Blackbird reward path is built, but we will not call it fully verified until it is tested with an eligible Blackbird member account.</p>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
