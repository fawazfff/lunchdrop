import { InfoPage } from "../components/InfoPage";

export default function AboutPage() {
  return <InfoPage eyebrow="BUILT FOR RUNTIME" title="Lunch should feel personal again." intro="LunchDrop is a social lunch-gifting experience built on Blackbird’s restaurant network through Flynet." current="about">
    <div className="about-stack">
      <article><h2>The idea</h2><p>Instead of sending context-free cash, send someone a reason to step away, discover a real place, and eat something good.</p></article>
      <article><h2>The Flynet integration</h2><p>Flynet powers live restaurant discovery, FLY-payment filtering, claim-page location lookup, recipient venue choices, and current restaurant specials. Supabase-backed short claim codes keep the private gift payload off the share URL and persist claim status across devices.</p></article>
      <article><h2>The connected test</h2><p>Blackbird sign-in is optional. Anyone can test the gift flow without an account, while connected members can try the Blackbird OAuth and test FLY reward path.</p></article>
    </div>
  </InfoPage>;
}

