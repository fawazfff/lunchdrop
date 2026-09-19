"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Venue = { name: string; location: string; neighborhood: string; image: string };

export function ClaimCard() {
  const params = useSearchParams();
  const [claimed, setClaimed] = useState(false);
  const locationId = params.get("l") || params.get("locationId") || "";
  const recipient = params.get("t") || params.get("to") || "Friend";
  const sender = params.get("f") || params.get("from") || "A friend";
  const amount = Number(params.get("a") || params.get("amount") || 15);
  const message = params.get("m") || params.get("message") || "Lunch is on me today 💛";
  const special = params.get("s");
  const [venue, setVenue] = useState<Venue>({
    name: params.get("restaurant") || "a Blackbird restaurant",
    location: params.get("location") || "Nearby",
    neighborhood: params.get("neighborhood") || "Your neighborhood",
    image: params.get("image") || "",
  });

  useEffect(() => {
    if (!locationId) return;
    fetch(`/api/locations/${encodeURIComponent(locationId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => setVenue(payload.location))
      .catch(() => undefined);
  }, [locationId]);

  return (
    <main className="claim-page">
      <a className="brand claim-brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <div className="claim-glow" />
      <article className={`claim-card ${claimed ? "claimed" : ""}`}>
        {venue.image && <img className="claim-image" src={venue.image} alt="" />}
        <div className="claim-body">
          <span className="eyebrow">A LUNCHDROP FOR {recipient.toUpperCase()}</span>
          <h1>{claimed ? "Lunch claimed!" : `${sender} sent you lunch.`}</h1>
          <blockquote>“{message}”</blockquote>
          <div className="claim-details">
            <div><small>YOUR LUNCHDROP</small><strong>{amount} FLY</strong><span>gift budget</span></div>
            <div><small>TRY IT AT</small><strong>{venue.name}</strong><span>{venue.location} · {venue.neighborhood}</span></div>
          </div>
          {special ? <p className="claim-special"><b>Picked for you:</b> {special}</p> : null}
          {!claimed ? (
            <button className="claim-button" type="button" onClick={() => setClaimed(true)}>Preview demo claim <span>→</span></button>
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
