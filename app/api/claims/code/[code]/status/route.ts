import { NextResponse } from "next/server";
import { senderLunchDropStatus } from "../../../../../lib/lunchdrop-db";
import { allowLunchDropRequest } from "../../../../../lib/rate-limit";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    if (!(await allowLunchDropRequest(request, "claim-status", 240, 600))) {
      return NextResponse.json({ error: "Status checks are temporarily rate limited." }, { status: 429, headers: { "Retry-After": "60" } });
    }
    const { code } = await params;
    const normalized = code.toUpperCase();
    if (!CODE.test(normalized)) return NextResponse.json({ error: "Invalid LunchDrop code" }, { status: 400 });

    const body = await request.json();
    const senderKey = String(body.senderKey ?? "");
    if (senderKey.length < 20) return NextResponse.json({ error: "Missing sender key" }, { status: 401 });

    const status = await senderLunchDropStatus(normalized, senderKey);
    if (!status) return NextResponse.json({ error: "LunchDrop not found" }, { status: 404 });

    return NextResponse.json(status, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load LunchDrop status" }, { status: 503 });
  }
}
