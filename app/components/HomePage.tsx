import { LunchBuddy } from "./LunchBuddy";

export function HomePage() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="LunchDrop home"><span className="brand-mark">L</span><span>LunchDrop</span></a>
        <div className="nav-links"><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
        <a className="ghost-button" href="/send">Send lunch</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <span className="eyebrow">A SMALL GIFT. A REAL MOMENT.</span>
          <h1>Send someone lunch.<br /><em>Make their day.</em></h1>
          <p>Choose a real Blackbird spot, add a note, and send a LunchDrop they can open in seconds.</p>
          <a className="primary-button" href="/send">Send a LunchDrop <span>→</span></a>
          <div className="trust-row"><span>Powered by</span><strong>BLACKBIRD</strong><b>×</b><strong>FLYNET</strong></div>
          <div className="hero-buddy"><LunchBuddy compact message="I know a good lunch when I see one." /></div>
        </div>
        <div className="hero-stage" aria-label="LunchDrop gift preview">
          <div className="sun-disc" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <article className="gift-card">
            <div className="gift-topline"><span>LunchDrop</span><span className="gift-stamp">TEST MODE</span></div>
            <div className="gift-amount"><small>FLY</small>15</div>
            <p>Lunch is on me today.</p><div className="gift-divider" />
            <div className="gift-place"><span>🍽️</span><div><b>Pick a real restaurant</b><small>Live Blackbird places via Flynet</small></div></div>
          </article>
          <span className="float-chip chip-one">Secure claim link ✓</span><span className="float-chip chip-two">100 test FLY ready</span>
        </div>
      </section>

      <section className="home-explainer">
        <div className="shell">
          <header className="section-heading"><span className="eyebrow">EASY AS 1, 2, 3</span><h2>Lunch for a friend.<br />No guessing needed.</h2></header>
          <div className="simple-steps">
            <article><span>1</span><h3>Pick a restaurant</h3><p>Browse real, FLY-enabled Blackbird locations from Flynet.</p></article>
            <article><span>2</span><h3>Make it personal</h3><p>Choose a FLY amount, a live special when available, and add your note.</p></article>
            <article><span>3</span><h3>Share the link</h3><p>Your friend opens the gift, can keep your recommendation or browse other FLY-ready spots, and can test the claim without signing in.</p></article>
          </div>

          <section className="flynet-proof">
            <div><span className="eyebrow">BUILT WITH BLACKBIRD + FLYNET</span><h2>Real data. Real member flow.</h2><p>LunchDrop uses Flynet for live restaurant discovery and Blackbird for optional member sign-in and test FLY reward delivery.</p></div>
            <div className="proof-list"><span>✓ Live Flynet locations</span><span>✓ Blackbird member OAuth</span><span>✓ Test FLY reward delivery</span><span>✓ Signed one-time claim links</span></div>
          </section>

          <div className="truth-strip"><strong>No account required:</strong><span>Anyone can test the recipient claim flow. Blackbird sign-in is optional and only needed if they want to try connected test FLY delivery.</span></div>
          <div className="home-cta"><div><span className="eyebrow">READY?</span><h2>Make someone’s day.</h2></div><a className="primary-button" href="/send">Send lunch <span>→</span></a></div>
        </div>
      </section>

      <footer className="footer shell"><a className="brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a><div className="footer-links"><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/about">About</a></div><p>Built for Runtime NYC · Powered by Flynet</p></footer>
    </main>
  );
}

