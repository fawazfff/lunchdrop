import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyClaim } from "../../../../lib/claim-token";

const CLIENT_ID = process.env.FLYNET_CLIENT_ID ?? "19a0b552-ff8e-43de-b47a-bbc32ee0cd8a";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://lunchdrop.vercel.app/api/auth/blackbird/callback";
const AUTH_BASE = process.env.FLYNET_AUTH_BASE ?? "https://api.blackbird.xyz/oauth";

function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 300);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") ?? "";
  const returnPath = safeReturnPath(url.searchParams.get("return"));

  if (token) {
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
  response.cookies.set("ld_oauth_mode", token ? "claim" : "connect", options);
  response.cookies.set("ld_oauth_return", returnPath, options);
  if (token) response.cookies.set("ld_claim", token, options);
  else response.cookies.delete("ld_claim");
  return response;
}
