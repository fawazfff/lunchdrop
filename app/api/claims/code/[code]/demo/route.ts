import { NextResponse } from "next/server";
import { demoClaimLunchDrop } from "../../../../../lib/lunchdrop-db";
import { allowLunchDropRequest } from "../../../../../lib/rate-limit";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    if (!(await allowLunchDropRequest(request, "claim-demo", 30, 600))) {
      return NextResponse.json({ error: "Too many claim attempts. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": "600" } });
    }
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
