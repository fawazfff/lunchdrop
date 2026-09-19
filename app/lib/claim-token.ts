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
  return createHmac("sha256", secret()).update(encoded).digest().subarray(0, 16).toString("base64url");
}

export function signClaim(payload: ClaimPayload) {
  const compact = [payload.id, payload.locationId, payload.recipient, payload.sender, payload.amount, payload.message, payload.special ?? "", Math.floor(payload.expiresAt / 1000)];
  const encoded = Buffer.from(JSON.stringify(compact)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyClaim(token: string): ClaimPayload {
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) throw new Error("Invalid claim link");
  const expected = signature(encoded);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Claim link was changed");
  const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as [string, string, string, string, number, string, string, number];
  const payload: ClaimPayload = { id: decoded[0], locationId: decoded[1], recipient: decoded[2], sender: decoded[3], amount: decoded[4], message: decoded[5], special: decoded[6] || undefined, createdAt: 0, expiresAt: decoded[7] * 1000 };
  if (payload.expiresAt < Date.now()) throw new Error("This claim link has expired");
  return payload;
}

