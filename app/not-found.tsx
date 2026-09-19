import { LunchBuddy } from "./components/LunchBuddy";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <a className="brand not-found-brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <section className="not-found-card">
        <span className="eyebrow">404 · WRONG TABLE</span>
        <LunchBuddy message="I checked the kitchen. This page isn’t on the menu." />
        <h1>Looks like this lunch wandered off.</h1>
        <p>The link may be old, mistyped, or just taking an unexpected lunch break.</p>
        <div className="not-found-actions">
          <a className="primary-button" href="/">Back home <span>→</span></a>
          <a className="secondary-action" href="/send">Send a LunchDrop</a>
        </div>
      </section>
    </main>
  );
}
