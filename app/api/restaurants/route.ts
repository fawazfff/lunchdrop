import { NextResponse } from "next/server";

type FlynetLocation = {
  id: string;
  name: string;
  restaurant?: {
    id: string;
    name: string;
    cuisine?: string[];
    price?: number;
    asset?: { preview_1x?: string; web_2x?: string };
  };
  neighborhood?: { name?: string; region?: string };
};

let cache: { expiresAt: number; restaurants: unknown[] } | null = null;

export async function GET() {
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json({ restaurants: cache.restaurants, cached: true });
  }

  const apiKey = process.env.FLYNET_API_KEY;
  const apiBase = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";

  if (!apiKey) {
    return NextResponse.json({ error: "Flynet is not configured" }, { status: 503 });
  }

  try {
    const response = await fetch(`${apiBase}/locations?page=0&page_size=12`, {
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Flynet returned ${response.status}`);
    }

    const payload = await response.json();
    const locations: FlynetLocation[] = payload.locations ?? [];
    const seen = new Set<string>();
    const restaurants = locations
      .filter((location) => location.restaurant?.name && location.restaurant.asset?.web_2x)
      .filter((location) => {
        const key = `${location.restaurant?.id}:${location.neighborhood?.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((location) => ({
        id: location.restaurant!.id,
        locationId: location.id,
        name: location.restaurant!.name,
        location: location.name,
        neighborhood: location.neighborhood?.name ?? "Nearby",
        region: location.neighborhood?.region ?? "",
        cuisine: location.restaurant?.cuisine ?? [],
        image: location.restaurant?.asset?.web_2x ?? location.restaurant?.asset?.preview_1x ?? "",
        price: location.restaurant?.price ?? 2,
      }))
      .slice(0, 8);

    cache = { expiresAt: Date.now() + 30 * 60 * 1000, restaurants };
    return NextResponse.json({ restaurants, source: "flynet" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reach Flynet" },
      { status: 502 },
    );
  }
}
