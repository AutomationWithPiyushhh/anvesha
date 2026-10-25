import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types'

/**
 * Gets the current authenticated Supabase user on the server.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Gets the profile record for the currently logged in user.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Verifies if the current user has the 'admin' role.
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin'
}
