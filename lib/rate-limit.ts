import { createAdminClient } from '@/lib/supabase/admin'

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: string
}

/**
 * Serverless-compatible Rate Limiter using atomic PostgreSQL function `increment_rate_limit`.
 * Executes an atomic `INSERT ... ON CONFLICT (key) DO UPDATE ... RETURNING count, reset_at`,
 * eliminating race conditions and avoiding any in-memory state.
 *
 * @param key Unique rate limit key (e.g., `video_token:${userId}`)
 * @param limit Maximum requests permitted in the window
 * @param windowSeconds Window length in seconds (default: 60 seconds)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const adminClient = createAdminClient()
  const fallbackReset = new Date(Date.now() + windowSeconds * 1000).toISOString()

  try {
    const { data, error } = await adminClient.rpc('increment_rate_limit', {
      p_key: key,
      p_window_seconds: windowSeconds,
    })

    if (error || !data || data.length === 0) {
      // In case RPC is not yet created during early testing, allow request
      return { success: true, remaining: 1, resetAt: fallbackReset }
    }

    const row = data[0]
    if (!row) {
      return { success: true, remaining: 1, resetAt: fallbackReset }
    }

    const currentCount = row.current_count
    const resetAt = row.reset_at

    return {
      success: currentCount <= limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt,
    }
  } catch {
    return { success: true, remaining: 1, resetAt: fallbackReset }
  }
}
