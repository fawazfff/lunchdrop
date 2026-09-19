import { NextResponse } from "next/server";
import { openLunchDrop } from "../../../../lib/lunchdrop-db";
import { allowLunchDropRequest } from "../../../../lib/rate-limit";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    if (!(await allowLunchDropRequest(request, "claim-open", 180, 600))) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429, headers: { "Retry-After": "60" } });
    }
    const { code } = await params;
    const normalized = code.toUpperCase();
    if (!CODE.test(normalized)) {
      return NextResponse.json({ error: "Invalid LunchDrop code" }, { status: 400 });
    }

    const claim = await openLunchDrop(normalized);
    if (!claim) return NextResponse.json({ error: "LunchDrop not found" }, { status: 404 });
    if (claim.status === "expired") return NextResponse.json({ error: "This LunchDrop has expired", claim }, { status: 410 });
    if (claim.status === "cancelled") return NextResponse.json({ error: "This LunchDrop was cancelled", claim }, { status: 410 });

    return NextResponse.json({ claim, source: "supabase" }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to open this LunchDrop" }, { status: 503 });
  }
}
