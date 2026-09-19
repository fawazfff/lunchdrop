"use client";

import { useEffect, useMemo, useState } from "react";
import { LunchBuddy } from "./LunchBuddy";
import { BlackbirdIntegration } from "./BlackbirdIntegration";
import { SiteNav } from "./SiteNav";

type Restaurant = {
  id: string;
  locationId: string;
  name: string;
  location: string;
  neighborhood: string;
  region: string;
  cuisine: string[];
  image: string;
  price: number;
  paymentsEnabled: boolean;
};

type Special = {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
  fly_reward?: { value: string; currency: "FLY" } | null;
};

type ClaimStatus = "created" | "shared" | "opened" | "demo_claimed" | "connected_claimed" | "cancelled" | "expired";

function fly(value: number) { return `${value} FLY`; }

function rewardFly(special: Special) {
  const raw = special.fly_reward?.value;
  if (!raw) return "";
  const value = Number(raw) / 1e18;
  return Number.isFinite(value) ? `${value} FLY reward` : "FLY reward";
}

export function LunchDropApp() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [city, setCity] = useState("New York, NY");
  const [cities, setCities] = useState<string[]>(["New York, NY"]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [neighborhood, setNeighborhood] = useState("All neighborhoods");
  const [cuisine, setCuisine] = useState("All cuisines");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [amount, setAmount] = useState(15);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [sender, setSender] = useState("Fawaz");
  const [recipient, setRecipient] = useState("Maya");
  const [message, setMessage] = useState("Lunch is on me today 💛");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [claimLink, setClaimLink] = useState("");
  const [claimId, setClaimId] = useState("");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("created");
  const [senderKey, setSenderKey] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [dbBacked, setDbBacked] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const [requestedLocationId, setRequestedLocationId] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const requestedCity = params.get("city");
      const requestedLocation = params.get("location");

      const saved = window.localStorage.getItem("lunchdrop-draft-v1");
      if (saved) {
        const draft = JSON.parse(saved) as {
          city?: string; sender?: string; recipient?: string; message?: string;
          amount?: number; expiryDays?: number;
        };
        if (draft.city) setCity(draft.city);
        if (typeof draft.sender === "string") setSender(draft.sender);
        if (typeof draft.recipient === "string") setRecipient(draft.recipient);
        if (typeof draft.message === "string") setMessage(draft.message);
        if (typeof draft.amount === "number") setAmount(Math.min(100, Math.max(1, draft.amount)));
        if ([1, 3, 7].includes(Number(draft.expiryDays))) setExpiryDays(Number(draft.expiryDays));
      }

      if (requestedCity) setCity(requestedCity);
      if (requestedLocation) setRequestedLocationId(requestedLocation);

      const recent = window.localStorage.getItem("lunchdrop-last-created");
      if (recent) {
        const last = JSON.parse(recent) as {
          claimLink?: string;
          claimId?: string;
          senderKey?: string;
          claimCode?: string;
          dbBacked?: boolean;
          createdAt?: number;
        };
        if (last.claimLink && last.claimId && last.createdAt && Date.now() - last.createdAt < 24 * 60 * 60 * 1000) {
          setClaimLink(last.claimLink);
          setClaimId(last.claimId);
          setSenderKey(last.senderKey ?? "");
          setClaimCode(last.claimCode ?? "");
          setDbBacked(Boolean(last.dbBacked));
          setClaimStatus((window.localStorage.getItem(`lunchdrop-status-${last.claimId}`) as ClaimStatus | null) ?? "created");
          setSent(true);
        }
      }
    } catch {
      // Ignore malformed browser draft data.
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem("lunchdrop-draft-v1", JSON.stringify({
      city,
      selectedLocationId: selected?.locationId ?? "",
      sender,
      recipient,
      message,
      amount,
      expiryDays,
      selectedSpecialId: selectedSpecial?.id ?? "",
    }));
  }, [amount, city, draftReady, expiryDays, message, recipient, selected?.locationId, selectedSpecial?.id, sender]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/restaurants?city=${encodeURIComponent(city)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load restaurants");
        if (active) {
          setRestaurants(payload.restaurants);
          setCities(payload.cities ?? [city]);
          let preferredLocationId = "";
          try {
            const draft = JSON.parse(window.localStorage.getItem("lunchdrop-draft-v1") ?? "{}") as { selectedLocationId?: string };
            preferredLocationId = draft.selectedLocationId ?? "";
          } catch {}
          const targetLocationId = requestedLocationId || preferredLocationId;
          setSelected(
            payload.restaurants.find((restaurant: Restaurant) => restaurant.locationId === targetLocationId && restaurant.paymentsEnabled)
              ?? payload.restaurants.find((restaurant: Restaurant) => restaurant.paymentsEnabled)
              ?? null,
          );
          setVisibleCount(6);
        }
      })
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [city, reloadNonce, requestedLocationId]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setSpecials([]);
    setSelectedSpecial(null);
    fetch(`/api/restaurants/${selected.id}/specials`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        const nextSpecials = payload.specials ?? [];
        setSpecials(nextSpecials);
        try {
          const draft = JSON.parse(window.localStorage.getItem("lunchdrop-draft-v1") ?? "{}") as { selectedSpecialId?: string };
          if (draft.selectedSpecialId) {
            setSelectedSpecial(nextSpecials.find((special: Special) => special.id === draft.selectedSpecialId) ?? null);
          }
        } catch {}
      })
      .catch(() => { if (active) setSpecials([]); });
    return () => { active = false; };
  }, [selected]);

  useEffect(() => {
    if (!sent || !claimId) return;

    if (dbBacked && claimCode && senderKey) {
      let active = true;
      const readRemoteStatus = async () => {
        try {
          const response = await fetch(
            `/api/claims/code/${encodeURIComponent(claimCode)}/status`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ senderKey }),
              cache: "no-store",
            },
          );
          if (!active || !response.ok) return;
          const payload = await response.json();
          const next = payload.status as ClaimStatus;
          setClaimStatus((current) => next === "created" && current === "shared" ? current : next);
          window.localStorage.setItem(`lunchdrop-status-${claimId}`, next);
        } catch {
          // Keep the last known status during a temporary network failure.
        }
      };

      void readRemoteStatus();
      const timer = window.setInterval(() => void readRemoteStatus(), 1600);
      return () => {
        active = false;
        window.clearInterval(timer);
      };
    }

    const readStatus = () => {
      const value = window.localStorage.getItem(`lunchdrop-status-${claimId}`) as ClaimStatus | null;
      if (value) setClaimStatus(value);
    };
    readStatus();
    const timer = window.setInterval(readStatus, 1000);
    const onStorage = (event: StorageEvent) => {
      if (event.key === `lunchdrop-status-${claimId}` && event.newValue) setClaimStatus(event.newValue as ClaimStatus);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [claimCode, claimId, dbBacked, senderKey, sent]);

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    const paymentLocations = restaurants.filter((restaurant) => restaurant.paymentsEnabled);
    return paymentLocations.filter((restaurant) =>
      (neighborhood === "All neighborhoods" || restaurant.neighborhood === neighborhood) &&
      (cuisine === "All cuisines" || restaurant.cuisine.includes(cuisine)) &&
      (!query || [restaurant.name, restaurant.location, restaurant.neighborhood, ...restaurant.cuisine]
        .some((value) => value.toLowerCase().includes(query))),
    );
  }, [cuisine, neighborhood, restaurants, search]);

  const neighborhoods = useMemo(
    () => ["All neighborhoods", ...new Set(restaurants.filter((item) => item.paymentsEnabled).map((item) => item.neighborhood))].sort(),
    [restaurants],
  );
  const cuisines = useMemo(
    () => ["All cuisines", ...new Set(restaurants.filter((item) => item.paymentsEnabled).flatMap((item) => item.cuisine))].sort(),
    [restaurants],
  );

  async function createDrop() {
    if (!selected) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: selected.locationId, recipient, sender, amount, message, special: selectedSpecial?.label, expiryDays }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create LunchDrop");
      const link = `${window.location.origin}${payload.url}`;
      setClaimLink(link);
      setClaimId(payload.claimId);
      setSenderKey(String(payload.senderKey ?? ""));
      setClaimCode(String(payload.code ?? ""));
      setDbBacked(Boolean(payload.dbBacked));
      setClaimStatus("created");
      window.localStorage.setItem(`lunchdrop-status-${payload.claimId}`, "created");
      window.localStorage.setItem("lunchdrop-last-created", JSON.stringify({
        claimLink: link,
        claimId: payload.claimId,
        senderKey: String(payload.senderKey ?? ""),
        claimCode: String(payload.code ?? ""),
        dbBacked: Boolean(payload.dbBacked),
        createdAt: Date.now(),
      }));
      window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "LunchDrop created. Ready to share." }));
      setSent(true);
      setTimeout(() => document.querySelector("#drop-ready")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create LunchDrop");
    } finally {
      setCreating(false);
    }
  }

  function markShared() {
    if (!claimId) return;
    window.localStorage.setItem(`lunchdrop-status-${claimId}`, "shared");
    setClaimStatus("shared");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(claimLink);
    setCopied(true);
    markShared();
    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "LunchDrop link copied." }));
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    if (!claimLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LunchDrop",
          text: `${sender} sent ${recipient || "you"} a LunchDrop.`,
          url: claimLink,
        });
        markShared();
        window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "LunchDrop shared." }));
        return;
      } catch (reason) {
        if (reason instanceof Error && reason.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  async function cancelDrop() {
    if (!dbBacked || !claimCode || !senderKey) return;
    const response = await fetch(`/api/claims/code/${encodeURIComponent(claimCode)}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderKey }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: payload.error ?? "Could not cancel LunchDrop." }));
      return;
    }
    setClaimStatus("cancelled");
    window.localStorage.setItem(`lunchdrop-status-${claimId}`, "cancelled");
    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "LunchDrop cancelled." }));
  }

  function sendAgain() {
    setSent(false);
    setCopied(false);
    setClaimLink("");
    setClaimId("");
    setSenderKey("");
    setClaimCode("");
    setDbBacked(false);
    setClaimStatus("created");
    setRecipient("");
    setAmount(15);
    setMessage("Lunch is on me today 💛");
    setSelectedSpecial(null);
    setExpiryDays(7);
    window.localStorage.removeItem("lunchdrop-last-created");
    window.dispatchEvent(new CustomEvent("lunchdrop:toast", { detail: "Fresh LunchDrop ready to make." }));
    window.setTimeout(() => document.querySelector("#build-drop")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const opened = ["opened", "demo_claimed", "connected_claimed"].includes(claimStatus);
  const claimed = ["demo_claimed", "connected_claimed"].includes(claimStatus);
  const terminal = ["connected_claimed", "cancelled", "expired"].includes(claimStatus);

  return (
    <main>
      <SiteNav current="send" />

      <section className="send-intro shell">
        <span className="eyebrow">CREATE A LUNCHDROP</span>
        <h1>Pick the lunch. Add the note. Send the link.</h1>
        <p>Everything below is the real sender flow. Restaurant choices come from Flynet and new gifts use short Supabase-backed claim links.</p>
        <div className="send-intro-links"><a href="/live">Browse live Flynet places →</a><a href="/blackbird">How Blackbird connects →</a></div>
      </section>

      <section className="builder-section" id="build-drop">
        <div className="shell">
          <header className="section-heading"><span className="eyebrow">CREATE A DROP</span><h2>Three steps to someone’s<br />best lunch this week.</h2></header>

          <div className="step-row">
            <div className="step-label active"><span>1</span><div><b>Pick a place</b><small>Live from Flynet</small></div></div>
            <div className="step-line" />
            <div className="step-label"><span>2</span><div><b>Add the good stuff</b><small>Amount & note</small></div></div>
            <div className="step-line" />
            <div className="step-label"><span>3</span><div><b>Send the link</b><small>No account required</small></div></div>
          </div>

          <BlackbirdIntegration compact />

          <aside className="integration-proof">
            <span className="live-pill"><i /> LIVE API</span>
            <div><b>Flynet powers every restaurant choice</b><small>Real Blackbird venues, cities, neighborhoods, cuisines, images, payment availability, and live specials.</small></div>
            <a href="/live">Open live Flynet explorer →</a>
          </aside>

          <div className="builder-grid">
            <section className="panel restaurant-panel">
              <div className="panel-heading"><div><span className="panel-number">01</span><h3>Where should they eat?</h3></div><span className="flynet-badge">↯ FLYNET</span></div>
              <p className="panel-subtitle">Choose a recommendation. Your recipient can still pick another FLY-ready Blackbird spot.</p>
              <label className="field-label" htmlFor="city">Choose a city</label>
              <select id="city" className="text-input city-select" value={city} onChange={(event) => { setCity(event.target.value); setSent(false); }}>
                {cities.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
              <input className="text-input restaurant-search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(6); }} placeholder="Search FLY-ready restaurants" aria-label="Search restaurants" />
              <div className="filter-grid">
                <select className="text-input" value={neighborhood} onChange={(event) => { setNeighborhood(event.target.value); setVisibleCount(6); }} aria-label="Filter by neighborhood">{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select>
                <select className="text-input" value={cuisine} onChange={(event) => { setCuisine(event.target.value); setVisibleCount(6); }} aria-label="Filter by cuisine">{cuisines.map((item) => <option key={item}>{item}</option>)}</select>
              </div>

              {loading && <div className="restaurant-loading branded-loading"><LunchBuddy compact message="Checking Flynet for good lunch spots…" /><div className="loading-progress"><span /></div></div>}
              {error && <div className="error-card"><b>Flynet needs a minute.</b><span>{error}</span><button className="retry-button" type="button" onClick={() => setReloadNonce((value) => value + 1)}>Try again</button></div>}
              <div className="restaurant-list">
                {filteredRestaurants.slice(0, visibleCount).map((restaurant) => (
                  <button type="button" className={`restaurant-card ${selected?.locationId === restaurant.locationId ? "selected" : ""}`} key={restaurant.locationId} onClick={() => { setSelected(restaurant); setSent(false); }}>
                    <img src={restaurant.image} alt="" />
                    <span className="restaurant-info">
                      <b>{restaurant.name}</b><small>{restaurant.cuisine.slice(0, 2).join(" · ")}</small>
                      <em>{restaurant.neighborhood} · {restaurant.location}</em>
                      {restaurant.paymentsEnabled ? <span className="payment-ready">FLY payments enabled</span> : null}
                    </span>
                    <span className="check">✓</span>
                  </button>
                ))}
              </div>
              {!loading && !error && filteredRestaurants.length === 0 ? <div className="empty-card"><b>No FLY-ready restaurants match.</b><span>Try another city or clear a filter.</span></div> : null}
              {visibleCount < filteredRestaurants.length ? <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 8)}>Show more ({filteredRestaurants.length - visibleCount} left)</button> : null}
              <p className="api-note">{filteredRestaurants.length} live Flynet locations · cached for 60 minutes to protect API usage</p>
            </section>

            <section className="panel details-panel">
              <div className="panel-heading"><div><span className="panel-number">02</span><h3>Make it personal.</h3></div></div>
              <p className="panel-subtitle">A little context makes lunch taste better.</p>

              <label className="field-label" htmlFor="sender">Your name</label>
              <input id="sender" className="text-input" value={sender} onChange={(event) => { setSender(event.target.value); setSent(false); }} placeholder="Who is sending this?" />

              <label className="field-label" htmlFor="recipient">Who’s getting lunch?</label>
              <input id="recipient" className="text-input" value={recipient} onChange={(event) => { setRecipient(event.target.value); setSent(false); }} placeholder="Their first name" />

              <span className="field-label">Flynet menu highlight</span>
              {specials.length > 0 ? <div className="special-list">
                {specials.map((special) => <button type="button" className={selectedSpecial?.id === special.id ? "active" : ""} key={special.id} onClick={() => { setSelectedSpecial(special); setSent(false); }}>
                  <span>{special.emoji || "✦"}</span><div><b>{special.label}</b><small>{special.description || "Live restaurant special"}</small>{rewardFly(special) ? <em>{rewardFly(special)}</em> : null}</div>
                </button>)}
              </div> : <p className="no-special">Flynet has no current menu highlight for this restaurant. Regular menu prices are not included in the API.</p>}

              <label className="field-label" htmlFor="amount">Gift budget in FLY</label>
              <div className="amount-grid" aria-label="Quick FLY amounts">
                {[5, 15, 30].map((value) => <button type="button" className={amount === value ? "active" : ""} key={value} onClick={() => { setAmount(value); setSent(false); }}>{value} FLY</button>)}
                <button type="button" className={![5, 15, 30].includes(amount) ? "active" : ""} onClick={() => document.getElementById("amount")?.focus()}>Custom</button>
              </div>
              <input id="amount" className="text-input amount-custom-input" aria-label="Custom FLY amount" type="number" min="1" max="100" step="1" value={amount} onChange={(event) => { setAmount(Math.min(100, Math.max(1, Number(event.target.value)))); setSent(false); }} />

              <span className="field-label">Gift link expiry</span>
              <div className="expiry-grid" aria-label="Choose how long the LunchDrop link stays valid">
                {[1, 3, 7].map((days) => <button type="button" className={expiryDays === days ? "active" : ""} key={days} onClick={() => { setExpiryDays(days); setSent(false); }}>{days === 1 ? "24 hours" : `${days} days`}</button>)}
              </div>

              <label className="field-label" htmlFor="message">Add a note</label>
              <textarea id="message" className="text-input note-input" value={message} maxLength={100} onChange={(event) => { setMessage(event.target.value); setSent(false); }} />
              <div className="character-count">{message.length}/100</div>

              <button className="send-button" type="button" disabled={!selected || !sender.trim() || !recipient.trim() || creating} onClick={createDrop}>
                {creating ? "Securing claim link…" : `Create ${fly(amount)} LunchDrop`} <span>→</span>
              </button>
              <p className="fine-print">Creates a short Supabase-backed claim link with cross-device status. The restaurant is a recommendation, not a lock-in.</p>
            </section>
          </div>

          {sent && selected && (
            <section className="drop-ready" id="drop-ready">
              <div className="ready-confetti">✦</div>
              <div className="ready-copy">
                <span className="eyebrow">YOUR LUNCHDROP IS READY {dbBacked ? "· LIVE STATUS" : ""}</span>
                <h2>{recipient}’s lunch is one link away.</h2>
                <p>{fly(amount)} with <strong>{selectedSpecial?.label || selected.name}</strong> as your recommendation. Link expires in {expiryDays === 1 ? "24 hours" : `${expiryDays} days`}.</p>
              </div>
              <div className="link-box"><span>{claimLink}</span><button type="button" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button></div>

              <div className="sender-status">
                <div className="sender-status-heading"><div><span className="eyebrow">{dbBacked ? "LIVE STATUS" : "DEMO STATUS"}</span><h3>Follow the LunchDrop</h3></div><small>{dbBacked ? "Cross-device status from Supabase" : "Live on this browser for the hackathon demo"}</small></div>
                <div className="status-timeline">
                  <div className="status-step done"><span>✓</span><div><b>Created</b><small>Secure gift link generated</small></div></div>
                  <div className={`status-step ${claimStatus !== "created" ? "done" : ""}`}><span>{claimStatus !== "created" ? "✓" : "2"}</span><div><b>Link shared</b><small>{claimStatus !== "created" ? "Link copied or opened" : "Copy the link to share it"}</small></div></div>
                  <div className={`status-step ${opened ? "done" : ""}`}><span>{opened ? "✓" : "3"}</span><div><b>Opened</b><small>{opened ? `${recipient}’s claim page was opened` : "Waiting for the recipient"}</small></div></div>
                  <div className={`status-step ${claimed ? "done" : ""}`}><span>{claimed ? "✓" : "4"}</span><div><b>Claimed</b><small>{claimStatus === "connected_claimed" ? "Test FLY delivered through Blackbird" : claimStatus === "demo_claimed" ? "Demo claim completed without sign-in" : claimStatus === "cancelled" ? "Cancelled by sender" : claimStatus === "expired" ? "Link expired" : "Waiting for claim"}</small></div></div>
                </div>
              </div>

              <div className="share-actions">
                <button className="share-button primary-share" type="button" onClick={() => void shareLink()}>Share LunchDrop <span>↗</span></button>
                <button className="share-button" type="button" onClick={() => void copyLink()}>{copied ? "Copied!" : "Copy link"}</button>
                <a className="share-button" target="_blank" rel="noreferrer" onClick={markShared} href={`https://wa.me/?text=${encodeURIComponent(`Lunch is on me. Open your LunchDrop: ${claimLink}`)}`}>WhatsApp</a>
                <a className="share-button" target="_blank" rel="noreferrer" onClick={markShared} href={`https://t.me/share/url?url=${encodeURIComponent(claimLink)}&text=${encodeURIComponent("A LunchDrop is waiting for you.")}`}>Telegram</a>
                <a className="share-button" onClick={markShared} href={`sms:?&body=${encodeURIComponent(`Lunch is on me. Open your LunchDrop: ${claimLink}`)}`}>Messages</a>
              </div>
              {claimStatus === "cancelled" ? <div className="claim-warning"><b>LunchDrop cancelled</b><span>The recipient can no longer open or claim this gift.</span></div> : null}
              {claimStatus === "expired" ? <div className="claim-warning"><b>LunchDrop expired</b><span>Create a new one if you still want to send lunch.</span></div> : null}
              <div className="ready-actions">
                {!terminal ? <a className="preview-link" href={claimLink} target="_blank" rel="noreferrer">Preview what {recipient} sees →</a> : null}
                <a className="preview-link" href="/status">Integration status →</a>
                {dbBacked && !terminal ? <button className="danger-action" type="button" onClick={() => void cancelDrop()}>Cancel LunchDrop</button> : null}
                <button className="secondary-action" type="button" onClick={sendAgain}>Send another lunch</button>
              </div>
            </section>
          )}
        </div>
      </section>

      <footer className="footer shell">
        <div className="brand"><span className="brand-mark">L</span><span>LunchDrop</span></div>
        <div className="footer-links"><a href="/live">Live Flynet</a><a href="/blackbird">Blackbird</a><a href="/how-it-works">How it works</a><a href="/status">Status</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
        <p>Built for Runtime NYC · Powered by Blackbird’s Flynet</p>
      </footer>
    </main>
  );
}
