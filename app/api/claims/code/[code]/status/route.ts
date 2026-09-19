import { NextResponse } from "next/server";
import { senderLunchDropStatus } from "../../../../../lib/lunchdrop-db";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
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
