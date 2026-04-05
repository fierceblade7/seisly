// Global rate limiter using Upstash Redis.
// Enforces limits across all Vercel serverless instances.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

function msToWindow(ms: number): `${number} s` | `${number} m` | `${number} h` | `${number} d` {
  if (ms >= 24 * 60 * 60 * 1000) return `${Math.round(ms / (24 * 60 * 60 * 1000))} d` as `${number} d`
  if (ms >= 60 * 60 * 1000) return `${Math.round(ms / (60 * 60 * 1000))} h` as `${number} h`
  if (ms >= 60 * 1000) return `${Math.round(ms / (60 * 1000))} m` as `${number} m`
  return `${Math.round(ms / 1000)} s` as `${number} s`
}

/**
 * Create a rate limiter with the same API as the old in-memory version.
 * Uses Upstash Redis sliding window for global enforcement.
 */
export function rateLimit(options: {
  name: string
  maxRequests: number
  windowMs: number
}) {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.maxRequests, msToWindow(options.windowMs)),
    prefix: `seisly:ratelimit:${options.name}`,
    analytics: true,
  })

  return {
    async check(ip: string): Promise<{ success: boolean; remaining: number }> {
      try {
        const result = await limiter.limit(ip)
        return { success: result.success, remaining: result.remaining }
      } catch (err) {
        // If Redis is down, allow the request (fail open)
        console.error(`[Rate Limit] Redis error for ${options.name}:`, err)
        return { success: true, remaining: options.maxRequests }
      }
    },
  }
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown'
}
