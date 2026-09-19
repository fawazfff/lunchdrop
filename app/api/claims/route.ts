import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { signClaim } from "../../lib/claim-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Math.min(100, Math.max(1, Math.round(Number(body.amount))));
    const locationId = String(body.locationId ?? "").trim();
    const recipient = String(body.recipient ?? "").trim().slice(0, 50);
    const sender = String(body.sender ?? "").trim().slice(0, 50);
    const message = String(body.message ?? "").trim().slice(0, 100);
    const special = String(body.special ?? "").trim().slice(0, 100) || undefined;
    if (!locationId || !recipient || !sender || !Number.isFinite(amount)) {
      return NextResponse.json({ error: "Please complete the gift details" }, { status: 400 });
    }
    const createdAt = Date.now();
    const claimId = randomUUID();
    const token = signClaim({ id: claimId, locationId, recipient, sender, amount, message, special, createdAt, expiresAt: createdAt + 7 * 24 * 60 * 60 * 1000 });
    return NextResponse.json({ url: `/claim?t=${encodeURIComponent(token)}`, claimId });
  } catch {
    return NextResponse.json({ error: "Unable to create a secure claim link" }, { status: 500 });
  }
}

