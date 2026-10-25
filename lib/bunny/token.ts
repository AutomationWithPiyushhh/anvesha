import crypto from 'crypto'

export interface GenerateBunnyTokenOptions {
  bunnyVideoId: string
  expiresInSeconds?: number
  userIp?: string
}

export interface BunnyTokenResult {
  signedUrl: string
  expires: number
  token: string
}

/**
 * Generates an official Bunny CDN directory-level token-authenticated HLS playback URL.
 *
 * Algorithm from official Bunny CDN Token Authentication:
 * 1. Base hashable string: security_token + path + expires + (ip || '')
 * 2. Hash using SHA-256 and convert to Base64
 * 3. Format as Base64URL (replace '+' with '-', '/' with '_', strip trailing '=')
 * 4. For HLS directory tokens, path is `/${bunnyVideoId}/` with `token_path` parameter.
 *    This authorizes the master playlist.m3u8 AND all nested variant playlists and video segments.
 */
export function generateBunnyToken({
  bunnyVideoId,
  expiresInSeconds = 3600,
  userIp = '',
}: GenerateBunnyTokenOptions): BunnyTokenResult {
  const securityKey = process.env.BUNNY_TOKEN_KEY
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME

  if (!securityKey || !cdnHostname) {
    throw new Error('Missing BUNNY_TOKEN_KEY or BUNNY_CDN_HOSTNAME environment variable')
  }

  // Directory path ending with a slash
  const directoryPath = `/${bunnyVideoId}/`
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds

  // Official Bunny CDN hash calculation
  const hashable = securityKey + directoryPath + expires + (userIp || '')
  const hash = crypto.createHash('sha256').update(hashable).digest('base64')
  const token = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  // Query parameter token format with directory token_path
  const queryParams = new URLSearchParams({
    token,
    expires: expires.toString(),
    token_path: directoryPath,
  })

  const signedUrl = `https://${cdnHostname}/${bunnyVideoId}/playlist.m3u8?${queryParams.toString()}`

  return {
    signedUrl,
    expires,
    token,
  }
}
