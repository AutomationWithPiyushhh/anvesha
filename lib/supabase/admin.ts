import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Service Role Client (Server-only).
 * Bypasses RLS for server-side device management, heartbeats, admin actions, and token minting.
 * NEVER import this into client components or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must never be invoked on the client side.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
