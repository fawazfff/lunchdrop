import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type ClaimPayload = {
  id: string;
  locationId: string;
  recipient: string;
  sender: string;
  amount: number;
  message: string;
  special?: string;
  createdAt: number;
  expiresAt: number;
};

function secret() {
  const value = process.env.CLAIM_SIGNING_SECRET ?? process.env.FLYNET_API_KEY;
  if (!value) throw new Error("Claim signing is not configured");
  return value;
}

function signature(encoded: string) {
  return createHmac("sha256", secret()).update(encoded).digest("base64url");
}

export function signClaim(payload: ClaimPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyClaim(token: string): ClaimPayload {
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) throw new Error("Invalid claim link");
  const expected = signature(encoded);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Claim link was changed");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ClaimPayload;
  if (payload.expiresAt < Date.now()) throw new Error("This claim link has expired");
  return payload;
}

