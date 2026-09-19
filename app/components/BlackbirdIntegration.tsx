type BlackbirdIntegrationProps = {
  compact?: boolean;
};

export function BlackbirdIntegration({ compact = false }: BlackbirdIntegrationProps) {
  return (
    <section className={`blackbird-integration ${compact ? "compact" : ""}`} id="blackbird-integration">
      <div className="blackbird-mark" aria-hidden="true">B</div>
      <div className="blackbird-copy">
        <span className="eyebrow">BLACKBIRD IS OPTIONAL</span>
        <h2>Connect Blackbird only if you want the FLY reward.</h2>
        <p>
          Anyone can open a LunchDrop without an account. If the person receiving it wants to try the FLY reward,
          they can connect their own Blackbird account after opening the gift.
        </p>
        <div className="blackbird-scopes">
          <span>Optional</span>
          <span>Blackbird sign-in</span>
          <span>Member check</span>
          <span>FLY reward</span>
        </div>
      </div>
      <div className="blackbird-flow" aria-label="Blackbird connection flow">
        <span>Open gift</span><b>→</b><strong>Connect Blackbird</strong><b>→</b><span>Confirm member</span><b>→</b><span>Try FLY reward</span>
      </div>
      <div className="blackbird-note">
        <i />
        <span>The sender never needs to connect Blackbird. The recipient chooses whether to connect after opening the gift.</span>
        <a href="/status">See what’s working →</a>
      </div>
    </section>
  );
}
