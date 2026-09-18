import { ClaimCard } from "./ClaimCard";
import { Suspense } from "react";

export default function ClaimPage() {
  return (
    <Suspense fallback={<main className="claim-page"><p>Opening your LunchDrop…</p></main>}>
      <ClaimCard />
    </Suspense>
  );
}
