import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const apiKey = process.env.FLYNET_API_KEY;
  const apiBase = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";

  if (!apiKey) return NextResponse.json({ error: "Flynet is not configured" }, { status: 503 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid restaurant" }, { status: 400 });

  const response = await fetch(`${apiBase}/specials?restaurant=${id}&page=0&page_size=50`, {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 3600 },
  });

  if (!response.ok) return NextResponse.json({ specials: [], source: "flynet", unavailable: true });
  const payload = await response.json();
  return NextResponse.json({ specials: payload.specials ?? [], source: "flynet", cacheMinutes: 60 });
}
