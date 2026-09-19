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
  payments_enabled?: boolean;
};

type Restaurant = {
  id: string;
  locationId: string;
  name: string;
  location: string;
  neighborhood: string;
  region: string;
  cuisine: string[];
  image: string;
  price: number;
  paymentsEnabled: boolean;
};

let cache: { expiresAt: number; restaurants: Restaurant[] } | null = null;

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city") ?? "New York, NY";
  const formatResponse = (restaurants: Restaurant[], cached = false) => {
    const cities = [...new Set(restaurants.map((restaurant) => restaurant.region).filter(Boolean))].sort();
    return NextResponse.json({
      restaurants: restaurants.filter((restaurant) => restaurant.region === city),
      cities,
      city,
      cached,
      cacheMinutes: 60,
      source: "flynet",
    });
  };

  if (cache && cache.expiresAt > Date.now()) return formatResponse(cache.restaurants, true);

  const apiKey = process.env.FLYNET_API_KEY;
  const apiBase = process.env.FLYNET_API_BASE ?? "https://api.blackbird.xyz/flynet/v1";

  if (!apiKey) {
    return NextResponse.json({ error: "Flynet is not configured" }, { status: 503 });
  }

  try {
    const firstResponse = await fetch(`${apiBase}/locations?page=0&page_size=100`, {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 3600 },
    });

    if (!firstResponse.ok) {
      throw new Error(`Flynet returned ${firstResponse.status}`);
    }

    const firstPayload = await firstResponse.json();
    const totalPages = Math.min(firstPayload.pagination?.total_pages ?? 1, 10);
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
        fetch(`${apiBase}/locations?page=${index + 1}&page_size=100`, {
          headers: { "X-API-Key": apiKey },
          next: { revalidate: 3600 },
        }).then((response) => response.ok ? response.json() : { locations: [] }),
      ),
    );
    const locations: FlynetLocation[] = [
      ...(firstPayload.locations ?? []),
      ...remainingPages.flatMap((payload) => payload.locations ?? []),
    ];
    const seen = new Set<string>();
    const restaurants: Restaurant[] = locations
      .filter((location) => location.restaurant?.name && location.restaurant.asset?.web_2x)
      .filter((location) => {
        const key = location.id;
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
        paymentsEnabled: location.payments_enabled ?? false,
      }))

    cache = { expiresAt: Date.now() + 60 * 60 * 1000, restaurants };
    return formatResponse(restaurants);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reach Flynet" },
      { status: 502 },
    );
  }
}
