import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export const DEVICE_COOKIE_NAME = 'anvesha_device_id'

/**
 * Retrieves the device ID from the server-set httpOnly cookie.
 * Never accepts deviceId from client request body.
 */
export async function getDeviceId(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(DEVICE_COOKIE_NAME)
  return cookie?.value ?? null
}

/**
 * Gets the current device ID or generates and sets a new httpOnly cookie.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(DEVICE_COOKIE_NAME)

  if (existing?.value) {
    return existing.value
  }

  const newDeviceId = crypto.randomUUID()
  cookieStore.set(DEVICE_COOKIE_NAME, newDeviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  return newDeviceId
}

export type RegisterDeviceResult =
  | { success: true; deviceId: string }
  | { success: false; error: 'DEVICE_LIMIT_REACHED'; message: string }
  | { success: false; error: 'INTERNAL_ERROR'; message: string }

/**
 * Registers a student device using the service-role client.
 * Enforces the max 2 devices per account rule.
 */
export async function registerDevice(
  userId: string,
  userAgent?: string | null
): Promise<RegisterDeviceResult> {
  const adminClient = createAdminClient()
  const deviceId = await getOrCreateDeviceId()

  // 1. Check existing sessions for this user
  const { data: sessions, error: fetchError } = await adminClient
    .from('sessions')
    .select('device_id')
    .eq('user_id', userId)

  if (fetchError) {
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to inspect registered devices.',
    }
  }

  const isAlreadyRegistered = sessions?.some((s) => s.device_id === deviceId)

  if (isAlreadyRegistered) {
    // Update last_active
    await adminClient
      .from('sessions')
      .update({
        last_active: new Date().toISOString(),
        user_agent: userAgent ?? null,
      })
      .eq('user_id', userId)
      .eq('device_id', deviceId)

    return { success: true, deviceId }
  }

  // 2. Check if device limit (max 2) is reached
  if ((sessions?.length ?? 0) >= 2) {
    return {
      success: false,
      error: 'DEVICE_LIMIT_REACHED',
      message:
        'Device limit reached (max 2 devices). Please contact your instructor to reset your devices.',
    }
  }

  // 3. Register the new device
  const { error: insertError } = await adminClient.from('sessions').insert({
    user_id: userId,
    device_id: deviceId,
    last_active: new Date().toISOString(),
    user_agent: userAgent ?? null,
  })

  if (insertError) {
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to register this device.',
    }
  }

  return { success: true, deviceId }
}
