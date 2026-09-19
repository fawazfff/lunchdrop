"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LunchBuddy } from "../components/LunchBuddy";

type Venue = {
  name: string;
  location: string;
  neighborhood: string;
  region: string;
  image: string;
};

type Restaurant = {
  id: string;
  locationId: string;
  name: string;
  location: string;
  neighborhood: string;
  region: string;
  cuisine: string[];
  image: string;
  paymentsEnabled: boolean;
};

type Claim = {
  id: string;
  locationId: string;
  recipient: string;
  sender: string;
  amount: number;
  message: string;
  special?: string;
  expiresAt: number;
  status?: string;
  chosenLocationId?: string;
  demoClaimedAt?: string;
  connectedClaimedAt?: string;
  rewardId?: string;
};

const oauthErrors: Record<string, string> = {
  authorization_cancelled: "Blackbird sign-in was cancelled. Your LunchDrop is still waiting.",
  invalid_oauth_state: "The Blackbird sign-in timed out. Please try again.",
  invalid_claim: "This claim link is invalid or has expired.",
  missing_access_token: "Blackbird did not return a member session.",
  missing_member_id: "Blackbird could not identify this member.",
  rewards_not_configured: "The FLY reward is not ready right now.",
  already_claimed: "This LunchDrop has already been claimed by another member.",
};

function friendlyOAuthError(value: string) {
  if (oauthErrors[value]) return oauthErrors[value];
  if (value.startsWith("token_exchange_")) return "Blackbird sign-in could not be completed. Please try once more.";
  if (value.startsWith("profile_")) return "Your Blackbird profile could not be loaded.";
  if (value.startsWith("reward_")) return "Blackbird connected, but the FLY reward could not be completed.";
  return "The Blackbird connection could not be completed.";
}

