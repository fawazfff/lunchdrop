import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimCard } from "../../claim/ClaimCard";

export async function generateMetadata(): Promise<Metadata> {
  const title = "A LunchDrop is waiting for you";
  const description = "Open this private lunch gift to reveal the note and restaurant recommendation.";

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
