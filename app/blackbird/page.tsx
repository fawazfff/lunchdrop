import { BlackbirdConnect } from "../components/BlackbirdConnect";
import { BlackbirdIntegration } from "../components/BlackbirdIntegration";
import { SiteNav } from "../components/SiteNav";

export default function BlackbirdPage() {
  return (
    <main className="info-page blackbird-page">
      <SiteNav current="blackbird" />

      <section className="info-hero shell">
        <span className="eyebrow">BLACKBIRD CONNECTION</span>
        <h1>Connect Blackbird only when you want the FLY reward.</h1>
        <p>
          LunchDrop works without a Blackbird account. Connecting is optional and is only for the person receiving the gift who wants to try the FLY reward.
        </p>
        <div className="blackbird-page-actions">
          <BlackbirdConnect />
          <a className="secondary-action" href="/status">See what’s working</a>
        </div>
      </section>

      <section className="info-content shell">
        <BlackbirdIntegration />

        <div className="blackbird-explain-grid">
          <article>
            <span>01</span>
            <h2>Sender</h2>
            <p>The sender can create and share a LunchDrop without a Blackbird account.</p>
            <a href="/send">Create a LunchDrop →</a>
          </article>
          <article>
            <span>02</span>
            <h2>Recipient</h2>
            <p>The recipient can open the gift and choose a restaurant without signing in.</p>
            <a href="/how-it-works">See the recipient flow →</a>
          </article>
          <article>
            <span>03</span>
            <h2>Optional reward</h2>
            <p>If the recipient wants to try the FLY reward, they connect their own Blackbird account.</p>
            <a href="/status">See what’s working →</a>
          </article>
        </div>

        <div className="truth-card">
          <b>We only say “connected” when it really connects</b>
          <p>
            LunchDrop only shows Blackbird as connected after Blackbird confirms the member. The reward part stays clearly marked as a demo until we finish the final member test.
          </p>
        </div>
      </section>
    </main>
  );
}
