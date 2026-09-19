import { randomBytes } from "node:crypto";
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
    const requestedExpiry = Number(body.expiryDays ?? 7);
    const expiryDays = [1, 3, 7].includes(requestedExpiry) ? requestedExpiry : 7;
    if (!locationId || !recipient || !sender || !Number.isFinite(amount)) {
      return NextResponse.json({ error: "Please complete the gift details" }, { status: 400 });
    }
    const createdAt = Date.now();
    const claimId = randomBytes(8).toString("hex");
    const token = signClaim({ id: claimId, locationId, recipient, sender, amount, message, special, createdAt, expiresAt: createdAt + expiryDays * 24 * 60 * 60 * 1000 });
    return NextResponse.json({ url: `/c/${token}`, claimId });
  } catch {
    return NextResponse.json({ error: "Unable to create a secure claim link" }, { status: 500 });
  }
}

