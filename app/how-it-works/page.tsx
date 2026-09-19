import { InfoPage } from "../components/InfoPage";

export default function HowItWorksPage() {
  return <InfoPage eyebrow="THE FLOW" title="From a thought to their table." intro="LunchDrop turns live Blackbird restaurant discovery into a personal lunch invitation.">
    <div className="info-grid">
      <article><span>01</span><h2>Explore</h2><p>Choose a city and search real restaurant locations returned by Flynet.</p></article>
      <article><span>02</span><h2>Personalize</h2><p>Pick a live special when available, set a FLY gift budget, and write a note.</p></article>
      <article><span>03</span><h2>Share</h2><p>Send a compact link. The recipient page resolves the venue live from its Flynet location ID.</p></article>
    </div>
    <div className="truth-card"><b>What is live today?</b><p>Restaurant discovery, location lookup, cuisine, images, cities, and restaurant specials use the Flynet API. Wallet transfer awaits OAuth merchant credentials.</p></div>
  </InfoPage>;
}
