"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Venue = { name: string; location: string; neighborhood: string; image: string };
type Claim = { id: string; locationId: string; recipient: string; sender: string; amount: number; message: string; special?: string };

const oauthErrors: Record<string, string> = {
  authorization_cancelled: "Blackbird sign-in was cancelled. Your LunchDrop is still waiting.",
  invalid_oauth_state: "The secure sign-in session expired. Please try connecting again.",
  invalid_claim: "This claim link is invalid or has expired.",
  missing_access_token: "Blackbird did not return a member session.",
  missing_member_id: "Blackbird could not identify this member.",
  rewards_not_configured: "LunchDrop rewards are not configured yet.",
  already_claimed: "This LunchDrop has already been claimed by another member.",
};

function friendlyOAuthError(value: string) {
  if (oauthErrors[value]) return oauthErrors[value];
  if (value.startsWith("token_exchange_")) return "Blackbird sign-in could not be completed. Please try once more.";
  if (value.startsWith("profile_")) return "Your Blackbird profile could not be loaded.";
  if (value.startsWith("reward_")) return "Blackbird connected, but the test FLY delivery could not be completed.";
  return "The Blackbird connection could not be completed.";
}

export function ClaimCard() {
  const params = useSearchParams();
  const token = params.get("t") ?? "";
  const claimed = params.get("claimed") === "1";
  const rewardId = params.get("reward") ?? "";
  const oauthError = params.get("oauth_error") ?? "";
  const [claim, setClaim] = useState<Claim | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <article className={`claim-card ${claimed ? "claimed" : ""}`}>
        {venue.image ? <img className="claim-image" src={venue.image} alt={`${venue.name} restaurant`} /> : null}
        <div className="claim-body">
          <div className="claim-mode"><span>TEST FLY</span><small>Signed claim verified</small></div>
          <span className="eyebrow">A LUNCHDROP FOR {claim.recipient.toUpperCase()}</span>
          <h1>{claimed ? "Lunch claimed!" : `${claim.sender} sent you lunch.`}</h1>
          <blockquote>“{claim.message}”</blockquote>
          <div className="claim-details">
            <div><small>YOUR LUNCHDROP</small><strong>{claim.amount} FLY</strong><span>test gift amount</span></div>
            <div><small>RECOMMENDED PLACE</small><strong>{venue.name}</strong><span>{venue.location} · {venue.neighborhood}</span></div>
          </div>
          {claim.special ? <p className="claim-special"><b>Try this:</b> {claim.special}</p> : null}
          {oauthError ? <div className="claim-warning"><b>Claim not completed</b><span>{friendlyOAuthError(oauthError)}</span></div> : null}
          {claimed ? (
            <div className="claim-success"><span>✓</span><div><b>{claim.amount} test FLY delivered</b><small>Added to your connected Blackbird member wallet · Reward {rewardId.slice(0, 8)}</small></div></div>
          ) : (
            <a className="claim-button" href={`/api/auth/blackbird/start?t=${encodeURIComponent(token)}`}>Connect Blackbird & claim <span>→</span></a>
          )}
          <p className="claim-note">By continuing, you authorize LunchDrop to identify your Blackbird member account and deliver this one-time test FLY reward. The restaurant is a recommendation.</p>
        </div>
      </article>
      <p className="claim-footer">Live restaurant data by Flynet · Secure Blackbird member claim</p>
    </main>
  );
}

