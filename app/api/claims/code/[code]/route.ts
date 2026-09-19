import { NextResponse } from "next/server";
import { openLunchDrop } from "../../../../lib/lunchdrop-db";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
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
