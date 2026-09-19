import { Suspense } from "react";
import { ClaimCard } from "../../claim/ClaimCard";

export default async function CompactClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={<main className="claim-page"><p>Opening your LunchDrop…</p></main>}>
      <ClaimCard tokenOverride={token} />
    </Suspense>
  );
}
