export function getCleanSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}
