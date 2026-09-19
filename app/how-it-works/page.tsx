import { InfoPage } from "../components/InfoPage";

export default function HowItWorksPage() {
  return <InfoPage eyebrow="THE FLOW" title="From a thought to their table." intro="LunchDrop turns live Blackbird restaurant discovery into a personal lunch gift that anyone can test." current="how">
    <div className="info-grid">
      <article><span>01</span><h2>Explore</h2><p>Choose a city and search FLY-enabled restaurant locations returned by Flynet.</p></article>
      <article><span>02</span><h2>Personalize</h2><p>Choose a live special when available, set the FLY amount, and write your note.</p></article>
      <article><span>03</span><h2>Share</h2><p>Send a compact, signed link. The recipient opens the gift, can browse other FLY-ready spots, and can test the claim without an account or optionally connect Blackbird.</p></article>
    </div>
    <div className="truth-card"><b>What is live today?</b><p>Restaurant discovery, FLY-payment filtering, specials, signed claim links, recipient venue choices, optional Blackbird OAuth, and the connected test FLY reward flow are all wired into the demo.</p></div>
  </InfoPage>;
}

