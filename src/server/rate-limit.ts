/**
 * In-memory fixed-window limiter for authentication endpoints.
 *
 * Only failed attempts are counted; a successful login clears the bucket.
 * This is intentionally process-local: with more than one app instance you
 * must move the counters to a shared store (e.g. Redis) behind this same API.
 */
interface Bucket {
  failures: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
/** Cap memory if an attacker sprays unique keys; expired buckets are pruned first. */
const MAX_BUCKETS = 10_000;

export interface RateLimitState {
  limited: boolean;
  retryAfterSec: number;
}

function prune(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/** True when `key` has already used up its failure budget in the current window. */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitState {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt || bucket.failures < limit) {
    return { limited: false, retryAfterSec: 0 };
  }
  return {
    limited: true,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Count one failed attempt; starts the window on the first failure. */
export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { failures: 1, resetAt: now + windowMs });
    return;
  }
  bucket.failures += 1;
}

/** Reset the failure budget after a successful authentication. */
export function clearFailures(key: string): void {
  buckets.delete(key);
}
