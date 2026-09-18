"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ClaimCard() {
  const params = useSearchParams();
  const [claimed, setClaimed] = useState(false);
  const recipient = params.get("to") || "Friend";
  const amount = Number(params.get("amount") || 15);
  const restaurant = params.get("restaurant") || "a Blackbird restaurant";
  const location = params.get("location") || "Nearby";
  const neighborhood = params.get("neighborhood") || "Your neighborhood";
  const message = params.get("message") || "Lunch is on me today 💛";
  const image = params.get("image") || "";

  return (
    <main className="claim-page">
      <a className="brand claim-brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <div className="claim-glow" />
      <article className={`claim-card ${claimed ? "claimed" : ""}`}>
        {image && <img className="claim-image" src={image} alt="" />}
        <div className="claim-body">
          <span className="eyebrow">A LUNCHDROP FOR {recipient.toUpperCase()}</span>
          <h1>{claimed ? "Lunch claimed!" : "Someone sent you lunch."}</h1>
          <blockquote>“{message}”</blockquote>
          <div className="claim-details">
            <div><small>YOUR LUNCHDROP</small><strong>${amount}</strong><span>in FLY</span></div>
            <div><small>TRY IT AT</small><strong>{restaurant}</strong><span>{location} · {neighborhood}</span></div>
          </div>
          {!claimed ? (
            <button className="claim-button" type="button" onClick={() => setClaimed(true)}>Connect Blackbird to claim <span>→</span></button>
          ) : (
            <div className="claim-success"><span>✓</span><div><b>Added to your Blackbird wallet</b><small>Demo claim · live wallet transfer connects next</small></div></div>
          )}
          <p className="claim-note">Powered by Blackbird’s Flynet · Restaurant data is live</p>
        </div>
      </article>
      <p className="claim-footer">Good food tastes better when someone thought of you.</p>
    </main>
  );
}
