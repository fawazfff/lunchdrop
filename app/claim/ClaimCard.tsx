"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Venue = { name: string; location: string; neighborhood: string; image: string };
type Claim = { id: string; locationId: string; recipient: string; sender: string; amount: number; message: string; special?: string };

export function ClaimCard() {
  const token = useSearchParams().get("t") ?? "";
  const [claim, setClaim] = useState<Claim | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewed, setPreviewed] = useState(false);

  useEffect(() => {
    if (!token) { setError("This claim link is missing its secure token."); setLoading(false); return; }
    let active = true;
    async function loadClaim() {
      try {
        const verified = await fetch(`/api/claims/verify?token=${encodeURIComponent(token)}`);
        const result = await verified.json();
        if (!verified.ok) throw new Error(result.error ?? "This claim link is invalid");
        if (!active) return;
        setClaim(result.claim);
        const location = await fetch(`/api/locations/${encodeURIComponent(result.claim.locationId)}`);
        const locationResult = await location.json();
        if (!location.ok) throw new Error("The Flynet location is unavailable");
        if (active) setVenue(locationResult.location);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to open this LunchDrop");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadClaim();
    return () => { active = false; };
  }, [token]);

  if (loading) return <main className="claim-page"><div className="claim-status"><span className="eyebrow">VERIFYING SECURE LINK</span><h1>Opening your LunchDrop…</h1></div></main>;
  if (error || !claim || !venue) return <main className="claim-page"><div className="claim-status error-card"><b>We could not open this gift.</b><span>{error}</span><a href="/">Return home</a></div></main>;

  return (
    <main className="claim-page">
      <a className="brand claim-brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <div className="claim-glow" />
      <article className={`claim-card ${previewed ? "claimed" : ""}`}>
        {venue.image ? <img className="claim-image" src={venue.image} alt={`${venue.name} restaurant`} /> : null}
        <div className="claim-body">
          <div className="claim-mode"><span>TEST MODE</span><small>Signed claim verified</small></div>
          <span className="eyebrow">A LUNCHDROP FOR {claim.recipient.toUpperCase()}</span>
          <h1>{claim.sender} sent you lunch.</h1>
          <blockquote>“{claim.message}”</blockquote>
          <div className="claim-details">
            <div><small>YOUR LUNCHDROP</small><strong>{claim.amount} FLY</strong><span>test gift amount</span></div>
            <div><small>RECOMMENDED PLACE</small><strong>{venue.name}</strong><span>{venue.location} · {venue.neighborhood}</span></div>
          </div>
          {claim.special ? <p className="claim-special"><b>Try this:</b> {claim.special}</p> : null}
          {!previewed ? <button className="claim-button" type="button" onClick={() => setPreviewed(true)}>Preview claim confirmation <span>→</span></button> :
            <div className="claim-success"><span>✓</span><div><b>Secure claim flow verified</b><small>No FLY moved. Blackbird wallet delivery activates after Flynet approval.</small></div></div>}
          <p className="claim-note">The restaurant is a recommendation. Delivered FLY can be used at participating Blackbird locations.</p>
        </div>
      </article>
      <p className="claim-footer">Live restaurant data by Flynet · Secure claim token verified server-side</p>
    </main>
  );
}

