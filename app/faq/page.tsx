import { InfoPage } from "../components/InfoPage";

const faqs = [
  ["Are the restaurants real?", "Yes. LunchDrop loads real Blackbird restaurant choices from Flynet, including location details, photos, payment availability, and current specials when available."],
  ["Is FLY a test token?", "No. FLY is Blackbird’s real rewards and payment token. LunchDrop itself is in demo mode, and the optional Blackbird reward connection is the part we are still verifying end to end."],
  ["Can the FLY only be used at the selected restaurant?", "No. The restaurant is a thoughtful suggestion. FLY is not locked to that one place."],
  ["Are dishes and prices real?", "LunchDrop only shows current specials supplied by Flynet. It never invents menu items or prices."],
  ["Do I need a Blackbird account?", "No. You can open and use the LunchDrop demo without Blackbird. Connecting Blackbird is only for trying the optional FLY reward."],
  ["Can the recipient choose another restaurant?", "Yes. The sender’s choice stays visible, but the recipient can choose another available Blackbird place."],
  ["Are the links private?", "Yes. New LunchDrops use a short code, while the gift details stay on the server. Links also expire."],
  ["Does the sender see when it is opened?", "Yes. The sender can see Created, Opened, and Claimed updates even when the recipient opens the gift on another device."],
];

export default function FaqPage() {
  return <InfoPage eyebrow="STRAIGHT ANSWERS" title="LunchDrop FAQ" intro="Simple answers about restaurants, FLY, Blackbird, and the demo." current="faq">
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
  </InfoPage>;
}
