import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await cookies();
  const memberId = store.get("ld_blackbird_member")?.value ?? "";
  return NextResponse.json({ connected: Boolean(memberId), memberId: memberId || undefined });
}

export async function POST() {
  const response = NextResponse.json({ connected: false });
  response.cookies.delete("ld_blackbird_member");
  return response;
}
