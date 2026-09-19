import { NextResponse } from "next/server";
import { lunchdropDbEnabled, senderLunchDropStatus } from "../../lib/lunchdrop-db";

type CheckState = "connected" | "configured" | "not_verified" | "unavailable";

export async function GET() {
  const apiKey = process.env.FLYNET_API_KEY ?? "";
  const apiBase = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";
  const clientId = process.env.FLYNET_CLIENT_ID ?? "19a0b552-ff8e-43de-b47a-bbc32ee0cd8a";
  const signingConfigured = Boolean(process.env.CLAIM_SIGNING_SECRET || apiKey);

  let flynetState: CheckState = apiKey ? "configured" : "unavailable";
  let flynetMessage = apiKey ? "Credentials are configured." : "FLYNET_API_KEY is missing.";
  let databaseState: CheckState = lunchdropDbEnabled() ? "configured" : "unavailable";
  let databaseMessage = lunchdropDbEnabled()
    ? "Supabase connection is configured."
    : "Supabase claim storage is not configured.";

  if (apiKey) {
    try {
      const response = await fetch(`${apiBase}/locations?page=0&page_size=1`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(4500),
      });
      if (response.ok) {
        flynetState = "connected";
        flynetMessage = "Live Flynet location request succeeded.";
      } else {
        flynetState = "unavailable";
        flynetMessage = `Flynet returned HTTP ${response.status}.`;
      }
    } catch {
      flynetState = "unavailable";
      flynetMessage = "Flynet did not respond to the health check.";
    }
  }

  if (lunchdropDbEnabled()) {
    try {
      await senderLunchDropStatus("ZZZZZZZ", "status-health-check-key-000000");
      databaseState = "connected";
      databaseMessage = "Supabase claim RPC is reachable. Short links and cross-device status are enabled.";
    } catch {
      databaseState = "unavailable";
      databaseMessage = "Supabase is configured but the claim RPC health check failed.";
    }
  }

  return NextResponse.json({
    environment: "Hackathon test mode",
    checkedAt: new Date().toISOString(),
    checks: [
      {
        id: "supabase-claims",
        label: "Supabase claim storage",
        state: databaseState,
        message: databaseMessage,
      },
      {
        id: "flynet-discovery",
        label: "Flynet discovery",
        state: flynetState,
        message: flynetMessage,
      },
      {
        id: "blackbird-oauth",
        label: "Blackbird OAuth",
        state: clientId ? "configured" : "unavailable",
        message: clientId ? "OAuth client and PKCE flow are configured." : "OAuth client is not configured.",
      },
      {
        id: "blackbird-member",
        label: "Blackbird member profile",
        state: "not_verified",
        message: "Implemented through /users/me. End-to-end member verification still needs a usable Blackbird test/member account.",
      },
      {
        id: "fly-rewards",
        label: "Test FLY rewards",
        state: apiKey ? "configured" : "unavailable",
        message: apiKey
          ? "Reward issuing code is configured. Successful member delivery should be verified with a Blackbird test/member account."
          : "Reward API credentials are missing.",
      },
      {
        id: "signed-claims",
        label: "Legacy signed-link fallback",
        state: signingConfigured ? "connected" : "unavailable",
        message: signingConfigured
          ? "Legacy tamper-resistant claim links remain available as a fallback; new LunchDrops use Supabase short codes."
          : "Legacy claim signing secret is missing.",
      },
    ],
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
