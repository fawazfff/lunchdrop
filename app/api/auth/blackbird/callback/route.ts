import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyClaim } from "../../../../lib/claim-token";

const CLIENT_ID = process.env.FLYNET_CLIENT_ID ?? "19a0b552-ff8e-43de-b47a-bbc32ee0cd8a";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://lunchdrop.vercel.app/api/auth/blackbird/callback";
const AUTH_BASE = process.env.FLYNET_AUTH_BASE ?? "https://api.blackbird.xyz/oauth";
const API_BASE = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";

function claimRedirect(request: Request, token: string, values: Record<string, string>) {
  const url = token ? new URL(`/c/${token}`, request.url) : new URL("/claim", request.url);
  for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
  const response = NextResponse.redirect(url);
  response.cookies.delete("ld_oauth_state");
  response.cookies.delete("ld_oauth_verifier");
  response.cookies.delete("ld_claim");
  return response;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("ld_claim")?.value ?? "";
  const expectedState = cookieStore.get("ld_oauth_state")?.value ?? "";
  const verifier = cookieStore.get("ld_oauth_verifier")?.value ?? "";
  const code = params.get("code") ?? "";
  const state = params.get("state") ?? "";

  if (params.get("error")) return claimRedirect(request, token, { oauth_error: "authorization_cancelled" });
  if (!token || !code || !verifier || !state || state !== expectedState) return claimRedirect(request, token, { oauth_error: "invalid_oauth_state" });

  let claim;
  try { claim = verifyClaim(token); }
  catch { return claimRedirect(request, "", { oauth_error: "invalid_claim" }); }

  const exchangeBody: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
  };
  if (process.env.FLYNET_CLIENT_SECRET) exchangeBody.client_secret = process.env.FLYNET_CLIENT_SECRET;

  const exchange = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(exchangeBody),
    cache: "no-store",
  });
  if (!exchange.ok) return claimRedirect(request, token, { oauth_error: `token_exchange_${exchange.status}` });
  const oauth = await exchange.json();
  const accessToken = oauth.access_token as string | undefined;
  if (!accessToken) return claimRedirect(request, token, { oauth_error: "missing_access_token" });

  const profileResponse = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!profileResponse.ok) return claimRedirect(request, token, { oauth_error: `profile_${profileResponse.status}` });
  const profile = await profileResponse.json();
  const userId = profile.id as string | undefined;
  if (!userId) return claimRedirect(request, token, { oauth_error: "missing_member_id" });

  const apiKey = process.env.FLYNET_API_KEY;
  if (!apiKey) return claimRedirect(request, token, { oauth_error: "rewards_not_configured" });
  const rewardResponse = await fetch(`${API_BASE}/issue_reward`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      amount: { value: (BigInt(claim.amount) * BigInt("1000000000000000000")).toString(), currency: "FLY" },
      description: `LunchDrop from ${claim.sender}`,
      idempotency_key: `lunchdrop-${claim.id}`,
      metadata: { claim_id: claim.id, location_id: claim.locationId, recipient_name: claim.recipient },
    }),
    cache: "no-store",
  });
  const reward = await rewardResponse.json().catch(() => ({}));
  if (!rewardResponse.ok) return claimRedirect(request, token, { oauth_error: `reward_${rewardResponse.status}` });
  if (reward.user_id && reward.user_id !== userId) return claimRedirect(request, token, { oauth_error: "already_claimed" });

  return claimRedirect(request, token, { claimed: "1", reward: String(reward.id ?? "confirmed") });
}

