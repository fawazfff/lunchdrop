"use client";

import { useEffect, useMemo, useState } from "react";
import { LunchBuddy } from "../components/LunchBuddy";
import { SiteNav } from "../components/SiteNav";

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

export default function LiveFlynetPage() {
  const [city, setCity] = useState("New York, NY");
  const [cities, setCities] = useState<string[]>(["New York, NY"]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/restaurants?city=${encodeURIComponent(city)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load Flynet locations");
        if (!active) return;
        setRestaurants((payload.restaurants ?? []).filter((restaurant: Restaurant) => restaurant.paymentsEnabled));
        setCities(payload.cities ?? [city]);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Unable to load Flynet locations"))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [city, reloadNonce]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.location, restaurant.neighborhood, ...restaurant.cuisine]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [restaurants, search]);

  return (
    <main className="info-page live-page">
      <SiteNav current="live" />

      <section className="info-hero shell live-hero">
        <span className="eyebrow">LIVE FLYNET EXPLORER</span>
        <h1>See the restaurant data LunchDrop is actually using.</h1>
        <p>
          This page is powered by the same Flynet location endpoint used inside the LunchDrop sender flow.
          Nothing here is a static restaurant list.
        </p>
        <div className="live-source-row">
          <span className="live-pill"><i /> Live Flynet source</span>
          <a className="secondary-action" href="/status">Check integration health</a>
        </div>
      </section>

      <section className="info-content shell">
        <div className="live-controls">
          <label>
            <span>City</span>
            <select className="text-input" value={city} onChange={(event) => setCity(event.target.value)}>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input
              className="text-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Restaurant, neighborhood, cuisine"
            />
          </label>
        </div>

        {loading ? (
          <div className="status-loading">
            <LunchBuddy message="Checking Flynet for live lunch spots…" />
            <div className="loading-progress"><span /></div>
          </div>
        ) : null}

        {error ? (
          <div className="error-card">
            <b>Flynet data is temporarily unavailable.</b>
            <span>{error}</span>
            <button className="retry-button" type="button" onClick={() => setReloadNonce((value) => value + 1)}>Try again</button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="live-summary">
              <div><small>LIVE RESULTS</small><strong>{filtered.length}</strong><span>FLY-enabled locations</span></div>
              <div><small>CITY</small><strong>{city}</strong><span>from Flynet location data</span></div>
              <div><small>USE IT</small><strong>Pick one</strong><span>then send a LunchDrop there</span></div>
            </div>

            <div className="live-location-grid">
              {filtered.map((restaurant) => (
                <article className="live-location-card" key={restaurant.locationId}>
                  {restaurant.image ? <img src={restaurant.image} alt="" /> : null}
                  <div className="live-location-body">
                    <div className="live-location-topline"><span className="payment-ready">FLY payments enabled</span><small>{restaurant.neighborhood}</small></div>
                    <h2>{restaurant.name}</h2>
                    <p>{restaurant.cuisine.slice(0, 3).join(" · ") || "Restaurant"}</p>
                    <span className="live-location-address">{restaurant.location}</span>
                    <a
                      className="primary-button live-send-button"
                      href={`/send?city=${encodeURIComponent(city)}&location=${encodeURIComponent(restaurant.locationId)}`}
                    >
                      Send LunchDrop here <span>→</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty-card"><b>No matching FLY-enabled locations.</b><span>Try a different search or city.</span></div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
