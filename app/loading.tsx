import { LunchBuddy } from "./components/LunchBuddy";

export default function Loading() {
  return (
    <main className="global-loading">
      <div className="loading-orbit" aria-hidden="true" />
      <LunchBuddy message="Packing the next page…" />
      <div className="loading-progress" aria-hidden="true"><span /></div>
      <small>Good things are worth a tiny wait.</small>
    </main>
  );
}
