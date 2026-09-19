import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyClaim } from "../../../../lib/claim-token";
import { openLunchDrop } from "../../../../lib/lunchdrop-db";
import { allowLunchDropRequest } from "../../../../lib/rate-limit";

const CLIENT_ID = process.env.FLYNET_CLIENT_ID ?? "19a0b552-ff8e-43de-b47a-bbc32ee0cd8a";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://lunchdrop.vercel.app/api/auth/blackbird/callback";
const AUTH_BASE = process.env.FLYNET_AUTH_BASE ?? "https://api.blackbird.xyz/oauth";
const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 300);
}

export async function GET(request: Request) {
  if (!(await allowLunchDropRequest(request, "blackbird-oauth-start", 40, 600))) {
    return NextResponse.json({ error: "Too many Blackbird sign-in attempts. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": "600" } });
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("t") ?? "";
  const code = (url.searchParams.get("c") ?? "").toUpperCase();
  const returnPath = safeReturnPath(url.searchParams.get("return"));

  if (code) {
    if (!CODE.test(code)) {
      return NextResponse.redirect(new URL("/claim?oauth_error=invalid_claim", request.url));
    }
    try {
      const claim = await openLunchDrop(code);
      if (!claim || claim.status === "cancelled" || claim.status === "expired") {
        return NextResponse.redirect(new URL(`/c/${code}?oauth_error=invalid_claim`, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL(`/c/${code}?oauth_error=invalid_claim`, request.url));
    }
  } else if (token) {
    try {
      verifyClaim(token);
    } catch {
      return NextResponse.redirect(new URL("/claim?oauth_error=invalid_claim", request.url));
    }
  }

  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(24).toString("base64url");
  const authorization = new URL(`${AUTH_BASE}/authorize`);
  authorization.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "read:profile read:wallets",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  const response = NextResponse.redirect(authorization);
  const options = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 10 * 60, path: "/api/auth/blackbird" };
  response.cookies.set("ld_oauth_state", state, options);
  response.cookies.set("ld_oauth_verifier", verifier, options);
  response.cookies.set("ld_oauth_mode", token || code ? "claim" : "connect", options);
  response.cookies.set("ld_oauth_return", returnPath, options);

  if (token) response.cookies.set("ld_claim", token, options);
  else response.cookies.delete("ld_claim");

  if (code) response.cookies.set("ld_claim_code", code, options);
  else response.cookies.delete("ld_claim_code");

  return response;
}