export function ClaimCard({ tokenOverride }: { tokenOverride?: string }) {
  const params = useSearchParams();
  const token = tokenOverride ?? params.get("t") ?? "";
  const isDbClaim = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/.test(token.toUpperCase());
  const claimedParam = params.get("claimed") === "1";
  const rewardId = params.get("reward") ?? "";
  const oauthError = params.get("oauth_error") ?? "";

  const [claim, setClaim] = useState<Claim | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [chosenVenue, setChosenVenue] = useState<Venue | null>(null);
  const [alternatives, setAlternatives] = useState<Restaurant[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(claimedParam || Boolean(oauthError));
  const [demoComplete, setDemoComplete] = useState(false);
  const [connectedComplete, setConnectedComplete] = useState(claimedParam);
  const [receiptTime, setReceiptTime] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This LunchDrop link is incomplete.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadClaim() {
      try {
        const verified = await fetch(
          isDbClaim
            ? `/api/claims/code/${encodeURIComponent(token.toUpperCase())}`
            : `/api/claims/verify?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const result = await verified.json();
        if (!verified.ok) throw new Error(result.error ?? "This claim link is invalid");
        if (!active) return;

        const loadedClaim = result.claim as Claim & {
          chosenLocationId?: string;
          status?: string;
          demoClaimedAt?: string;
          connectedClaimedAt?: string;
          rewardId?: string;
        };
        setClaim(loadedClaim);
        if (loadedClaim.status === "demo_claimed") {
          setDemoComplete(true);
          setReceiptTime(loadedClaim.demoClaimedAt ? new Date(loadedClaim.demoClaimedAt).toLocaleString() : new Date().toLocaleString());
          setRevealed(true);
        }
        if (loadedClaim.status === "connected_claimed") {
          setConnectedComplete(true);
          setReceiptTime(loadedClaim.connectedClaimedAt ? new Date(loadedClaim.connectedClaimedAt).toLocaleString() : new Date().toLocaleString());
          setRevealed(true);
        }
        window.localStorage.setItem(
          `lunchdrop-status-${loadedClaim.id}`,
          loadedClaim.status === "connected_claimed"
            ? "connected_claimed"
            : loadedClaim.status === "demo_claimed"
              ? "demo_claimed"
              : "opened",
        );

        const location = await fetch(`/api/locations/${encodeURIComponent(loadedClaim.locationId)}`);
        const locationResult = await location.json();
        if (!location.ok) throw new Error("This restaurant is unavailable right now");
        if (!active) return;

        const recommended = locationResult.location as Venue;
        setVenue(recommended);

        if (isDbClaim && loadedClaim.chosenLocationId && loadedClaim.chosenLocationId !== loadedClaim.locationId) {
          try {
            const chosenResponse = await fetch(`/api/locations/${encodeURIComponent(loadedClaim.chosenLocationId)}`);
            const chosenPayload = await chosenResponse.json();
            if (active && chosenResponse.ok) setChosenVenue(chosenPayload.location as Venue);
            else if (active) setChosenVenue(recommended);
          } catch {
            if (active) setChosenVenue(recommended);
          }
        } else {
          const stored = window.localStorage.getItem(`lunchdrop-venue-${loadedClaim.id}`);
          if (stored) {
            try {
              setChosenVenue(JSON.parse(stored) as Venue);
            } catch {
              setChosenVenue(recommended);
            }
          } else {
            setChosenVenue(recommended);
          }
        }

        if (recommended.region) {
          const listResponse = await fetch(`/api/restaurants?city=${encodeURIComponent(recommended.region)}`);
          const listPayload = await listResponse.json();
          if (active && listResponse.ok) {
            setAlternatives(
              (listPayload.restaurants ?? [])
                .filter((restaurant: Restaurant) => restaurant.paymentsEnabled && restaurant.locationId !== loadedClaim.locationId)
                .slice(0, 4),
            );
          }
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to open this LunchDrop");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadClaim();
    return () => { active = false; };
  }, [token, claimedParam, isDbClaim]);

  useEffect(() => {
    if (claimedParam) {
      setConnectedComplete(true);
      setReceiptTime(new Date().toLocaleString());
      window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "Blackbird reward confirmed." }));
    }
  }, [claimedParam]);

  const claimed = claimedParam || connectedComplete;
  const blackbirdHref = isDbClaim
    ? `/api/auth/blackbird/start?c=${encodeURIComponent(token.toUpperCase())}`
    : `/api/auth/blackbird/start?t=${encodeURIComponent(token)}`;

  const receiptStatus = claimed
    ? "FLY reward confirmed by Blackbird"
    : demoComplete
      ? "Demo claim completed"
      : "";

  const receiptReward = claimed
    ? (rewardId || claim?.rewardId || "Confirmed by Blackbird")
    : "Demo completed without moving FLY";

  const selectedPlace = chosenVenue ?? venue;
  const expiryLabel = claim?.expiresAt
    ? new Date(claim.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "";

  const alternativeVenues = useMemo(
    () => alternatives.map((restaurant) => ({
      name: restaurant.name,
      location: restaurant.location,
      neighborhood: restaurant.neighborhood,
      region: restaurant.region,
      image: restaurant.image,
    })),
    [alternatives],
  );

  async function chooseVenue(nextVenue: Venue, locationId?: string) {
    setChosenVenue(nextVenue);
    setShowAlternatives(false);
    if (claim) window.localStorage.setItem(`lunchdrop-venue-${claim.id}`, JSON.stringify(nextVenue));

    if (isDbClaim && locationId) {
      try {
        await fetch(`/api/claims/code/${encodeURIComponent(token.toUpperCase())}/choice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId }),
        });
      } catch {
        // Local selection still works if persistence is temporarily unavailable.
      }
    }

    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: `${nextVenue.name} selected.` }));
  }

  async function finishDemo() {
    if (!claim) return;

    if (isDbClaim) {
      const response = await fetch(`/api/claims/code/${encodeURIComponent(token.toUpperCase())}/demo`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: payload.error ?? "Could not complete demo claim." }));
        return;
      }
    }

    setDemoComplete(true);
    setReceiptTime(new Date().toLocaleString());
    window.localStorage.setItem(`lunchdrop-status-${claim.id}`, "demo_claimed");
    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "Demo claim complete. No FLY moved." }));
  }

  if (loading) {
    return <main className="claim-page"><div className="claim-status claim-loading"><span className="eyebrow">OPENING YOUR LUNCHDROP</span><LunchBuddy message="Opening your LunchDrop safely…" /><div className="loading-progress"><span /></div></div></main>;
  }

  if (error || !claim || !venue || !selectedPlace) {
    return <main className="claim-page"><div className="claim-status error-card"><b>We could not open this gift.</b><span>{error}</span><a href="/">Return home</a></div></main>;
  }

  if (!revealed) {
    return (
      <main className="claim-page">
        <a className="brand claim-brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
        <div className="claim-glow" />
        <article className="claim-reveal-card">
          {venue.image ? <img src={venue.image} alt="" /> : null}
          <div className="claim-reveal-copy">
            <span className="eyebrow">A LUNCHDROP FOR {claim.recipient.toUpperCase()}</span>
            <h1>{claim.sender} sent you lunch.</h1>
            <p>There’s a note, a restaurant recommendation, and a {claim.amount} FLY gift inside.</p>
            <button className="claim-button" type="button" onClick={() => setRevealed(true)}>Open your LunchDrop <span>→</span></button>
          </div>
        </article>
        <p className="claim-footer">Real restaurant choices from Flynet · Blackbird is optional</p>
      </main>
    );
  }

  return (
    <main className="claim-page claim-page-open">
      <a className="brand claim-brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <div className="claim-glow" />

      <article className={`claim-card ${claimed || demoComplete ? "claimed" : ""}`}>
        {selectedPlace.image ? <img className="claim-image" src={selectedPlace.image} alt={`${selectedPlace.name} restaurant`} /> : null}
        <div className="claim-body">
          <div className="claim-mode"><span>DEMO</span><small>Private gift link checked</small></div>
          <span className="eyebrow">A LUNCHDROP FOR {claim.recipient.toUpperCase()}</span>
          <h1>{claimed || demoComplete ? "Lunch claimed!" : `${claim.sender} sent you lunch.`}</h1>
          <blockquote>“{claim.message}”</blockquote>

          <div className="claim-details">
            <div><small>YOUR LUNCHDROP</small><strong>{claim.amount} FLY</strong><span>gift amount</span></div>
            <div><small>{selectedPlace.name === venue.name ? "RECOMMENDED PLACE" : "YOUR PICK"}</small><strong>{selectedPlace.name}</strong><span>{selectedPlace.location} · {selectedPlace.neighborhood}</span></div>
          </div>

          {claim.special && selectedPlace.name === venue.name ? <p className="claim-special"><b>Sender’s menu highlight:</b> {claim.special}</p> : null}
          {expiryLabel ? <p className="claim-expiry"><span>⌛</span> This secure LunchDrop link expires {expiryLabel}.</p> : null}

          {!claimed && !demoComplete ? (
            <section className="recipient-choice">
              <div>
                <span className="eyebrow">YOUR CHOICE</span>
                <h3>Keep the recommendation or pick another spot.</h3>
                <p>FLY is not locked to one restaurant. Your sender simply gave you a place to start.</p>
              </div>
              {alternatives.length > 0 ? (
                <>
                  <button className="secondary-action" type="button" onClick={() => setShowAlternatives((value) => !value)}>
                    {showAlternatives ? "Hide other spots" : "Browse other Blackbird spots"}
                  </button>
                  {showAlternatives ? (
                    <div className="alternative-grid">
                      <button className={`alternative-card ${selectedPlace.name === venue.name ? "selected" : ""}`} type="button" onClick={() => void chooseVenue(venue, claim.locationId)}>
                        {venue.image ? <img src={venue.image} alt="" /> : null}
                        <span><b>{venue.name}</b><small>{venue.neighborhood}</small><em>Sender’s pick</em></span>
                      </button>
                      {alternativeVenues.map((restaurant) => (
                        <button className={`alternative-card ${selectedPlace.name === restaurant.name && selectedPlace.location === restaurant.location ? "selected" : ""}`} type="button" key={`${restaurant.name}-${restaurant.location}`} onClick={() => void chooseVenue(restaurant, alternatives.find((item) => item.name === restaurant.name && item.location === restaurant.location)?.locationId)}>
                          {restaurant.image ? <img src={restaurant.image} alt="" /> : null}
                          <span><b>{restaurant.name}</b><small>{restaurant.neighborhood}</small><em>FLY-ready</em></span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : null}

          {oauthError ? <div className="claim-warning"><b>Blackbird reward not completed</b><span>{friendlyOAuthError(oauthError)}</span></div> : null}

          {claimed || demoComplete ? (
            <>
              <div className="claim-success"><span>✓</span><div><b>{claimed ? `${claim.amount} FLY reward confirmed` : "Demo claim complete"}</b><small>{claimed ? "Added to your connected Blackbird member account." : "No sign-in needed and no FLY moved."}</small></div></div>
              <section className="claim-receipt">
                <div className="receipt-heading"><span className="eyebrow">LUNCHDROP RECEIPT</span><b>Claim confirmed</b></div>
                <div className="receipt-grid">
                  <div><small>RECIPIENT</small><strong>{claim.recipient}</strong></div>
                  <div><small>AMOUNT</small><strong>{claim.amount} FLY</strong></div>
                  <div><small>PLACE</small><strong>{selectedPlace.name}</strong></div>
                  <div><small>STATUS</small><strong>{receiptStatus}</strong></div>
                  <div><small>{claimed ? "BLACKBIRD REWARD" : "MODE"}</small><strong>{receiptReward}</strong></div>
                  <div><small>TIME</small><strong>{receiptTime || "Just now"}</strong></div>
                </div>
              </section>
              {!claimed ? (
                <div className="reward-upgrade">
                  <div>
                    <span className="eyebrow">OPTIONAL REWARD</span>
                    <h3>Want to try the {claim.amount} FLY reward?</h3>
                    <p>Your LunchDrop demo is already complete. Connect Blackbird only if you want to try the optional FLY reward.</p>
                  </div>
                  <a className="blackbird-reward-button" href={blackbirdHref}><span className="blackbird-mini-mark">B</span> Connect Blackbird to try the FLY reward <span>→</span></a>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <button className="claim-button" type="button" onClick={() => void finishDemo()}>Open gift without Blackbird <span>→</span></button>
              <div className="optional-blackbird">
                <span>OPTIONAL</span>
                <a className="blackbird-connect-link" href={blackbirdHref}><span className="blackbird-mini-mark">B</span> Connect Blackbird to try the {claim.amount} FLY reward →</a>
                <small>You do not need Blackbird to open the gift. Connect only if you want to try the FLY reward.</small>
              </div>
            </>
          )}

          <p className="claim-note">{claimed ? "Your Blackbird FLY reward is confirmed." : demoComplete ? "Your gift is open. Blackbird is still optional if you want to try the FLY reward." : "Blackbird is optional. Open the gift without an account, or connect to try the FLY reward."}</p>
        </div>
      </article>

      <p className="claim-footer">Real restaurant choices from Flynet · Private gift link · Blackbird optional</p>
    </main>
  );
}
