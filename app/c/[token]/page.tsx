import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimCard } from "../../claim/ClaimCard";
import { verifyClaim } from "../../lib/claim-token";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let title = "A LunchDrop is waiting for you";
  let description = "Open a private lunch gift powered by Blackbird and Flynet.";

  try {
    const claim = verifyClaim(token);
    title = `${claim.sender} sent you a LunchDrop`;
    description = `A ${claim.amount} FLY lunch gift is waiting. Open it to see the restaurant recommendation and note.`;
  } catch {
    // Keep generic metadata for invalid/expired links.
  }

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "LunchDrop",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CompactClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={<main className="claim-page"><p>Opening your LunchDrop…</p></main>}>
      <ClaimCard tokenOverride={token} />
    </Suspense>
  );
}
