import { NextResponse } from "next/server";
import { cancelLunchDrop } from "../../../../../lib/lunchdrop-db";
import { allowLunchDropRequest } from "../../../../../lib/rate-limit";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    if (!(await allowLunchDropRequest(request, "claim-cancel", 15, 600))) {
      return NextResponse.json({ error: "Too many cancellation attempts. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": "600" } });
    }
    const { code } = await params;
    const normalized = code.toUpperCase();
    if (!CODE.test(normalized)) return NextResponse.json({ error: "Invalid LunchDrop code" }, { status: 400 });

    const body = await request.json();
    const senderKey = String(body.senderKey ?? "");
    if (senderKey.length < 20) return NextResponse.json({ error: "Missing sender key" }, { status: 401 });

    const result = await cancelLunchDrop(normalized, senderKey);
    if (!result) {
      return NextResponse.json({ error: "This LunchDrop can no longer be cancelled" }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to cancel LunchDrop" }, { status: 503 });
  }
}
