// WARNING: Per-instance in-memory rate limiter.
// This does NOT work globally across Vercel serverless instances.
// Each cold start creates a fresh Map, and concurrent instances
// each have their own independent rate limit state.
//
// TODO: For production scale, replace with Redis-based rate limiting
// (e.g. @upstash/ratelimit with Upstash Redis) to enforce limits
// globally across all instances.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  return stores.get(name)!
}

export function rateLimit(options: {
  name: string
  maxRequests: number
  windowMs: number
}) {
  const store = getStore(options.name)

  return {
    check(ip: string): { success: boolean; remaining: number } {
      const now = Date.now()
      const entry = store.get(ip)

      // Clean up expired entries periodically
      if (store.size > 10000) {
        for (const [key, val] of store) {
          if (val.resetAt <= now) store.delete(key)
        }
      }

      if (!entry || entry.resetAt <= now) {
        store.set(ip, { count: 1, resetAt: now + options.windowMs })
        return { success: true, remaining: options.maxRequests - 1 }
      }

      if (entry.count >= options.maxRequests) {
        return { success: false, remaining: 0 }
      }

      entry.count++
      return { success: true, remaining: options.maxRequests - entry.count }
    },
  }
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown'
}
