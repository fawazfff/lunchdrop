export function HomePage() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="LunchDrop home">
          <span className="brand-mark">L</span><span>LunchDrop</span>
        </a>
        <div className="nav-links">
          <a href="/how-it-works">How it works</a>
          <a href="/faq">FAQ</a>
          <a href="/about">About</a>
        </div>
        <a className="ghost-button" href="/send">Send lunch</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <span className="eyebrow">A SMALL GIFT. A REALLY GOOD LUNCH.</span>
          <h1>Buy lunch.<br /><em>Send a link.</em></h1>
          <p>Choose a real Blackbird restaurant and send your friend FLY for lunch. They connect Blackbird to receive it.</p>
          <a className="primary-button" href="/send">Send a LunchDrop <span>→</span></a>
          <div className="trust-row"><span>Powered by</span><strong>BLACKBIRD</strong><b>×</b><strong>FLYNET</strong></div>
        </div>
        <div className="hero-stage" aria-label="LunchDrop gift preview">
          <div className="sun-disc" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <article className="gift-card">
            <div className="gift-topline"><span>LunchDrop</span><span className="gift-stamp">JUST FOR YOU</span></div>
            <div className="gift-amount"><small>FLY</small>15</div>
            <p>Lunch is on me today.</p>
            <div className="gift-divider" />
            <div className="gift-place"><span>🍽️</span><div><b>Pick a real restaurant</b><small>Live Blackbird places via Flynet</small></div></div>
          </article>
          <span className="float-chip chip-one">Connect Blackbird ✓</span>
          <span className="float-chip chip-two">Pay with FLY</span>
        </div>
      </section>

      <section className="home-explainer">
        <div className="shell">
          <header className="section-heading"><span className="eyebrow">EASY AS 1, 2, 3</span><h2>Lunch for a friend.<br />No guessing needed.</h2></header>
          <div className="simple-steps">
            <article><span>1</span><h3>Pick a restaurant</h3><p>Browse real Blackbird restaurants from Flynet.</p></article>
            <article><span>2</span><h3>Choose the FLY</h3><p>Set how much you want to send for lunch.</p></article>
            <article><span>3</span><h3>Share the link</h3><p>Your friend connects Blackbird and receives it.</p></article>
          </div>
          <div className="home-cta"><div><span className="eyebrow">READY?</span><h2>Make someone’s day.</h2></div><a className="primary-button" href="/send">Send lunch <span>→</span></a></div>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
        <div className="footer-links"><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
        <p>Built for Runtime NYC · Powered by Flynet</p>
      </footer>
    </main>
  );
}

