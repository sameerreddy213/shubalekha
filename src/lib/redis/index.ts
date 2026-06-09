import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  _redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

/** Build a rate limiter, or null when Redis is not configured. */
function makeLimiter(requests: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window) });
}

// Lazily-initialized limiters per route class (matches API contract rate classes)
let _limiters: Record<string, Ratelimit | null> | null = null;

function getLimiters() {
  if (_limiters) return _limiters;
  _limiters = {
    check:    makeLimiter(20, "1 m"),  // slug check
    read:     makeLimiter(60, "1 m"),  // list/get
    write:    makeLimiter(30, "1 m"),  // mutations
    rsvp:     makeLimiter(5,  "1 m"),  // RSVP submit (per IP)
    guestbook:makeLimiter(3,  "1 m"),  // guestbook
    beacon:   makeLimiter(60, "1 m"),  // analytics collect
    upload:   makeLimiter(30, "1 m"),  // presigned uploads
    exportCsv:makeLimiter(3,  "1 m"),  // RSVP CSV export
  };
  return _limiters;
}

/**
 * Check a rate limit. Returns `{ success: true }` when Redis is not configured
 * (graceful degradation — don't block on missing keys).
 */
export async function rateLimit(
  cls: keyof ReturnType<typeof getLimiters>,
  key: string,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = getLimiters()[cls];
  if (!limiter) return { success: true, limit: 999, remaining: 999, reset: 0 };
  return limiter.limit(key);
}

// Redis helpers for slug soft-lock during publish

const SLUG_LOCK_TTL = 30; // seconds

export async function acquireSlugLock(slug: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // no Redis → optimistically allow
  const key = `sluglock:${slug}`;
  const result = await redis.set(key, "1", { ex: SLUG_LOCK_TTL, nx: true });
  return result === "OK";
}

export async function releaseSlugLock(slug: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`sluglock:${slug}`);
}

export async function isSlugLocked(slug: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const val = await redis.get(`sluglock:${slug}`);
  return val !== null;
}

/**
 * Record a page view for an invite.
 * - HyperLogLog key `views:{inviteId}:{day}` for unique visitor estimation
 * - Raw counter `viewcount:{inviteId}:{day}` for total views
 * - `analytics:pending` set tracks which inviteId:day pairs need flushing to Mongo
 */
export async function bufferView(inviteId: string, visitorHash: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const day = new Date().toISOString().slice(0, 10);
  const hllKey   = `views:${inviteId}:${day}`;
  const countKey = `viewcount:${inviteId}:${day}`;

  await Promise.all([
    redis.pfadd(hllKey, visitorHash),
    redis.expire(hllKey, 48 * 60 * 60),       // 48 h TTL
    redis.incr(countKey),
    redis.expire(countKey, 48 * 60 * 60),
    redis.sadd("analytics:pending", `${inviteId}:${day}`),
  ]);
}
