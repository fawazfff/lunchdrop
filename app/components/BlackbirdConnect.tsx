"use client";

import { useEffect, useState } from "react";

export function BlackbirdConnect({ compact = false }: { compact?: boolean }) {
  const [connected, setConnected] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [returnPath, setReturnPath] = useState("/");

  useEffect(() => {
    let active = true;
    setReturnPath(`${window.location.pathname}${window.location.search}`);
    fetch("/api/auth/blackbird/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setConnected(Boolean(payload.connected));
        setMemberId(String(payload.memberId ?? ""));
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function disconnect() {
    await fetch("/api/auth/blackbird/session", { method: "POST" });
    setConnected(false);
    setMemberId("");
  }

  if (loading) {
    return (
      <span className={`blackbird-connect-control ${compact ? "compact" : ""} loading`}>
        <span className="blackbird-mini-mark">B</span>
        <span><b>Connect Blackbird</b><small>Checking status…</small></span>
      </span>
    );
  }

  if (connected) {
    return (
      <span className={`blackbird-connect-control connected ${compact ? "compact" : ""}`}>
        <span className="blackbird-mini-mark">B</span>
        <span><b>Blackbird connected</b>{memberId ? <small>Member …{memberId.slice(-6)}</small> : null}</span>
        <button type="button" onClick={disconnect}>Disconnect</button>
      </span>
    );
  }

  return (
    <a className={`blackbird-connect-control ${compact ? "compact" : ""}`} href={`/api/auth/blackbird/start?return=${encodeURIComponent(returnPath)}`}>
      <span className="blackbird-mini-mark">B</span>
      <span><b>Connect Blackbird</b><small>Optional member sign-in</small></span>
      <strong>→</strong>
    </a>
  );
}
