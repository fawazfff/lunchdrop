import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyClaim } from "../../../../lib/claim-token";
import { connectedClaimLunchDrop, openLunchDrop } from "../../../../lib/lunchdrop-db";

const CLIENT_ID = process.env.FLYNET_CLIENT_ID ?? "19a0b552-ff8e-43de-b47a-bbc32ee0cd8a";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://lunchdrop.vercel.app/api/auth/blackbird/callback";
const AUTH_BASE = process.env.FLYNET_AUTH_BASE ?? "https://api.blackbird.xyz/oauth";
const API_BASE = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";

type RewardClaim = {
  id: string;
  locationId: string;
  recipient: string;
  sender: string;
  amount: number;
  status?: string;
  rewardId?: string;
};

function safeReturnPath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 300);
}

function clearOAuthCookies(response: NextResponse) {
  const expired = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 0, path: "/api/auth/blackbird" };
  for (const name of ["ld_oauth_state", "ld_oauth_verifier", "ld_oauth_mode", "ld_oauth_return", "ld_claim", "ld_claim_code"]) {
    response.cookies.set(name, "", expired);
  }
}

function setMemberSession(response: NextResponse, memberId: string) {
  response.cookies.set("ld_blackbird_member", memberId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

function finishRedirect(
  request: Request,
  token: string,
  code: string,
  returnPath: string,
  values: Record<string, string>,
  memberId?: string,
) {
  const url = code
    ? new URL(`/c/${code}`, request.url)
    : token
      ? new URL(`/c/${token}`, request.url)
      : new URL(safeReturnPath(returnPath), request.url);

  for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
  const response = NextResponse.redirect(url);
  if (memberId) setMemberSession(response, memberId);
  clearOAuthCookies(response);
  return response;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("ld_claim")?.value ?? "";
  const code = cookieStore.get("ld_claim_code")?.value ?? "";
  const mode = cookieStore.get("ld_oauth_mode")?.value ?? (token || code ? "claim" : "connect");
  const returnPath = cookieStore.get("ld_oauth_return")?.value ?? "/";
  const expectedState = cookieStore.get("ld_oauth_state")?.value ?? "";
  const verifier = cookieStore.get("ld_oauth_verifier")?.value ?? "";
  const oauthCode = params.get("code") ?? "";
  const state = params.get("state") ?? "";

  const errorValues = (value: string) => token || code
    ? { oauth_error: value }
    : { blackbird_error: value };

  if (params.get("error")) {
    return finishRedirect(request, token, code, returnPath, errorValues("authorization_cancelled"));
  }

  if (!oauthCode || !verifier || !state || state !== expectedState) {
    return finishRedirect(request, token, code, returnPath, errorValues("invalid_oauth_state"));
  }

  let claim: RewardClaim | null = null;

  if (mode === "claim" || token || code) {
    if (code) {
      try {
        const dbClaim = await openLunchDrop(code);
        if (!dbClaim || dbClaim.status === "cancelled" || dbClaim.status === "expired" || !dbClaim.id || !dbClaim.locationId) {
          return finishRedirect(request, token, code, returnPath, errorValues("invalid_claim"));
        }

        if (dbClaim.status === "connected_claimed") {
          return finishRedirect(
            request,
            token,
            code,
            returnPath,
            { claimed: "1", reward: String(dbClaim.rewardId ?? "confirmed") },
          );
        }

        claim = dbClaim as RewardClaim;
      } catch {
        return finishRedirect(request, token, code, returnPath, errorValues("invalid_claim"));
      }
    } else if (token) {
      try {
        claim = verifyClaim(token);
      } catch {
        return finishRedirect(request, "", "", returnPath, { blackbird_error: "invalid_claim" });
      }
    } else {
      return finishRedirect(request, "", "", returnPath, { blackbird_error: "invalid_claim" });
    }
  }

  const exchangeBody: Record<string, string> = {
    grant_type: "authorization_code",
    code: oauthCode,
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

  if (!exchange.ok) {
    return finishRedirect(request, token, code, returnPath, errorValues(`token_exchange_${exchange.status}`));
  }

  const oauth = await exchange.json();
  const accessToken = oauth.access_token as string | undefined;
  if (!accessToken) {
    return finishRedirect(request, token, code, returnPath, errorValues("missing_access_token"));
  }

  const profileResponse = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return finishRedirect(request, token, code, returnPath, errorValues(`profile_${profileResponse.status}`));
  }

  const profile = await profileResponse.json();
  const userId = profile.id as string | undefined;
  if (!userId) {
    return finishRedirect(request, token, code, returnPath, errorValues("missing_member_id"));
  }

  if (!claim) {
    return finishRedirect(request, "", "", returnPath, { blackbird: "connected" }, userId);
  }

  const apiKey = process.env.FLYNET_API_KEY;
  if (!apiKey) {
    return finishRedirect(request, token, code, returnPath, { oauth_error: "rewards_not_configured" }, userId);
  }

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
  if (!rewardResponse.ok) {
    return finishRedirect(request, token, code, returnPath, { oauth_error: `reward_${rewardResponse.status}` }, userId);
  }
  if (reward.user_id && reward.user_id !== userId) {
    return finishRedirect(request, token, code, returnPath, { oauth_error: "already_claimed" }, userId);
  }

  const rewardId = String(reward.id ?? "confirmed");
  if (code) {
    try {
      await connectedClaimLunchDrop(code, rewardId);
    } catch {
      // Reward delivery already succeeded. Do not turn a successful reward into an error
      // just because receipt persistence is temporarily unavailable.
    }
  }

  return finishRedirect(
    request,
    token,
    code,
    returnPath,
    { claimed: "1", reward: rewardId },
    userId,
  );
}
