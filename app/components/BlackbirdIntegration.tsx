type BlackbirdIntegrationProps = {
  compact?: boolean;
};

export function BlackbirdIntegration({ compact = false }: BlackbirdIntegrationProps) {
  return (
    <section className={`blackbird-integration ${compact ? "compact" : ""}`} id="blackbird-integration">
      <div className="blackbird-mark" aria-hidden="true">B</div>
      <div className="blackbird-copy">
        <span className="eyebrow">BLACKBIRD APP INTEGRATION</span>
        <h2>Blackbird connects on the recipient side.</h2>
        <p>
          Anyone can open and test a LunchDrop without an account. When a recipient wants the connected flow,
          they tap <strong>Connect Blackbird</strong> on the claim screen. LunchDrop starts Blackbird OAuth,
          requests member profile and wallet access, then attempts the test FLY reward flow.
        </p>
        <div className="blackbird-scopes">
          <span>OAuth + PKCE</span>
          <span>read:profile</span>
          <span>read:wallets</span>
          <span>FLY rewards</span>
        </div>
      </div>
      <div className="blackbird-flow" aria-label="Blackbird connection flow">
        <span>Open gift</span><b>→</b><strong>Connect Blackbird</strong><b>→</b><span>Member verified</span><b>→</b><span>Test FLY</span>
      </div>
      <div className="blackbird-note">
        <i />
        <span>The sign-in button appears after a recipient opens a real LunchDrop, because that recipient is the person authorizing their Blackbird account.</span>
        <a href="/status">View live integration status →</a>
      </div>
    </section>
  );
}
