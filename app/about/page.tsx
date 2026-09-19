import { InfoPage } from "../components/InfoPage";

export default function AboutPage() {
  return <InfoPage eyebrow="BUILT FOR RUNTIME" title="Lunch should feel personal again." intro="LunchDrop is a tiny social gifting experience built on Blackbird’s restaurant network through Flynet.">
    <div className="about-stack">
      <article><h2>The idea</h2><p>Instead of sending cash with no context, send someone a reason to step away, visit a real place, and eat something good.</p></article>
      <article><h2>The Flynet integration</h2><p>The app calls Flynet’s Locations API for discovery, retrieves a venue again on the claim page, and checks the Specials API for live menu highlights and FLY rewards.</p></article>
      <article><h2>The next layer</h2><p>Once Blackbird supplies the OAuth client secret and registers the production callback, member identity, wallets, and Payment Intents can replace the demo claim.</p></article>
    </div>
  </InfoPage>;
}
