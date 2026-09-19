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
  const [message, setMessage] = useState("Lunch is on me today ğŸ’›");
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
          <a className="primary-button" href="#build-drop">Send a LunchDrop <span>â†’</span></a>
          <div className="trust-row">
            <span>Powered by</span>
            <strong>BLACKBIRD</strong>
            <b>Ã—</b>
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
            <div className="gift-place"><span>ğŸ½</span><div><b>Pick their favorite</b><small>Real restaurants via Flynet</small></div></div>
          </article>
          <span className="float-chip chip-one">Lunch secured âœ“</span>
          <span className="float-chip chip-two">Sent with FLY</span>
        </div>
      </section>

      <section className="builder-section" id="build-drop">
        <div className="shell">
          <header className="section-heading">
            <span className="eyebrow">CREATE A DROP</span>
            <h2>Three steps to someoneâ€™s<br />best lunch this week.</h2>
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
            <div><b>Flynet powers every restaurant choice</b><small>GET /flynet/v1/locations â†’ real Blackbird venues, cities, neighborhoods, cuisines and images.</small></div>
            <a href="https://docs.flynet.org/api-reference/locations/list" target="_blank" rel="noreferrer">View Flynet endpoint â†—</a>
          </aside>

          <div className="builder-grid">
            <section className="panel restaurant-panel">
              <div className="panel-heading">
                <div><span className="panel-number">01</span><h3>Where should they eat?</h3></div>
                <span className="flynet-badge">â†¯ FLYNET</span>
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
                      <small>{restaurant.cuisine.slice(0, 2).join(" Â· ")}</small>
                      <em>{restaurant.neighborhood} Â· {restaurant.location}</em>
                      {restaurant.paymentsEnabled ? <span className="payment-ready">FLY payments enabled</span> : null}
                    </span>
                    <span className="check">âœ“</span>
                  </button>
                ))}
              </div>
              {visibleCount < filteredRestaurants.length ? <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 8)}>Show more ({filteredRestaurants.length - visibleCount} left)</button> : null}
              <p className="api-note">{filteredRestaurants.length} live Flynet locations Â· cached for 60 minutes to protect API usage</p>
            </section>

            <section className="panel details-panel">
              <div className="panel-heading">
                <div><span className="panel-number">02</span><h3>Make it personal.</h3></div>
              </div>
              <p className="panel-subtitle">A little context makes lunch taste better.</p>

              <label className="field-label" htmlFor="sender">Your name</label>
              <input id="sender" className="text-input" value={sender} onChange={(event) => { setSender(event.target.value); setSent(false); }} placeholder="Who is sending this?" />

              <label className="field-label" htmlFor="recipient">Whoâ€™s getting lunch?</label>
              <input id="recipient" className="text-input" value={recipient} onChange={(event) => { setRecipient(event.target.value); setSent(false); }} placeholder="Their first name" />

              <span className="field-label">Flynet menu highlight</span>
              {specials.length > 0 ? <div className="special-list">
                {specials.map((special) => <button type="button" className={selectedSpecial?.id === special.id ? "active" : ""} key={special.id} onClick={() => { setSelectedSpecial(special); setSent(false); }}>
                  <span>{special.emoji || "âœ¦"}</span><div><b>{special.label}</b><small>{special.description || "Live restaurant special"}</small>{rewardFly(special) ? <em>{rewardFly(special)}</em> : null}</div>
                </button>)}
              </div> : <p className="no-special">Flynet has no current menu highlight for this restaurant. Regular menu prices are not included in the API.</p>}

              <label className="field-label" htmlFor="amount">Gift budget in FLY</label>
              <input id="amount" className="text-input" type="number" min="1" max="10000" step="1" value={amount} onChange={(event) => { setAmount(Math.max(1, Number(event.target.value))); setSent(false); }} />

              <label className="field-label" htmlFor="message">Add a note</label>
              <textarea id="message" className="text-input note-input" value={message} maxLength={100} onChange={(event) => { setMessage(event.target.value); setSent(false); }} />
              <div className="character-count">{message.length}/100</div>

              <button className="send-button" type="button" disabled={!selected || !sender.trim() || !recipient.trim()} onClick={createDrop}>
                Create {fly(amount)} LunchDrop <span>â†’</span>
              </button>
              <p className="fine-print">Live Flynet restaurant discovery. This prototype creates a shareable lunch invitation; wallet transfer comes after Blackbird connection.</p>
            </section>
          </div>

          {sent && selected && (
            <section className="drop-ready" id="drop-ready">
              <div className="ready-confetti">âœ¦</div>
              <div className="ready-copy">
                <span className="eyebrow">YOç]ü¶‰Ëkºwµçf²“²&÷‚×6†F÷s¢7‚7‚f"‚ÒÖ–æ²“²G&ç6f÷&Ó¢G&ç6ÆFR‚Ó'‚ÂÓ'‚“²Ğ¢ç6VæBÖ'WGFöâ²v–GFƒ¢S²Ö&v–â×F÷¢#Gƒ²Òç6VæBÖ'WGFöã¦F—6&ÆVB²÷6—G“¢ãC#²7W'6÷#¢æ÷BÖÆÆ÷vVC²G&ç6f÷&Ó¢æöæS²&÷‚×6†F÷s¢æöæS²Òæf–æR×&–çB²Ö&v–ã¢7‚²FW‡BÖÆ–vã¢6VçFW#²föçB×6—¦S¢ƒ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãR“²Ğ¢æG&÷×&VG’²÷6—F–öã¢&VÆF—fS²÷fW&fÆ÷s¢†–FFVã²Ö&v–â×F÷¢#'ƒ²FF–æs¢3‡ƒ²&÷&FW#¢‚6öÆ–Bf"‚ÒÖ–æ²“²&÷&FW"×&F—W3¢Gƒ²&6¶w&÷VæC¢f"‚Ò×–VÆÆ÷r“²&÷‚×6†F÷s¢‡‚‡‚f"‚ÒÖ–æ²“²Òç&VG’Ö6öæfWGF’²÷6—F–öã¢'6öÇWFS²&–v‡C¢3Wƒ²F÷¢‡ƒ²föçB×6—¦S¢sGƒ²6öÆ÷#¢&v&ƒ#SRÃ#2ÃSBÂãcR“²Òç&VG’Ö6÷’ƒ"²Ö&v–ã¢‚‡ƒ²föçB×6—¦S¢6Æ×ƒ3'‚ÃWgrÃS‡‚“²ÆWGFW"×76–æs¢ÒãSVVÓ²Òç&VG’Ö6÷’²Ö&v–ã¢#Gƒ²ÒæÆ–æ²Ö&÷‚²F—7Æ“¢fÆWƒ²&÷&FW#¢‚6öÆ–Bf"‚ÒÖ–æ²“²&÷&FW"×&F—W3¢‡ƒ²÷fW&fÆ÷s¢†–FFVã²&6¶w&÷VæC¢v†—FS²ÒæÆ–æ²Ö&÷‚7â²FF–æs¢7‚Wƒ²fÆWƒ¢²÷fW&fÆ÷s¢†–FFVã²FW‡BÖ÷fW&fÆ÷s¢VÆÆ—6—3²v†—FR×76S¢æ÷w&²föçC¢‚óã"f"‚ÒÖföçBÖvV—7BÖÖöæò’ÆÖöæ÷76S²ÒæÆ–æ²Ö&÷‚'WGFöâ²&÷&FW#¢²&÷&FW"ÖÆVgC¢‚6öÆ–Bf"‚ÒÖ–æ²“²&6¶w&÷VæC¢f"‚ÒÖ–æ²“²6öÆ÷#¢v†—FS²FF–æs¢#ƒ²föçB×vV–v‡C¢ƒ²7W'6÷#¢ö–çFW#²Òç&Wf–WrÖÆ–æ²²F—7Æ“¢–æÆ–æRÖ&Æö6³²Ö&v–â×F÷¢‡ƒ²föçB×vV–v‡C¢ƒ²&÷&FW"Ö&÷GFöÓ¢‚6öÆ–Bf"‚ÒÖ–æ²“²Ğ¢æfö÷FW"²Ö–âÖ†V–v‡C¢3ƒ²F—7Æ“¢fÆWƒ²§W7F–g’Ö6öçFVçC¢76RÖ&WGvVVã²Æ–vâÖ—FV×3¢6VçFW#²Òæfö÷FW"²föçB×6—¦S¢'ƒ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãSR“²Ğ ¢æ6Æ–Ò×vR²Ö–âÖ†V–v‡C¢fƒ²÷fW&fÆ÷s¢†–FFVã²÷6—F–öã¢&VÆF—fS²F—7Æ“¢w&–C²Æ6RÖ—FV×3¢6VçFW#²FF–æs¢‚#‚sƒ²&6¶w&÷VæC¢f"‚Ò×–VÆÆ÷r“²Òæ6Æ–ÒÖ'&æB²÷6—F–öã¢'6öÇWFS²F÷¢#‡ƒ²ÆVgC¢3Gƒ²Òæ6Æ–ÒÖvÆ÷r²÷6—F–öã¢'6öÇWFS²v–GFƒ¢c#ƒ²†V–v‡C¢c#ƒ²&÷&FW#¢‚6öÆ–B&v&ƒ#2Ã#"Ã‚Âã#R“²&÷&FW"×&F—W3¢SS²&÷‚×6†F÷s¢“‚&v&ƒ#SRÃ#SRÃ#SRÂã"’Âƒ‚&v&ƒ#SRÃ#SRÃ#SRÂã‚“²Òæ6Æ–ÒÖ6&B²÷6—F–öã¢&VÆF—fS²v–GFƒ¢Ö–âƒƒƒ‚ÃR“²F—7Æ“¢w&–C²w&–B×FV×ÆFRÖ6öÇVÖç3¢ãƒfg"ãFg#²&6¶w&÷VæC¢f"‚Ò×W"“²&÷&FW#¢‚6öÆ–Bf"‚ÒÖ–æ²“²&÷&FW"×&F—W3¢‡ƒ²÷fW&fÆ÷s¢†–FFVã²&÷‚×6†F÷s¢g‚g‚f"‚ÒÖ–æ²“²G&ç6—F–öã¢G&ç6f÷&ÒãG3²Òæ6Æ–ÒÖ6&Bæ6Æ–ÖVB²G&ç6f÷&Ó¢G&ç6ÆFU’‚ÓW‚’&÷FFR‚ÒãFFVr“²Òæ6Æ–ÒÖ–ÖvR²v–GFƒ¢S²†V–v‡C¢S²Ö–âÖ†V–v‡C¢S#ƒ²ö&¦V7BÖf—C¢6÷fW#²Òæ6Æ–ÒÖ&öG’²FF–æs¢S'‚Cgƒ²Òæ6Æ–ÒÖ&öG’ƒ²Ö&v–ã¢'‚#ƒ²föçB×6—¦S¢6Æ×ƒCG‚ÃggrÃsg‚“²Æ–æRÖ†V–v‡C¢ã“#²ÆWGFW"×76–æs¢ÒãcVVÓ²Òæ6Æ–ÒÖ&öG’&Æö6·V÷FR²Ö&v–ã¢#gƒ²FF–ærÖÆVgC¢gƒ²&÷&FW"ÖÆVgC¢7‚6öÆ–Bf"‚ÒÖ÷&ævR“²föçC¢—FÆ–2#‚óãBvV÷&v–Ç6W&–c²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚Âãr“²Òæ6Æ–ÒÖFWF–Ç2²F—7Æ“¢w&–C²w&–B×FV×ÆFRÖ6öÇVÖç3¢ãs&g"ã#†g#²&÷&FW"Ö&Æö6³¢‚6öÆ–Bf"‚ÒÖÆ–æR“²FF–æs¢#'‚²v¢#ƒ²Òæ6Æ–ÒÖFWF–Ç2F—b²F—7Æ“¢w&–C²v¢Gƒ²Òæ6Æ–ÒÖFWF–Ç26ÖÆÂ²föçC¢ƒ—‚óf"‚ÒÖföçBÖvV—7BÖÖöæò’ÆÖöæ÷76S²ÆWGFW"×76–æs¢ãVÓ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãCR“²Òæ6Æ–ÒÖFWF–Ç27G&öær²föçB×6—¦S¢#ƒ²Òæ6Æ–ÒÖFWF–Ç27â²föçB×6—¦S¢ƒ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãSR“²Òæ6Æ–ÒÖ'WGFöâ²v–GFƒ¢S²Ö&v–â×F÷¢#gƒ²Òæ6Æ–Ò×7V66W72²Ö&v–â×F÷¢#gƒ²F—7Æ“¢fÆWƒ²Æ–vâÖ—FV×3¢6VçFW#²v¢'ƒ²FF–æs¢Gƒ²&÷&FW#¢‚6öÆ–B33“scC3²&6¶w&÷VæC¢6S–cfS“²&÷&FW"×&F—W3¢‡ƒ²Òæ6Æ–Ò×7V66W72â7â²v–GFƒ¢3gƒ²†V–v‡C¢3gƒ²F—7Æ“¢w&–C²Æ6RÖ—FV×3¢6VçFW#²&÷&FW"×&F—W3¢SS²&6¶w&÷VæC¢33“scC3²6öÆ÷#¢v†—FS²Òæ6Æ–Ò×7V66W72F—b²F—7Æ“¢w&–C²v¢7ƒ²Òæ6Æ–Ò×7V66W726ÖÆÂ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚Âãb“²Òæ6Æ–ÒÖæ÷FR²FW‡BÖÆ–vã¢6VçFW#²Ö&v–ã¢g‚²föçB×6—¦S¢ƒ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãR“²Òæ6Æ–ÒÖfö÷FW"²÷6—F–öã¢'6öÇWFS²&÷GFöÓ¢#Gƒ²föçBÖfÖ–Ç“¢vV÷&v–Ç6W&–c²föçB×7G–ÆS¢—FÆ–3²Ğ ¤¶W–g&ÖW26†–ÖÖW"²Fò²&6¶w&÷VæB×÷6—F–öã¢Ó#R²ÒĞ ¢æ6—G’×6VÆV7B²Ö&v–ã¢‡ƒ²V&æ6S¢WFó²Ğ ¢æ–çFVw&F–öâ×&ööb²F—7Æ“¢w&–C²w&–B×FV×ÆFRÖ6öÇVÖç3¢WFòg"WFó²Æ–vâÖ—FV×3¢6VçFW#²v¢gƒ²Ö&v–ã¢#'ƒ²FF–æs¢G‚gƒ²&÷&FW#¢‚6öÆ–B3ƒ6#3†²&÷&FW"×&F—W3¢ƒ²&6¶w&÷VæC¢6VFc†VS²Ğ¢æ–çFVw&F–öâ×&ööbF—b²F—7Æ“¢w&–C²v¢7ƒ²Ğ¢æ–çFVw&F–öâ×&ööb6ÖÆÂ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚Âãb“²Ğ¢æ–çFVw&F–öâ×&ööb²föçB×6—¦S¢ƒ²föçB×vV–v‡C¢ƒ²FW‡BÖFV6÷&F–öã¢VæFW&Æ–æS²Ğ¤ÖVF–†Ö‚×v–GFƒ¢s#‚’²æ–çFVw&F–öâ×&ööb²w&–B×FV×ÆFRÖ6öÇVÖç3¢WFòg#²Òæ–çFVw&F–öâ×&ööb²w&–BÖ6öÇVÖã¢òÓ²ÒĞ¤ÖVF–†Ö‚×v–GFƒ¢ƒS‚’°¢æ†W&ò²w&–B×FV×ÆFRÖ6öÇVÖç3¢g#²FF–ær×F÷¢Sƒ²Òæ†W&ò×7FvR²Ö–âÖ†V–v‡C¢Csƒ²Òæ'V–ÆFW"Öw&–B²w&–B×FV×ÆFRÖ6öÇVÖç3¢g#²Òæ6Æ–ÒÖ6&B²w&–B×FV×ÆFRÖ6öÇVÖç3¢g#²Òæ6Æ–ÒÖ–ÖvR²Ö–âÖ†V–v‡C¢#3ƒ²Ö‚Ö†V–v‡C¢#cƒ²Òæ6Æ–ÒÖ&öG’²FF–æs¢3G‚#‡ƒ²Ğ§Ğ¤ÖVF–†Ö‚×v–GFƒ¢c#‚’°¢ç6†VÆÂ²v–GFƒ¢Ö–âƒRÒ#G‚Ãc‚“²Òææb²†V–v‡C¢s'ƒ²ÒæÆ—fR×–ÆÂ²F—7Æ“¢æöæS²Òæv†÷7BÖ'WGFöâ²FF–æs¢—‚'ƒ²föçB×6—¦S¢'ƒ²Òæ†W&ò²Ö–âÖ†V–v‡C¢WFó²FF–ærÖ&÷GFöÓ¢S‡ƒ²Òæ†W&òƒ²föçB×6—¦S¢S‡ƒ²Òæ†W&òÖ6÷’â²föçB×6—¦S¢gƒ²Òæ†W&ò×7FvR²Ö–âÖ†V–v‡C¢3“ƒ²Òç7VâÖF—62²v–GFƒ¢3ƒ²†V–v‡C¢3ƒ²Òæ÷&&—BÖöæR²v–GFƒ¢3cƒ²†V–v‡C¢#cƒ²Òæ÷&&—B×Gvò²v–GFƒ¢#cƒ²†V–v‡C¢3ƒƒ²Òæv–gBÖ6&B²v–GFƒ¢#sƒ²Ö–âÖ†V–v‡C¢33ƒ²FF–æs¢#ƒ²Òæv–gBÖÖ÷VçB²föçB×6—¦S¢“ƒ²Òæ6†—ÖöæR²F÷¢3Gƒ²&–v‡C¢²Òæ6†—×Gvò²ÆVgC¢²&÷GFöÓ¢3Wƒ²Òæ'V–ÆFW"×6V7F–öâ²FF–ærÖ&Æö6³¢cgƒ²Òç6V7F–öâÖ†VF–ærƒ"²Ö&v–âÖ&÷GFöÓ¢3Gƒ²Òç7FW×&÷r²F—7Æ“¢æöæS²ÒçæVÂ²FF–æs¢#'‚gƒ²ÒçæVÂ×7V'F—FÆR²Ö&v–âÖÆVgC¢²Òç&W7FW&çBÖ6&B²w&–B×FV×ÆFRÖ6öÇVÖç3¢cG‚g"#Gƒ²Òç&W7FW&çBÖ6&B–Ör²v–GFƒ¢cGƒ²†V–v‡C¢c'ƒ²ÒæÖ÷VçBÖw&–B²w&–B×FV×ÆFRÖ6öÇVÖç3¢&WVBƒ"Ãg"“²ÒæG&÷×&VG’²FF–æs¢#‡‚#ƒ²ÒæÆ–æ²Ö&÷‚²F—7Æ“¢w&–C²ÒæÆ–æ²Ö&÷‚'WGFöâ²&÷&FW#¢²FF–æs¢7ƒ²Òæfö÷FW"²Ö–âÖ†V–v‡C¢cƒ²fÆW‚ÖF—&V7F–öã¢6öÇVÖã²§W7F–g’Ö6öçFVçC¢6VçFW#²v¢gƒ²FW‡BÖÆ–vã¢6VçFW#²Òæ6Æ–Ò×vR²FF–æs¢“‚'‚cƒ²Òæ6Æ–ÒÖ'&æB²F÷¢#ƒ²ÆVgC¢#ƒ²Òæ6Æ–ÒÖ6&B²&÷‚×6†F÷s¢‡‚‡‚f"‚ÒÖ–æ²“²Òæ6Æ–ÒÖ&öG’ƒ²föçB×6—¦S¢Cgƒ²Òæ6Æ–ÒÖFWF–Ç2²w&–B×FV×ÆFRÖ6öÇVÖç3¢g#²Òæ6Æ–ÒÖfö÷FW"²föçB×6—¦S¢'ƒ²FW‡BÖÆ–vã¢6VçFW#²Ğ§Ğ ¢ææbÖÆ–æ·2²F—7Æ“¢fÆWƒ²Æ–vâÖ—FV×3¢6VçFW#²v¢#'ƒ²föçB×6—¦S¢'ƒ²föçB×vV–v‡C¢sS²Ğ¢ææbÖÆ–æ·2²÷6—F–öã¢&VÆF—fS²ÒææbÖÆ–æ·2£¦gFW"²6öçFVçC¢"#²÷6—F–öã¢'6öÇWFS²ÆVgC¢²&–v‡C¢S²&÷GFöÓ¢ÓWƒ²†V–v‡C¢'ƒ²&6¶w&÷VæC¢f"‚ÒÖ÷&ævR“²G&ç6—F–öã¢&–v‡Bã'3²ÒææbÖÆ–æ·2¦†÷fW#£¦gFW"²&–v‡C¢²Ğ¢æ†W&òÖ6÷’²æ–ÖF–öã¢&—6RÖ–âãw2&÷Fƒ²Òæv–gBÖ6&B²æ–ÖF–öã¢6&BÖfÆöBW2V6RÖ–âÖ÷WB–æf–æ—FS²Ğ¢ç&W7FW&çB×6V&6‚²Ö&v–âÖ&÷GFöÓ¢Gƒ²Òç–ÖVçB×&VG’²v–GFƒ¢f—BÖ6öçFVçC²FF–æs¢7‚gƒ²&÷&FW"×&F—W3¢““—ƒ²&6¶w&÷VæC¢6SfcVSƒ²6öÆ÷#¢33“scC3²föçB×6—¦S¢—ƒ²föçB×vV–v‡C¢ƒ²FW‡B×G&ç6f÷&Ó¢WW&66S²Ğ¢æÆöBÖÖ÷&R²v–GFƒ¢S²Ö&v–â×F÷¢'ƒ²FF–æs¢'ƒ²&÷&FW#¢‚F6†VBf"‚ÒÖ–æ²“²&÷&FW"×&F—W3¢‡ƒ²&6¶w&÷VæC¢G&ç7&VçC²7W'6÷#¢ö–çFW#²föçB×vV–v‡C¢ƒ²Òæ’Öæ÷FR²Ö&v–ã¢'‚²FW‡BÖÆ–vã¢6VçFW#²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãC‚“²föçB×6—¦S¢ƒ²Ğ¢ç7V6–ÂÖÆ—7B²F—7Æ“¢w&–C²v¢‡ƒ²Òç7V6–ÂÖÆ—7B'WGFöâ²F—7Æ“¢fÆWƒ²v¢ƒ²Æ–vâÖ—FV×3¢fÆW‚×7F'C²FF–æs¢ƒ²&÷&FW#¢‚6öÆ–Bf"‚ÒÖÆ–æR“²&÷&FW"×&F—W3¢‡ƒ²&6¶w&÷VæC¢f"‚Ò×W"“²FW‡BÖÆ–vã¢ÆVgC²7W'6÷#¢ö–çFW#²Òç7V6–ÂÖÆ—7B'WGFöâæ7F—fR²&÷&FW"Ö6öÆ÷#¢f"‚ÒÖ–æ²“²&6¶w&÷VæC¢6ffc†Cc²&÷‚×6†F÷s¢7‚7‚f"‚ÒÖ–æ²“²Òç7V6–ÂÖÆ—7B'WGFöââ7â²föçB×6—¦S¢#'ƒ²Òç7V6–ÂÖÆ—7B'WGFöâF—b²F—7Æ“¢w&–C²v¢7ƒ²Òç7V6–ÂÖÆ—7B6ÖÆÂ²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚Âãb“²Òææò×7V6–Â²Ö&v–ã¢²FF–æs¢'ƒ²&÷&FW"×&F—W3¢‡ƒ²&6¶w&÷VæC¢6cFcV#²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚Âãc"“²föçB×6—¦S¢'ƒ²Æ–æRÖ†V–v‡C¢ãS²Ğ¢ç7V6–ÂÖÆ—7BVÒ²v–GFƒ¢f—BÖ6öçFVçC²FF–æs¢7‚gƒ²&÷&FW"×&F—W3¢““—ƒ²&6¶w&÷VæC¢6SfcVSƒ²6öÆ÷#¢33“scC3²föçB×6—¦S¢—ƒ²föçB×7G–ÆS¢æ÷&ÖÃ²föçB×vV–v‡C¢ƒS²FW‡B×G&ç6f÷&Ó¢WW&66S²Ğ¢æ6Æ–Ò×7V6–Â²Ö&v–ã¢‡‚²FF–æs¢‚'ƒ²&÷&FW"×&F—W3¢‡ƒ²&6¶w&÷VæC¢6ffc†Cc²Òæfö÷FW"ÖÆ–æ·2²F—7Æ“¢fÆWƒ²v¢gƒ²föçB×6—¦S¢ƒ²föçB×vV–v‡C¢ƒ²Ğ¢æ–æfò×vR²Ö–âÖ†V–v‡C¢fƒ²&6¶w&÷VæC¢f"‚ÒÖ7&VÒ“²Òæ–æfòÖ†W&ò²FF–æs¢“‚cWƒ²æ–ÖF–öã¢&—6RÖ–âãg2&÷Fƒ²Òæ–æfòÖ†W&òƒ²Ö‚×v–GFƒ¢“ƒ²Ö&v–ã¢G‚#'ƒ²föçB×6—¦S¢6Æ×ƒS‡‚Ã‡grÃ‚“²Æ–æRÖ†V–v‡C¢ãƒƒ²ÆWGFW"×76–æs¢ÒãsVVÓ²Òæ–æfòÖ†W&ò²Ö‚×v–GFƒ¢sƒ²föçB×6—¦S¢#ƒ²Æ–æRÖ†V–v‡C¢ãSS²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚Âãc‚“²Òæ–æfòÖ6öçFVçB²FF–ærÖ&÷GFöÓ¢ƒ²Òæ–æfòÖw&–B²F—7Æ“¢w&–C²w&–B×FV×ÆFRÖ6öÇVÖç3¢&WVBƒ2Ãg"“²v¢gƒ²Òæ–æfòÖw&–B'F–6ÆRÂæ&÷WB×7F6²'F–6ÆR²FF–æs¢#‡ƒ²&÷&FW#¢‚6öÆ–Bf"‚ÒÖÆ–æR“²&÷&FW"×&F—W3¢Gƒ²&6¶w&÷VæC¢f"‚Ò×W"“²&÷‚×6†F÷s¢g‚g‚f"‚Ò×–VÆÆ÷r“²Òæ–æfòÖw&–B'F–6ÆR²G&ç6—F–öã¢G&ç6f÷&Òã'3²Òæ–æfòÖw&–B'F–6ÆS¦†÷fW"²G&ç6f÷&Ó¢G&ç6ÆFU’‚ÓW‚“²Òæ–æfòÖw&–B7â²6öÆ÷#¢f"‚ÒÖ÷&ævR“²föçC¢ƒS'‚óf"‚ÒÖföçBÖvV—7BÖÖöæò’ÆÖöæ÷76S²Òæ–æfòÖw&–Bƒ"Âæ&÷WB×7F6²ƒ"²föçB×6—¦S¢3ƒ²Ö&v–ã¢3‚ƒ²Òæ–æfòÖw&–BÂæ&÷WB×7F6²²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãcR“²Æ–æRÖ†V–v‡C¢ãc²ÒçG'WF‚Ö6&B²Ö&v–â×F÷¢#Gƒ²FF–æs¢#Gƒ²&÷&FW"×&F—W3¢Gƒ²&6¶w&÷VæC¢f"‚ÒÖ–æ²“²6öÆ÷#¢v†—FS²ÒçG'WF‚Ö6&B"²föçB×6—¦S¢#ƒ²ÒçG'WF‚Ö6&B²Ö&v–âÖ&÷GFöÓ¢²6öÆ÷#¢&v&ƒ#SRÃ#SRÃ#SRÂãr“²ÒæfÖÆ—7B²F—7Æ“¢w&–C²v¢ƒ²Ö‚×v–GFƒ¢ƒSƒ²ÒæfÖÆ—7BFWF–Ç2²&÷&FW#¢‚6öÆ–Bf"‚ÒÖÆ–æR“²&÷&FW"×&F—W3¢'ƒ²&6¶w&÷VæC¢f"‚Ò×W"“²FF–æs¢#‚#'ƒ²ÒæfÖÆ—7B7VÖÖ'’²7W'6÷#¢ö–çFW#²föçB×6—¦S¢‡ƒ²föçB×vV–v‡C¢ƒ²ÒæfÖÆ—7B²6öÆ÷#¢&v&ƒ#2Ã#"Ã‚ÂãcR“²Æ–æRÖ†V–v‡C¢ãc²Òæ&÷WB×7F6²²F—7Æ“¢w&–C²v¢gƒ²Òæ&÷WB×7F6²'F–6ÆR²&÷‚×6†F÷s¢æöæS²Òæ&÷WB×7F6²ƒ"²Ö&v–â×F÷¢²Ğ¤¶W–g&ÖW2&—6RÖ–â²g&öÒ²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ#G‚“²ÒFò²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ“²ÒĞ¤¶W–g&ÖW26&BÖfÆöB²RÃR²G&ç6f÷&Ó¢&÷FFR‚ÓFFVr’G&ç6ÆFU’ƒ“²ÒSR²G&ç6f÷&Ó¢&÷FFR‚Ó&FVr’G&ç6ÆFU’‚Ó‚“²ÒĞ¤ÖVF–†Ö‚×v–GFƒ¢ƒS‚’²ææbÖÆ–æ·2²F—7Æ“¢æöæS²ÒĞ¤ÖVF–†Ö‚×v–GFƒ¢sc‚’²æ–æfòÖw&–B²w&–B×FV×ÆFRÖ6öÇVÖç3¢g#²Òæ–æfòÖ†W&ò²FF–ær×F÷¢SWƒ²Òæ–æfòÖ†W&ò²föçB×6—¦S¢wƒ²Òæfö÷FW"ÖÆ–æ·2²F—7Æ“¢æöæS²ÒĞ¤ÖVF–‡&VfW'2×&VGV6VBÖÖ÷F–öã¢&VGV6R’²¢Â££¦&Vf÷&RÂ££¦gFW"²67&öÆÂÖ&V†f–÷#¢WFò–×÷'FçC²æ–ÖF–öâÖGW&F–öã¢ã×2–×÷'FçC²æ–ÖF–öâÖ—FW&F–öâÖ6÷VçC¢–×÷'FçC²G&ç6—F–öâÖGW&F–öã¢ã×2–×÷'FçC²ÒĞ