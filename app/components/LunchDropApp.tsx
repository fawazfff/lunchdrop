"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [amount, setAmount] = useState(15);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [sender, setSender] = useState("Fawaz");
  const [recipient, setRecipient] = useState("Maya");
  const [message, setMessage] = useState("Lunch is on me today 💛");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

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
          setSelected(payload.restaurants[0] ?? null);
          setVisibleCount(6);
        }
      })
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
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

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.location, restaurant.neighborhood, ...restaurant.cuisine]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [restaurants, search]);

  const claimLink = useMemo(() => {
    if (!selected || typeof window === "undefined") return "";
    const params = new URLSearchParams({
      l: selected.locationId,
      t: recipient.trim() || "A friend",
      f: sender.trim() || "A friend",
      a: String(amount),
      m: message,
      ...(selectedSpecial ? { s: selectedSpecial.label } : {}),
    });
    return `${window.location.origin}/claim?${params.toString()}`;
  }, [amount, message, recipient, selected, selectedSpecial, sender]);

  function createDrop() {
    if (!selected) return;
    setSent(true);
    setTimeout(() => document.querySelector("#drop-ready")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(claimLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="LunchDrop home">
          <span className="brand-mark">L</span>
          <span>LunchDrop</span>
        </a>
        <div className="nav-links">
          <a href="/how-it-works">How it works</a>
          <a href="/faq">FAQ</a>
          <a href="/about">About</a>
        </div>
        <div className="nav-actions">
          <span className="live-pill"><i /> Live Flynet data</span>
          <a className="ghost-button" href="#build-drop">Explore restaurants</a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <span className="eyebrow">A LITTLE FOOD. A LOT OF LOVE.</span>
          <h1>Send lunch.<br /><em>Make their day.</em></h1>
          <p>Pick a real Blackbird restaurant, choose a city, and send a lunch note your friend can claim from one simple link.</p>
          <a className="primary-button" href="#build-drop">Send a LunchDrop <span>→</span></a>
          <div className="trust-row">
            <span>Powered by</span>
            <strong>BLACKBIRD</strong>
            <b>×</b>
            <strong>FLYNET</strong>
          </div>
        </div>

        <div className="hero-stage" aria-label="Preview of a LunchDrop gift">
          <div className="sun-disc" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <article className="gift-card">
            <div className="gift-topline"><span>LunchDrop</span><span className="gift-stamp">JUST FOR YOU</span></div>
            <div className="gift-amount"><small>FLY</small>15</div>
            <p>for something delicious</p>
            <div className="gift-divider" />
            <div className="gift-place"><span>🍽</span><div><b>Pick their favorite</b><small>Real restaurants via Flynet</small></div></div>
          </article>
          <span className="float-chip chip-one">Lunch secured ✓</span>
          <span className="float-chip chip-two">Sent with FLY</span>
        </div>
      </section>

      <section className="builder-section" id="build-drop">
        <div className="shell">
          <header className="section-heading">
            <span className="eyebrow">CREATE A DROP</span>
            <h2>Three steps to someone’s<br />best lunch this week.</h2>
          </header>

          <div className="step-row">
            <div className="step-label active"><span>1</span><div><b>Pick a place</b><small>Live from Flynet</small></div></div>
            <div className="step-line" />
            <div className="step-label"><span>2</span><div><b>Add the good stuff</b><small>Amount & note</small></div></div>
            <div className="step-line" />
            <div className="step-label"><span>3</span><div><b>Send the link</b><small>They claim with Blackbird</small></div></div>
          </div>

          <aside className="integration-proof">
            <span className="live-pill"><i /> LIVE API</span>
            <div><b>Flynet powers every restaurant choice</b><small>GET /flynet/v1/locations → real Blackbird venues, cities, neighborhoods, cuisines and images.</small></div>
            <a href="https://docs.flynet.org/api-reference/locations/list" target="_blank" rel="noreferrer">View Flynet endpoint ↗</a>
          </aside>

          <div className="builder-grid">
            <section className="panel restaurant-panel">
              <div className="panel-heading">
                <div><span className="panel-number">01</span><h3>Where should they eat?</h3></div>
                <span className="flynet-badge">↯ FLYNET</span>
              </div>
              <p className="panel-subtitle">Choose from live Blackbird locations. Restaurant and cuisine data come directly from Flynet.</p>
              <label className="field-label" htmlFor="city">Choose a city</label>
              <select id="city" className="text-input city-select" value={city} onChange={(event) => { setCity(event.target.value); setSent(false); }}>
                {cities.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
              <input className="text-input restaurant-search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(6); }} placeholder="Search every restaurant or cuisine" aria-label="Search restaurants" />

              {loading && <div className="restaurant-loading"><i /><i /><i /></div>}
              {error && <div className="error-card"><b>Flynet needs a minute.</b><span>{error}</span></div>}
              <div className="restaurant-list">
                {filteredRestaurants.slice(0, visibleCount).map((restaurant) => (
                  <button
                    type="button"
                    className={`restaurant-card ${selected?.locationId === restaurant.locationId ? "selected" : ""}`}
                    key={restaurant.locationId}
                    onClick={() => { setSelected(restaurant); setSent(false); }}
                  >
                    <img src={restaurant.image} alt="" />
                    <span className="restaurant-info">
                      <b>{restaurant.name}</b>
                      <small>{restaurant.cuisine.slice(0, 2).join(" · ")}</small>
                      <em>{restaurant.neighborhood} · {restaurant.location}</em>
                      {restaurant.paymentsEnabled ? <span className="payment-ready">FLY payments enabled</span> : null}
                    </span>
                    <span className="check">✓</span>
                  </button>
                ))}
              </div>
              {visibleCount < filteredRestaurants.length ? <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 8)}>Show more ({filteredRestaurants.length - visibleCount} left)</button> : null}
              <p className="api-note">{filteredRestaurants.length} live Flynet locations · cached for 60 minutes to protect API usage</p>
            </section>

            <section className="panel details-panel">
              <div className="panel-heading">
                <div><span className="panel-number">02</span><h3>Make it personal.</h3></div>
              </div>
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
              <input id="amount" className="text-input" type="number" min="1" max="10000" step="1" value={amount} onChange={(event) => { setAmount(Math.max(1, Number(event.target.value))); setSent(false); }} />

              <label className="field-label" htmlFor="message">Add a note</label>
              <textarea id="message" className="text-input note-input" value={message} maxLength={100} onChange={(event) => { setMessage(event.target.value); setSent(false); }} />
              <div className="character-count">{message.length}/100</div>

              <button className="send-button" type="button" disabled={!selected || !sender.trim() || !recipient.trim()} onClick={createDrop}>
                Create {fly(amount)} LunchDrop <span>→</span>
              </button>
              <p className="fine-print">Live Flynet restaurant discovery. This prototype creates a shareable lunch invitation; wallet transfer comes after Blackbird connection.</p>
            </section>
          </div>

          {sent && selected && (
            <section className="drop-ready" id="drop-ready">
              <div className="ready-confetti">✦</div>
              <div className="ready-copy">
                <span className="eyebrow">YOUR LUNCHDROP IS READY</span>
                <h2>{recipient}’s lunch is one link away.</h2>
                <p>{fly(amount)} for <strong>{selectedSpecial?.label || "anything they like"}</strong> at {selected.name}.</p>
              </div>
              <div className="link-box"><span>{claimLink}</span><button type="button" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button></div>
              <a className="preview-link" href={claimLink}>Preview what {recipient} sees →</a>
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

