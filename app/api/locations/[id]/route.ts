import { NextResponse } from "next/server";

type FlynetLocation = {
  id: string;
  name: string;
  restaurant?: {
    name?: string;
    asset?: { preview_1x?: string; web_2x?: string };
  };
  neighborhood?: { name?: string };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const apiKey = process.env.FLYNET_API_KEY;
  const apiBase = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";

  if (!apiKey) return NextResponse.json({ error: "Flynet is not configured" }, { status: 503 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid location" }, { status: 400 });

  const response = await fetch(`${apiBase}/locations/${id}`, {
    headers: { "X-API-Key": apiKey },
    next: { revalidate: 1800 },
  });

  if (!response.ok) return NextResponse.json({ error: "Location unavailable" }, { status: response.status });

  const location: FlynetLocation = await response.json();
  return NextResponse.json({
    location: {
      name: location.restaurant?.name ?? "Blackbird restaurant",
      location: location.name,
      neighborhood: location.neighborhood?.name ?? "Nearby",
      image: location.restaurant?.asset?.web_2x ?? location.restaurant?.asset?.preview_1x ?? "",
    },
    source: "flynet",
  });
}
