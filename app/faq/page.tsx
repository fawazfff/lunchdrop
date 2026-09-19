import { InfoPage } from "../components/InfoPage";

const faqs = [
  ["Are the restaurants real?", "Yes. LunchDrop loads live Blackbird locations, neighborhoods, cuisine, images, payment availability, and specials from Flynet."],
  ["Can the FLY only be spent at the selected restaurant?", "No. The restaurant is a thoughtful recommendation. Once delivered, FLY belongs to the recipient and can be used at participating Blackbird locations."],
  ["Are dishes and prices real?", "Only current Flynet Specials are shown. Flynet does not expose complete menus or regular dish prices, so LunchDrop never invents them."],
  ["Does FLY move today?", "The app wallet is funded with 100 test FLY. Automated member delivery is awaiting Flynet OAuth client-secret and write:rewards approval; the current claim screen is clearly marked as test mode."],
  ["Are claim links safe?", "LunchDrop now creates claim tokens on the server and verifies their signatures before displaying the gift, so recipients cannot change the amount or restaurant in the URL."],
  ["How are API limits protected?", "Locations and specials are cached for 60 minutes. LunchDrop fetches paginated data once per cache window rather than polling Flynet."],
];

export default function FaqPage() {
  return <InfoPage eyebrow="STRAIGHT ANSWERS" title="LunchDrop FAQ" intro="What is live, what comes from Flynet, and what remains in test mode.">
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
  </InfoPage>;
}

