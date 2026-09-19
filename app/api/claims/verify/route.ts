import { NextResponse } from "next/server";
import { verifyClaim } from "../../../lib/claim-token";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing claim token" }, { status: 400 });
    return NextResponse.json({ claim: verifyClaim(token) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid claim link" }, { status: 400 });
  }
}

