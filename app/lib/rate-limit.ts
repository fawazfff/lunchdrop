import "server-only";
import { createHmac } from "node:crypto";
import { consumeLunchDropRateLimit, lunchdropDbEnabled } from "./lunchdrop-db";

function clientFingerprint(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const realIp = request.headers.get("x-real-ip")?.trim() ?? "";
  const ip = forwarded || realIp || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 180) ?? "unknown";
  const secret =
    process.env.CLAIM_SIGNING_SECRET ??
    process.env.FLYNET_API_KEY ??
    "lunchdrop-rate-limit-v1";

  return createHmac("sha256", secret)
    .update(`${scope}|${ip}|${userAgent}`)
    .digest("hex");
}

export async function allowLunchDropRequest(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  if (!lunchdropDbEnabled()) return true;
  try {
    return await consumeLunchDropRateLimit(
      scope,
      clientFingerprint(request, scope),
      limit,
      windowSeconds,
    );
  } catch {
    // Rate limiting should fail open during a database incident so the demo remains usable.
    return true;
  }
}
