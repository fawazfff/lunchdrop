import { BlackbirdConnect } from "../components/BlackbirdConnect";
import { BlackbirdIntegration } from "../components/BlackbirdIntegration";
import { SiteNav } from "../components/SiteNav";

export default function BlackbirdPage() {
  return (
    <main className="info-page blackbird-page">
      <SiteNav current="blackbird" />

      <section className="info-hero shell">
        <span className="eyebrow">BLACKBIRD CONNECTION</span>
        <h1>Connect Blackbird only when you want the member reward flow.</h1>
        <p>
          LunchDrop works without a Blackbird account. Blackbird is optional and is used for member identity,
          wallet access, and the connected test FLY reward path.
        </p>
        <div className="blackbird-page-actions">
          <BlackbirdConnect />
          <a className="secondary-action" href="/status">View integration status</a>
        </div>
      </section>

      <section className="info-content shell">
        <BlackbirdIntegration />

        <div className="blackbird-explain-grid">
          <article>
            <span>01</span>
            <h2>Sender</h2>
            <p>The sender can create and share a LunchDrop without connecting Blackbird.</p>
            <a href="/send">Create a LunchDrop →</a>
          </article>
          <article>
            <span>02</span>
            <h2>Recipient</h2>
            <p>The recipient can open and test the gift without signing in.</p>
            <a href="/how-it-works">See the recipient flow →</a>
          </article>
          <article>
            <span>03</span>
            <h2>Optional reward</h2>
            <p>If the recipient wants to try the connected test FLY path, they connect their own Blackbird account.</p>
            <a href="/status">See what is verified →</a>
          </article>
        </div>

        <div className="truth-card">
          <b>No fake connected state</b>
          <p>
            The UI only shows Blackbird as connected after the OAuth callback identifies a member.
            The status page still marks end-to-end reward delivery as needing a usable Blackbird test/member account until that exact path is verified.
          </p>
        </div>
      </section>
    </main>
  );
}
