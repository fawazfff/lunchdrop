"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
};

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
  const [chosenVenue, setChosenVenue] = useState<Venue | null>(null);
  const [alternatives, setAlternatives] = useState<Restaurant[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(claimed || Boolean(oauthError));
  const [demoComplete, setDemoComplete] = useState(false);
  const [receiptTime, setReceiptTime] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This claim link is missing its secure token.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadClaim() {
      try {
        const verified = await fetch(`/api/claims/verify?token=${encodeURIComponent(token)}`);
        const result = await verified.json();
        if (!verified.ok) throw new Error(result.error ?? "This claim link is invalid");
        if (!active) return;

        const loadedClaim = result.claim as Claim;
        setClaim(loadedClaim);
        window.localStorage.setItem(`lunchdrop-status-${loadedClaim.id}`, claimed ? "connected_claimed" : "opened");

        const location = await fetch(`/api/locations/${encodeURIComponent(loadedClaim.locationId)}`);
        const locationResult = await location.json();
        if (!location.ok) throw new Error("The Flynet location is unavailable");
        if (!active) return;

        const recommended = locationResult.location as Venue;
        setVenue(recommended);

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
  }, [token, claimed]);

  useEffect(() => {
    if (claimed) setReceiptTime(new Date().toLocaleString());
  }, [claimed]);

  const receiptStatus = claimed
    ? "Test FLY delivered through Blackbird"
    : demoComplete
      ? "Demo claim completed"
      : "";

  const receiptReward = claimed
    ? (rewardId ? rewardId : "Confirmed by Blackbird")
    : "No FLY moved in demo mode";

  const selectedPlace = chosenVenue ?? venue;

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

  function chooseVenue(nextVenue: Venue) {
    setChosenVenue(nextVenue);
    setShowAlternatives(false);
    if (claim) window.localStorage.setItem(`lunchdrop-venue-${claim.id}`, JSON.stringify(nextVenue));
  }

  function finishDemo() {
    if (!claim) return;
    setDemoComplete(true);
    setReceiptTime(new Date().toLocaleString());
    window.localStorage.setItem(`lunchdrop-status-${claim.id}`, "demo_claimed");
  }

  if (loading) {
    return <main className="claim-page"><div className="claim-status"><span className="eyebrow">VERIFYING SECURE LINK</span><h1>Opening your LunchDrop…</h1></div></main>;
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
            <p>There’s a note, a restaurant recommendation, and {claim.amount} FLY waiting inside.</p>
            <button className="claim-button" type="button" onClick={() => setRevealed(true)}>Open your LunchDrop <span>→</span></button>
          </div>
        </article>
        <p className="claim-footer">Live restaurant data by Flynet · Blackbird sign-in is optional</p>
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
          <div className="claim-mode"><span>TEST FLY</span><small>Signed claim verified</small></div>
          <span className="eyebrow">A LUNCHDROP FOR {claim.recipient.toUpperCase()}</span>
          <h1>{claimed || demoComplete ? "Lunch claimed!" : `${claim.sender} sent you lunch.`}</h1>
          <blockquote>“{claim.message}”</blockquote>

          <div className="claim-details">
            <div><small>YOUR LUNCHDROP</small><strong>{claim.amount} FLY</strong><span>test gift amount</span></div>
            <div><small>{selectedPlace.name === venue.name ? "RECOMMENDED PLACE" : "YOUR PICK"}</small><strong>{selectedPlace.name}</strong><span>{selectedPlace.location} · {selectedPlace.neighborhood}</span></div>
          </div>

          {claim.special && selectedPlace.name === venue.name ? <p className="claim-special"><b>Sender’s menu highlight:</b> {claim.special}</p> : null}

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
                      <button className={`alternative-card ${selectedPlace.name === venue.name ? "selected" : ""}`} type="button" onClick={() => chooseVenue(venue)}>
                        {venue.image ? <img src={venue.image} alt="" /> : null}
                        <span><b>{venue.name}</b><small>{venue.neighborhood}</small><em>Sender’s pick</em></span>
                      </button>
                      {alternativeVenues.map((restaurant) => (
                        <button className={`alternative-card ${selectedPlace.name === restaurant.name && selectedPlace.location === restaurant.location ? "selected" : ""}`} type="button" key={`${restaurant.name}-${restaurant.location}`} onClick={() => chooseVenue(restaurant)}>
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

          {oauthError ? <div className="claim-warning"><b>Connected claim not completed</b><span>{friendlyOAuthError(oauthError)}</span></div> : null}

          {claimed || demoComplete ? (
            <>
              <div className="claim-success"><span>✓</span><div><b>{claimed ? `${claim.amount} test FLY delivered` : "Demo claim complete"}</b><small>{claimed ? "Added to your connected Blackbird member account." : "No sign-in needed and no FLY moved."}</small></div></div>
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
            </>
          ) : (
            <>
              <button className="claim-button" type="button" onClick={finishDemo}>Test claim without sign-in <span>→</span></button>
              <div className="optional-blackbird">
                <span>OR</span>
                <a href={`/api/auth/blackbird/start?t=${encodeURIComponent(token)}`}>Connect Blackbird to claim test FLY →</a>
                <small>Optional. Use this only if you want to test the connected Blackbird member flow.</small>
              </div>
            </>
          )}

          <p className="claim-note">{claimed ? "Your connected test FLY claim is complete." : demoComplete ? "You tested the full recipient experience without creating an account." : "Blackbird sign-in is optional. You can test the gift without an account."}</p>
        </div>
      </article>

      <p className="claim-footer">Live restaurant data by Flynet · Secure signed claim · Blackbird optional</p>
    </main>
  );
}
