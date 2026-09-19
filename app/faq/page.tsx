import { InfoPage } from "../components/InfoPage";

const faqs = [
  ["Are the restaurants real?", "Yes. LunchDrop loads restaurant locations, neighborhoods, cuisine and images from Flynet’s live API."],
  ["Are the dishes and prices real?", "Only Flynet Specials are shown as menu highlights. Flynet does not expose full menus or regular dish prices, so LunchDrop never invents them."],
  ["Can I connect my Blackbird account?", "Not yet. Flynet OAuth requires a client secret and an exactly registered callback URL. The current app credentials include restaurant API access, but not the OAuth secret required for member sign-in."],
  ["Does money move today?", "No. The current claim is a demo invitation. Real FLY transfers require Blackbird OAuth plus Flynet Payment Intents."],
  ["How are API limits protected?", "Restaurant pages and specials are cached for 60 minutes. The app loads all paginated locations once per cache window rather than polling."],
];

export default function FaqPage() {
  return <InfoPage eyebrow="STRAIGHT ANSWERS" title="LunchDrop FAQ" intro="What is live, what comes from Flynet, and what still needs merchant access.">
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
  </InfoPage>;
}
