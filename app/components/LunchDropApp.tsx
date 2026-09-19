"use client";

import { useEffect, useMemo, useState } from "react";
import { LunchBuddy } from "./LunchBuddy";
import { BlackbirdIntegration } from "./BlackbirdIntegration";

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

type ClaimStatus = "created" | "shared" | "opened" | "demo_claimed" | "connected_claimed";

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
  const [creating, setCreating] = useState(false);

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
          setSelected(payload.restaurants.find((restaurant: Restaurant) => restaurant.paymentsEnabled) ?? null);
          setVisibleCount(6);
        }
      })
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [city]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setSpecials([]);
    setSelectedSpecial(null);
    fetch(`/api/restaurants/${selected.id}/specials`)
      .then((response) => response.json())
      .then((payload) => { if (active) setSpecials(payload.specials ?? []); })
      .catch(() => { if (active) setSpecials([]); });
    return () => { active = false; };
  }, [selected]);

  useEffect(() => {
    if (!sent || !claimId) return;
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
  }, [claimId, sent]);

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
        body: JSON.stringify({ locationId: selected.locationId, recipient, sender, amount, message, special: selectedSpecial?.label }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create LunchDrop");
      setClaimLink(`${window.location.origin}${payload.url}`);
      setClaimId(payload.claimId);
      setClaimStatus("created");
      window.localStorage.setItem(`lunchdrop-status-${payload.claimId}`, "created");
      setSent(true);
      setTimeout(() => document.querySelector("#drop-ready")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create LunchDrop");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(claimLink);
    setCopied(true);
    if (claimId) {
      window.localStorage.setItem(`lunchdrop-status-${claimId}`, "shared");
      setClaimStatus("shared");
    }
    window.setTimeout(() => setCopied(false), 1800);
  }

  function sendAgain() {
    setSent(false);
    setCopied(false);
    setClaimLink("");
    setClaimId("");
    setClaimStatus("created");
    setRecipient("");
    setAmount(15);
    setMessage("Lunch is on me today 💛");
    setSelectedSpecial(null);
    window.setTimeout(() => document.querySelector("#build-drop")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const opened = ["opened", "demo_claimed", "connected_claimed"].includes(claimStatus);
  const claimed = ["demo_claimed", "connected_claimed"].includes(claimStatus);

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="LunchDrop home"><span className="brand-mark">L</span><span>LunchDrop</span></a>
        <div className="nav-links"><a href="/how-it-works">How it works</a><a href="#blackbird-integration">Blackbird</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
        <div className="nav-actions"><a className="nav-blackbird" href="#blackbird-integration">Blackbird OAuth</a><span className="live-pill"><i /> Live Flynet data</span><a className="ghost-button" href="/">Home</a></div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <span className="eyebrow">A LITTLE FOOD. A LOT OF LOVE.</span>
          <h1>Send lunch.<br /><em>Make their day.</em></h1>
          <p>Pick a real Blackbird restaurant, add a note, and send a LunchDrop they can open in seconds.</p>
          <a className="primary-button" href="#build-drop">Send a LunchDrop <span>→</span></a>
          <div className="trust-row"><span>Powered by</span><strong>BLACKBIRD</strong><b>×</b><strong>FLYNET</strong></div>
        </div>

        <div className="hero-stage" aria-label="Preview of a LunchDrop gift">
          <div className="sun-disc" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <article className="gift-card">
            <div className="gift-topline"><span>LunchDrop</span><span className="gift-stamp">JUST FOR YOU</span></div>
            <div className="gift-amount"><small>FLY</small>15</div>
            <p>for something delicious</p><div className="gift-divider" />
            <div className="gift-place"><span>🍽</span><div><b>Pick their favorite</b><small>Real restaurants via Flynet</small></div></div>
          </article>
          <span className="float-chip chip-one">Lunch secured ✓</span><span className="float-chip chip-two">Sent with FLY</span>
        </div>
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
            <a href="https://docs.flynet.org/api-reference/locations/list" target="_blank" rel="noreferrer">View Flynet endpoint ↗</a>
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
              {error && <div className="error-card"><b>Flynet needs a minute.</b><span>{error}</span></div>}
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
              <input id="amount" className="text-input" type="number" min="1" max="100" step="1" value={amount} onChange={(event) => { setAmount(Math.min(100, Math.max(1, Number(event.target.value)))); setSent(false); }} />

              <label className="field-label" htmlFor="message">Add a note</label>
              <textarea id="message" className="text-input note-input" value={message} maxLength={100} onChange={(event) => { setMessage(event.target.value); setSent(false); }} />
              <div className="character-count">{message.length}/100</div>

              <button className="send-button" type="button" disabled={!selected || !sender.trim() || !recipient.trim() || creating} onClick={createDrop}>
                {creating ? "Securing claim link…" : `Create ${fly(amount)} LunchDrop`} <span>→</span>
              </button>
              <p className="fine-print">Creates a signed, tamper-resistant test claim. The restaurant is a recommendation, not a lock-in.</p>
            </section>
          </div>

          {sent && selected && (
            <section className="drop-ready" id="drop-ready">
              <div className="ready-confetti">✦</div>
              <div className="ready-copy">
                <span className="eyebrow">YOUR LUNCHDROP IS READY</span>
                <h2>{recipient}’s lunch is one link away.</h2>
                <p>{fly(amount)} with <strong>{selectedSpecial?.label || selected.name}</strong> as your recommendation.</p>
              </div>
              <div className="link-box"><span>{claimLink}</span><button type="button" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button></div>

              <div className="sender-status">
                <div className="sender-status-heading"><div><span className="eyebrow">DEMO STATUS</span><h3>Follow the LunchDrop</h3></div><small>Live on this browser for the hackathon demo</small></div>
                <div className="status-timeline">
                  <div className="status-step done"><span>✓</span><div><b>Created</b><small>Secure gift link generated</small></div></div>
                  <div className={`status-step ${claimStatus !== "created" ? "done" : ""}`}><span>{claimStatus !== "created" ? "✓" : "2"}</span><div><b>Link shared</b><small>{claimStatus !== "created" ? "Link copied or opened" : "Copy the link to share it"}</small></div></div>
                  <div className={`status-step ${opened ? "done" : ""}`}><span>{opened ? "✓" : "3"}</span><div><b>Opened</b><small>{opened ? `${recipient}’s claim page was opened` : "Waiting for the recipient"}</small></div></div>
                  <div className={`status-step ${claimed ? "done" : ""}`}><span>{claimed ? "✓" : "4"}</span><div><b>Claimed</b><small>{claimStatus === "connected_claimed" ? "Test FLY delivered through Blackbird" : claimStatus === "demo_claimed" ? "Demo claim completed without sign-in" : "Waiting for claim"}</small></div></div>
                </div>
              </div>

              <div className="ready-actions">
                <a className="preview-link" href={claimLink} target="_blank" rel="noreferrer">Preview what {recipient} sees →</a>
                <button className="secondary-action" type="button" onClick={sendAgain}>Send another lunch</button>
              </div>
            </section>
          )}
        </div>
      </section>

      <footer className="footer shell">
        <div className="brand"><span className="brand-mark">L</span><span>LunchDrop</span></div>
        <div className="footer-links"><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
        <p>Built for Runtime NYC · Powered by Blackbird’s Flynet</p>
      </footer>
    </main>
  );
}
