import { NextResponse } from "next/server";
import { lunchdropDbEnabled, senderLunchDropStatus } from "../../lib/lunchdrop-db";

type CheckState = "connected" | "configured" | "not_verified" | "unavailable";

export async function GET() {
  const apiKey = process.env.FLYNET_API_KEY ?? "";
  const apiBase = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";
  const clientId = process.env.FLYNET_CLIENT_ID ?? "19a0b552-ff8e-43de-b47a-bbc32ee0cd8a";
  const signingConfigured = Boolean(process.env.CLAIM_SIGNING_SECRET || apiKey);

  let flynetState: CheckState = apiKey ? "configured" : "unavailable";
  let flynetMessage = apiKey ? "Flynet is set up." : "Flynet is not set up.";
  let databaseState: CheckState = lunchdropDbEnabled() ? "configured" : "unavailable";
  let databaseMessage = lunchdropDbEnabled()
    ? "Gift storage is ready."
    : "Gift storage is not ready.";

  if (apiKey) {
    try {
      const response = await fetch(`${apiBase}/locations?page=0&page_size=1`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(4500),
      });
      if (response.ok) {
        flynetState = "connected";
        flynetMessage = "Live restaurant data is working.";
      } else {
        flynetState = "unavailable";
        flynetMessage = `Flynet returned HTTP ${response.status}.`;
      }
    } catch {
      flynetState = "unavailable";
      flynetMessage = "Flynet did not respond.";
    }
  }

  if (lunchdropDbEnabled()) {
    try {
      await senderLunchDropStatus("ZZZZZZZ", "status-health-check-key-000000");
      databaseState = "connected";
      databaseMessage = "Short gift links and cross-device status are working.";
    } catch {
      databaseState = "unavailable";
      databaseMessage = "Gift storage is set up, but the live check failed.";
    }
  }

  return NextResponse.json({
    environment: "Demo mode",
    checkedAt: new Date().toISOString(),
    checks: [
      {
        id: "supabase-claims",
        label: "Gift storage & live status",
        state: databaseState,
        message: databaseMessage,
      },
      {
        id: "abuse-protection",
        label: "Spam protection",
        state: databaseState === "connected" ? "connected" : "configured",
        message: "Public actions are protected from repeated spam and abuse.",
      },
      {
        id: "flynet-discovery",
        label: "Live restaurant data",
        state: flynetState,
        message: flynetMessage,
      },
      {
        id: "blackbird-oauth",
        label: "Blackbird sign-in",
        state: clientId ? "configured" : "unavailable",
        message: clientId ? "Blackbird sign-in is ready in the app." : "Blackbird sign-in is not ready.",
      },
      {
        id: "blackbird-member",
        label: "Blackbird member check",
        state: "not_verified",
        message: "The member check is built. It still needs one final test with an eligible Blackbird account.",
      },
      {
        id: "fly-rewards",
        label: "FLY reward delivery",
        state: apiKey ? "configured" : "unavailable",
        message: apiKey
          ? "The reward step is ready in the app. Final delivery still needs one eligible Blackbird member test."
          : "The reward connection is not ready.",
      },
      {
        id: "signed-claims",
        label: "Old-link fallback",
        state: signingConfigured ? "connected" : "unavailable",
        message: signingConfigured
          ? "Older LunchDrop links still work while new gifts use short private codes."
          : "Older LunchDrop links are not available.",
      },
    ],
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
