import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getCleanSupabaseUrl } from '@/lib/supabase/config'

export function createClient() {
  const supabaseUrl = getCleanSupabaseUrl()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
