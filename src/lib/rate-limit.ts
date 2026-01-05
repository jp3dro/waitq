type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const xf = headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; resetAt: number; retryAfterSec: number } {
  const now = Date.now();
  const cur = buckets.get(params.key);
  if (!cur || now >= cur.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + params.windowMs };
    buckets.set(params.key, next);
    return { ok: true, remaining: params.limit - 1, resetAt: next.resetAt, retryAfterSec: 0 };
  }

  if (cur.count >= params.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
    return { ok: false, remaining: 0, resetAt: cur.resetAt, retryAfterSec };
  }

  cur.count += 1;
  buckets.set(params.key, cur);
  return { ok: true, remaining: Math.max(0, params.limit - cur.count), resetAt: cur.resetAt, retryAfterSec: 0 };
}


