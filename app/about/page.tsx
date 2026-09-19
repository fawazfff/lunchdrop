import { InfoPage } from "../components/InfoPage";

export default function AboutPage() {
  return <InfoPage eyebrow="BUILT FOR RUNTIME" title="Lunch should feel personal again." intro="LunchDrop is a social lunch-gifting experience built on Blackbird’s restaurant network through Flynet.">
    <div className="about-stack">
      <article><h2>The idea</h2><p>Instead of sending context-free cash, send someone a reason to step away, discover a real place, and eat something good.</p></article>
      <article><h2>The Flynet integration</h2><p>Flynet powers live restaurant discovery, FLY-payment filtering, claim-page location lookup, and current restaurant specials. Server-signed claim links protect gift details from URL tampering.</p></article>
      <article><h2>The funded test</h2><p>The LunchDrop app wallet holds 100 test FLY. Automatic delivery to a connected Blackbird member is ready to add when Flynet enables OAuth and the write:rewards scope.</p></article>
    </div>
  </InfoPage>;
}

