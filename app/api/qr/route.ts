import { NextResponse } from "next/server";
import { qrSvg } from "../../lib/qr-code";

const CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/;

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const supplied = requestUrl.searchParams.get("url") ?? "";
    const target = new URL(supplied);

    if (target.origin !== requestUrl.origin) {
      return NextResponse.json({ error: "QR target must be a LunchDrop link" }, { status: 400 });
    }

    const match = target.pathname.match(/^\/c\/([^/]+)$/);
    if (!match || !CODE.test(match[1].toUpperCase())) {
      return NextResponse.json({ error: "QR target must be a short LunchDrop claim link" }, { status: 400 });
    }

    const svg = qrSvg(target.toString());
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to create QR code" }, { status: 400 });
  }
}
