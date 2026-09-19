import { InfoPage } from "../components/InfoPage";

export default function HowItWorksPage() {
  return <InfoPage eyebrow="THE FLOW" title="From a thought to their table." intro="LunchDrop turns a simple lunch idea into a gift someone can open in seconds." current="how">
    <div className="info-grid">
      <article><span>01</span><h2>Pick a place</h2><p>Choose a real Blackbird restaurant available through Flynet.</p></article>
      <article><span>02</span><h2>Make it personal</h2><p>Pick the FLY amount, add a note, and choose a restaurant special if one is available.</p></article>
      <article><span>03</span><h2>Send the link</h2><p>Your friend opens one short private link, keeps your restaurant suggestion or picks another place, and can use the demo without an account.</p></article>
    </div>
    <div className="truth-card"><b>Blackbird is optional</b><p>Your friend only needs to connect Blackbird if they want to try the FLY reward. Everything else works without signing in.</p></div>
  </InfoPage>;
}
