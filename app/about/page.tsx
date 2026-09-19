import { InfoPage } from "../components/InfoPage";

export default function AboutPage() {
  return <InfoPage eyebrow="BUILT FOR RUNTIME" title="Lunch should feel personal again." intro="LunchDrop is a simple way to send someone lunch using real Blackbird restaurant choices from Flynet." current="about">
    <div className="about-stack">
      <article><h2>The idea</h2><p>Instead of sending plain cash, send someone a lunch suggestion, a note, and one link they can open anywhere.</p></article>
      <article><h2>Where the restaurants come from</h2><p>Flynet gives LunchDrop the real restaurant choices, photos, locations, payment availability, and current specials shown in the app.</p></article>
      <article><h2>Where Blackbird fits</h2><p>Blackbird is optional. The person receiving lunch only connects if they want to try the FLY reward. The normal gift flow does not require an account.</p></article>
    </div>
  </InfoPage>;
}
