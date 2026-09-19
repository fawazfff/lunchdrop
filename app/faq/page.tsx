import { InfoPage } from "../components/InfoPage";

const faqs = [
  ["Are the restaurants real?", "Yes. LunchDrop loads live Blackbird locations, neighborhoods, cuisine, images, payment availability, and specials from Flynet."],
  ["Can the FLY only be spent at the selected restaurant?", "No. The restaurant is a thoughtful recommendation. Once delivered, FLY belongs to the recipient and can be used at participating Blackbird locations."],
  ["Are dishes and prices real?", "Only current Flynet Specials are shown. Flynet does not expose complete menus or regular dish prices, so LunchDrop never invents them."],
  ["Do I need a Blackbird account to test it?", "No. The recipient can open and test the LunchDrop claim flow without signing in. Blackbird sign-in is optional and is only used for the connected test FLY delivery flow."],
  ["Can the recipient choose another restaurant?", "Yes. The sender recommendation stays visible, but the recipient can browse other FLY-ready Blackbird locations in the same city. FLY is not locked to one restaurant."],
  ["Are claim links safe?", "LunchDrop now creates claim tokens on the server and verifies their signatures before displaying the gift, so recipients cannot change the amount or restaurant in the URL."],
  ["How are API limits protected?", "Locations and specials are cached for 60 minutes. LunchDrop fetches paginated data once per cache window rather than polling Flynet."],
];

export default function FaqPage() {
  return <InfoPage eyebrow="STRAIGHT ANSWERS" title="LunchDrop FAQ" intro="What is live, what comes from Flynet, and what remains in test mode." current="faq">
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
  </InfoPage>;
}

