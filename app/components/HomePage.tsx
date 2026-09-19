import { LunchBuddy } from "./LunchBuddy";
import { BlackbirdIntegration } from "./BlackbirdIntegration";
import { BlackbirdConnect } from "./BlackbirdConnect";
import { SiteNav } from "./SiteNav";

export function HomePage() {
  return (
    <main>
      <SiteNav current="home" />

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <span className="eyebrow">A SMALL GIFT. A REAL MOMENT.</span>
          <h1>Send someone lunch.<br /><em>Make their day.</em></h1>
          <p>Choose a real Blackbird spot, add a note, and send a LunchDrop they can open in seconds.</p>
          <div className="hero-action-row"><a className="primary-button" href="/send">Send a LunchDrop <span>→</span></a><BlackbirdConnect /></div>
          <div className="trust-row"><span>Powered by</span><strong>BLACKBIRD</strong><b>×</b><strong>FLYNET</strong></div>
          <div className="hero-buddy"><LunchBuddy compact message="I know a good lunch when I see one." /></div>
        </div>
        <div className="hero-stage" aria-label="LunchDrop gift preview">
          <div className="sun-disc" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <article className="gift-card">
            <div className="gift-topline"><span>LunchDrop</span><span className="gift-stamp">DEMO</span></div>
            <div className="gift-amount"><small>FLY</small>15</div>
            <p>Lunch is on me today.</p><div className="gift-divider" />
            <div className="gift-place"><span>🍽️</span><div><b>Pick a real restaurant</b><small>Live Blackbird places via Flynet</small></div></div>
          </article>
          <span className="float-chip chip-one">Private gift link ✓</span><span className="float-chip chip-two">Optional FLY reward</span>
        </div>
      </section>

      <section className="home-explainer">
        <div className="shell">
          <header className="section-heading"><span className="eyebrow">EASY AS 1, 2, 3</span><h2>Lunch for a friend.<br />No guessing needed.</h2></header>
          <div className="simple-steps">
            <a className="simple-step-link" href="/live"><article><span>1</span><h3>Pick a restaurant</h3><p>Browse real Blackbird restaurants available through Flynet.</p><em>Browse live places →</em></article></a>
            <a className="simple-step-link" href="/send"><article><span>2</span><h3>Make it personal</h3><p>Choose the FLY amount, add a note, and pick a restaurant special if one is available.</p><em>Create a LunchDrop →</em></article></a>
            <a className="simple-step-link" href="/how-it-works"><article><span>3</span><h3>Share the link</h3><p>Your friend opens the gift, chooses a place, and can claim without signing in.</p><em>See the full flow →</em></article></a>
          </div>

          <section className="flynet-proof">
            <div><span className="eyebrow">BUILT WITH BLACKBIRD + FLYNET</span><h2>Real places. Simple gifting.</h2><p>Flynet gives LunchDrop the restaurant choices. Blackbird is optional for the person receiving the gift if they want to try the FLY reward.</p></div>
            <div className="proof-list"><a href="/live">✓ Real restaurant choices <b>→</b></a><a href="/blackbird">✓ Optional Blackbird sign-in <b>→</b></a><a href="/blackbird">✓ Optional FLY reward <b>→</b></a><a href="/status">✓ Short private gift links <b>→</b></a></div>
          </section>

          <BlackbirdIntegration />

          <div className="truth-strip"><strong>About FLY:</strong><span>FLY is Blackbird’s real rewards and payment token. LunchDrop is demo-testing the reward connection, so Blackbird stays optional.</span></div>
          <div className="home-cta"><div><span className="eyebrow">READY?</span><h2>Make someone’s day.</h2></div><a className="primary-button" href="/send">Send lunch <span>→</span></a></div>
        </div>
      </section>

      <footer className="footer shell"><a className="brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a><div className="footer-links"><a href="/live">Live places</a><a href="/blackbird">Blackbird</a><a href="/how-it-works">How it works</a><a href="/status">Status</a><a href="/faq">FAQ</a><a href="/about">About</a></div><p>Built for Runtime NYC · Powered by Flynet</p></footer>
    </main>
  );
}

