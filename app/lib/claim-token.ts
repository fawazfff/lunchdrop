import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

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

function legacySignature(encoded: string) {
  return createHmac("sha256", secret()).update(encoded).digest().subarray(0, 16).toString("base64url");
}

function compactSignature(encoded: string) {
  return createHmac("sha256", secret()).update(encoded).digest().subarray(0, 12).toString("base64url");
}

function safeEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  return left.length === right.length && timingSafeEqual(left, right);
}

function uuidToBytes(value: string) {
  const normalized = value.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(normalized)) throw new Error("Invalid claim location");
  return Buffer.from(normalized, "hex");
}

function bytesToUuid(value: Buffer) {
  const hex = value.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function compactClaimId(value: string) {
  if (/^[0-9a-f]{16}$/i.test(value)) return Buffer.from(value, "hex");
  return createHash("sha256").update(value).digest().subarray(0, 8);
}

function encodeString(value: string) {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length > 65535) throw new Error("Claim text is too long");
  const length = Buffer.allocUnsafe(2);
  length.writeUInt16BE(bytes.length);
  return Buffer.concat([length, bytes]);
}

function decodeString(buffer: Buffer, offset: number) {
  if (offset + 2 > buffer.length) throw new Error("Invalid compact claim");
  const length = buffer.readUInt16BE(offset);
  const start = offset + 2;
  const end = start + length;
  if (end > buffer.length) throw new Error("Invalid compact claim");
  return { value: buffer.subarray(start, end).toString("utf8"), offset: end };
}

function signCompactClaim(payload: ClaimPayload) {
  const header = Buffer.allocUnsafe(30);
  let offset = 0;
  header.writeUInt8(2, offset);
  offset += 1;
  compactClaimId(payload.id).copy(header, offset);
  offset += 8;
  uuidToBytes(payload.locationId).copy(header, offset);
  offset += 16;
  header.writeUInt8(Math.min(255, Math.max(0, Math.round(payload.amount))), offset);
  offset += 1;
  header.writeUInt32BE(Math.floor(payload.expiresAt / 1000), offset);

  const body = Buffer.concat([
    header,
    encodeString(payload.recipient),
    encodeString(payload.sender),
    encodeString(payload.message),
    encodeString(payload.special ?? ""),
  ]);

  const encoded = body.toString("base64url");
  return `${encoded}.${compactSignature(encoded)}`;
}

function verifyCompactClaim(encoded: string, supplied: string, buffer: Buffer): ClaimPayload {
  const expected = compactSignature(encoded);
  if (!safeEqual(supplied, expected)) throw new Error("Claim link was changed");
  if (buffer.length < 30 || buffer.readUInt8(0) !== 2) throw new Error("Invalid compact claim");

  let offset = 1;
  const id = buffer.subarray(offset, offset + 8).toString("hex");
  offset += 8;
  const locationId = bytesToUuid(buffer.subarray(offset, offset + 16));
  offset += 16;
  const amount = buffer.readUInt8(offset);
  offset += 1;
  const expiresAt = buffer.readUInt32BE(offset) * 1000;
  offset += 4;

  const recipient = decodeString(buffer, offset);
  const sender = decodeString(buffer, recipient.offset);
  const message = decodeString(buffer, sender.offset);
  const special = decodeString(buffer, message.offset);

  const payload: ClaimPayload = {
    id,
    locationId,
    recipient: recipient.value,
    sender: sender.value,
    amount,
    message: message.value,
    special: special.value || undefined,
    createdAt: 0,
    expiresAt,
  };

  if (payload.expiresAt < Date.now()) throw new Error("This claim link has expired");
  return payload;
}

function verifyLegacyClaim(encoded: string, supplied: string): ClaimPayload {
  const expected = legacySignature(encoded);
  if (!safeEqual(supplied, expected)) throw new Error("Claim link was changed");

  const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as [string, string, string, string, number, string, string, number];
  const payload: ClaimPayload = {
    id: decoded[0],
    locationId: decoded[1],
    recipient: decoded[2],
    sender: decoded[3],
    amount: decoded[4],
    message: decoded[5],
    special: decoded[6] || undefined,
    createdAt: 0,
    expiresAt: decoded[7] * 1000,
  };

  if (payload.expiresAt < Date.now()) throw new Error("This claim link has expired");
  return payload;
}

export function signClaim(payload: ClaimPayload) {
  return signCompactClaim(payload);
}

export function verifyClaim(token: string): ClaimPayload {
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) throw new Error("Invalid claim link");

  const decoded = Buffer.from(encoded, "base64url");
  if (decoded.length > 0 && decoded.readUInt8(0) === 2) {
    return verifyCompactClaim(encoded, supplied, decoded);
  }

  return verifyLegacyClaim(encoded, supplied);
}
