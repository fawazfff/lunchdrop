import { NextResponse } from "next/server";
import { demoClaimLunchDrop } from "../../../../../lib/lunchdrop-db";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const normalized = code.toUpperCase();
    if (!CODE.test(normalized)) return NextResponse.json({ error: "Invalid LunchDrop code" }, { status: 400 });

    const result = await demoClaimLunchDrop(normalized);
    if (!result) return NextResponse.json({ error: "LunchDrop is unavailable" }, { status: 410 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to complete demo claim" }, { status: 503 });
  }
}
