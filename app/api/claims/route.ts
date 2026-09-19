import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { signClaim } from "../../lib/claim-token";
import { allowLunchDropRequest } from "../../lib/rate-limit";
import {
  createLunchDrop,
  lunchdropDbEnabled,
  newClaimCode,
  newSenderSecret,
} from "../../lib/lunchdrop-db";

export async function POST(request: Request) {
  try {
    if (!(await allowLunchDropRequest(request, "claim-create", 12, 600))) {
      return NextResponse.json({ error: "Too many LunchDrops created. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": "600" } });
    }
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
    const expiresAt = new Date(createdAt + expiryDays * 24 * 60 * 60 * 1000);

    if (lunchdropDbEnabled()) {
      const senderKey = newSenderSecret();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = newClaimCode(7);
        try {
          const created = await createLunchDrop({
            code,
            locationId,
            recipient,
            sender,
            amount,
            message,
            special,
            expiresAt,
            senderSecret: senderKey,
          });

          return NextResponse.json({
            url: `/c/${created.code}`,
            claimId: created.id,
            code: created.code,
            senderKey,
            dbBacked: true,
          });
        } catch (error) {
          const text = error instanceof Error ? error.message : "";
          if (!text.includes("23505") && !text.toLowerCase().includes("duplicate")) {
            throw error;
          }
        }
      }

      return NextResponse.json({ error: "Unable to create a unique LunchDrop code" }, { status: 503 });
    }

    // Safe fallback if the database is temporarily unavailable or not configured.
    const claimId = randomBytes(8).toString("hex");
    const token = signClaim({
      id: claimId,
      locationId,
      recipient,
      sender,
      amount,
      message,
      special,
      createdAt,
      expiresAt: expiresAt.getTime(),
    });

    return NextResponse.json({
      url: `/c/${token}`,
      claimId,
      dbBacked: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error && error.message.includes("Supabase")
          ? "The LunchDrop database is temporarily unavailable. Please try again."
          : "Unable to create a secure claim link",
      },
      { status: 500 },
    );
  }
}
