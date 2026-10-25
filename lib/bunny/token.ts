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
  tokenPath: string
}

/**
 * Generates an official Bunny CDN path-based directory token URL for HLS video streaming.
 *
 * Format:
 *   https://{BUNNY_CDN_HOSTNAME}/bcdn_token={token}&expires={expires}&token_path={encoded_token_path}/{bunnyVideoId}/playlist.m3u8
 *
 * Official Bunny CDN Signing Scheme:
 * 1. Directory token path: `/${bunnyVideoId}/` (ending with slash, covering playlists & segments).
 * 2. Hashable string includes security_key + token_path + expires (+ user_ip).
 * 3. Hashed using SHA-256 and formatted as Base64URL (no padding, url-safe).
 * 4. Embedded as a path-based prefix (/bcdn_token=...) so all relative .ts segments and child playlists
 *    automatically inherit the directory authorization without query string rewriting.
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

  // Token path covering the entire directory for the video
  const tokenPath = `/${bunnyVideoId}/`
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds

  // Official Bunny CDN hashable base string with token_path included
  const hashable = securityKey + tokenPath + expires + (userIp || '')
  const hash = crypto.createHash('sha256').update(hashable).digest('base64')
  const token = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  // Path-based directory token format (NOT a plain ?token= query string)
  const tokenPrefix = `bcdn_token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`
  const signedUrl = `https://${cdnHostname}/${tokenPrefix}/${bunnyVideoId}/playlist.m3u8`

  return {
    signedUrl,
    expires,
    token,
    tokenPath,
  }
}

/**
 * Resolves relative child playlist or segment URLs to verify that segments inherit the directory token.
 */
export function resolveSegmentUrl(basePlaylistUrl: string, relativeSegmentPath: string): string {
  const url = new URL(basePlaylistUrl)
  const pathname = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)
  url.pathname = pathname + relativeSegmentPath
  return url.toString()
}
