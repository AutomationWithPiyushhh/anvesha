import { createAdminClient } from '@/lib/supabase/admin'

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: string
}

/**
 * Serverless-compatible Rate Limiter using Supabase `rate_limits` table.
 * Avoids any in-memory state so it persists reliably across serverless instances without external Redis.
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
  const now = new Date()

  const { data: record, error: fetchError } = await adminClient
    .from('rate_limits')
    .select('key, count, reset_at')
    .eq('key', key)
    .maybeSingle()

  if (fetchError) {
    // If rate limit check fails due to DB error, allow request but log quietly
    return { success: true, remaining: 1, resetAt: now.toISOString() }
  }

  // If no record exists or window has expired, reset window
  if (!record || now >= new Date(record.reset_at)) {
    const resetAt = new Date(now.getTime() + windowSeconds * 1000).toISOString()
    await adminClient.from('rate_limits').upsert({
      key,
      count: 1,
      reset_at: resetAt,
    })

    return {
      success: true,
      remaining: limit - 1,
      resetAt,
    }
  }

  // Window is still active: check if limit reached
  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.reset_at,
    }
  }

  // Increment count
  const updatedCount = record.count + 1
  await adminClient
    .from('rate_limits')
    .update({ count: updatedCount })
    .eq('key', key)

  return {
    success: true,
    remaining: Math.max(0, limit - updatedCount),
    resetAt: record.reset_at,
  }
}
