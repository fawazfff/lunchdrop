import "server-only";
import { createHash, randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://tmptcyapmmufkbvadroe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_Yd6NumwfYZQEAFCy9iRSQQ_HHZmjhZ5";

export type DbLunchDrop = {
  id: string;
  code: string;
  locationId: string;
  recipient: string;
  sender: string;
  amount: number;
  message: string;
  special?: string;
  chosenLocationId?: string;
  status: "created" | "opened" | "demo_claimed" | "connected_claimed" | "cancelled" | "expired";
  createdAt: number;
  expiresAt: number;
  openedAt?: string;
  demoClaimedAt?: string;
  connectedClaimedAt?: string;
  rewardId?: string;
};

export function lunchdropDbEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function apiHeaders() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!lunchdropDbEnabled()) throw new Error("LunchDrop database is not configured");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}: ${message.slice(0, 220)}`);
  }
  return response.json() as Promise<T>;
}

export function senderSecretHash(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function newSenderSecret() {
  return randomBytes(24).toString("base64url");
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newClaimCode(length = 7) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export async function createLunchDrop(input: {
  code: string;
  locationId: string;
  recipient: string;
  sender: string;
  amount: number;
  message: string;
  special?: string;
  expiresAt: Date;
  senderSecret: string;
}) {
  return rpc<{ id: string; code: string; status: string; created_at: string; expires_at: string }>(
    "create_lunchdrop",
    {
      p_code: input.code,
      p_location_id: input.locationId,
      p_recipient_name: input.recipient,
      p_sender_name: input.sender,
      p_amount: input.amount,
      p_message: input.message,
      p_special: input.special ?? "",
      p_expires_at: input.expiresAt.toISOString(),
      p_sender_secret_hash: senderSecretHash(input.senderSecret),
    },
  );
}

export async function openLunchDrop(code: string) {
  return rpc<DbLunchDrop | null>("open_lunchdrop", { p_code: code.toUpperCase() });
}

export async function saveLunchDropChoice(code: string, locationId: string) {
  return rpc<{ code: string; chosenLocationId: string } | null>("set_lunchdrop_choice", {
    p_code: code.toUpperCase(),
    p_location_id: locationId,
  });
}

export async function demoClaimLunchDrop(code: string) {
  return rpc<{ code: string; status: string; demoClaimedAt: string } | null>("demo_claim_lunchdrop", {
    p_code: code.toUpperCase(),
  });
}

export async function connectedClaimLunchDrop(code: string, rewardId: string) {
  return rpc<{ code: string; status: string; connectedClaimedAt: string; rewardId: string } | null>(
    "connected_claim_lunchdrop",
    { p_code: code.toUpperCase(), p_reward_id: rewardId },
  );
}

export async function senderLunchDropStatus(code: string, senderSecret: string) {
  return rpc<{
    code: string;
    status: string;
    createdAt: string;
    openedAt?: string;
    demoClaimedAt?: string;
    connectedClaimedAt?: string;
    cancelledAt?: string;
    expiresAt: string;
    chosenLocationId?: string;
    rewardId?: string;
  } | null>("sender_lunchdrop_status", {
    p_code: code.toUpperCase(),
    p_sender_secret_hash: senderSecretHash(senderSecret),
  });
}

export async function cancelLunchDrop(code: string, senderSecret: string) {
  return rpc<{ code: string; status: string; cancelledAt: string } | null>("cancel_lunchdrop", {
    p_code: code.toUpperCase(),
    p_sender_secret_hash: senderSecretHash(senderSecret),
  });
}
