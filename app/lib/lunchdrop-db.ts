import "server-only";
import { createHash, randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://tmptcyapmmufkbvadroe.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export type DbLunchDrop = {
  id: string;
  code: string;
  location_id: string;
  recipient_name: string;
  sender_name: string;
  amount: number;
  message: string;
  special: string | null;
  chosen_location_id: string | null;
  status: "created" | "opened" | "demo_claimed" | "connected_claimed" | "cancelled";
  created_at: string;
  opened_at: string | null;
  demo_claimed_at: string | null;
  connected_claimed_at: string | null;
  expires_at: string;
  reward_id: string | null;
  sender_secret_hash: string;
};

export function lunchdropDbEnabled() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

function headers(extra?: HeadersInit) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!lunchdropDbEnabled()) throw new Error("LunchDrop database is not configured");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: headers(init?.headers),
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}: ${message.slice(0, 220)}`);
  }
  if (response.status === 204) return undefined as T;
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

export async function insertLunchDrop(input: {
  code: string;
  locationId: string;
  recipient: string;
  sender: string;
  amount: number;
  message: string;
  special?: string;
  expiresAt: Date;
  senderSecretHash: string;
}) {
  const rows = await rest<DbLunchDrop[]>("lunchdrops", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      code: input.code,
      location_id: input.locationId,
      recipient_name: input.recipient,
      sender_name: input.sender,
      amount: input.amount,
      message: input.message,
      special: input.special ?? null,
      expires_at: input.expiresAt.toISOString(),
      sender_secret_hash: input.senderSecretHash,
    }),
  });
  return rows[0];
}

export async function getLunchDropByCode(code: string) {
  const rows = await rest<DbLunchDrop[]>(
    `lunchdrops?code=eq.${encodeURIComponent(code)}&select=*`,
  );
  return rows[0] ?? null;
}

export async function updateLunchDropByCode(code: string, patch: Record<string, unknown>) {
  const rows = await rest<DbLunchDrop[]>(
    `lunchdrops?code=eq.${encodeURIComponent(code)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    },
  );
  return rows[0] ?? null;
}

export async function appendLunchDropEvent(
  lunchdropId: string,
  eventType: string,
  eventMeta: Record<string, unknown> = {},
) {
  await rest("lunchdrop_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      lunchdrop_id: lunchdropId,
      event_type: eventType,
      event_meta: eventMeta,
    }),
  });
}

export async function verifySenderKey(drop: DbLunchDrop, key: string) {
  if (!key) return false;
  return senderSecretHash(key) === drop.sender_secret_hash;
}
