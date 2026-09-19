import { NextResponse } from "next/server";
import { saveLunchDropChoice } from "../../../../../lib/lunchdrop-db";

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
    const locationId = String(body.locationId ?? "").trim();
    if (!locationId || locationId.length > 100) {
      return NextResponse.json({ error: "Invalid restaurant choice" }, { status: 400 });
    }

    const result = await saveLunchDropChoice(normalized, locationId);
    if (!result) return NextResponse.json({ error: "LunchDrop is unavailable" }, { status: 410 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to save restaurant choice" }, { status: 503 });
  }
}
