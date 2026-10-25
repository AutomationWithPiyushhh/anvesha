import crypto from 'crypto'

export interface GenerateBunnyTokenOptions {
  bunnyVideoId: string
  expiresInSeconds?: number
  userIp?: string
}

export interface BunnyTokenResult {
  signedUrl: string
  embedUrl: string
  expires: number
  token: string
  tokenPath: string
}

/**
 * Generates official Bunny Stream token authentication URLs.
 * 
 * 1. embedUrl: Bunny Stream secure tokenized embed URL
 *    Format: https://iframe.mediadelivery.net/embed/{libraryId}/{bunnyVideoId}?token={token}&expires={expires}
 *    Algorithm: SHA256_HEX(security_key + bunnyVideoId + expires)
 * 
 * 2. signedUrl: Direct HLS streaming URL
 *    Format: https://{cdnHostname}/{bunnyVideoId}/playlist.m3u8?token={token}&expires={expires}
 *    Algorithm: SHA256_BASE64URL(security_key + '/{bunnyVideoId}/playlist.m3u8' + expires)
 */
export function generateBunnyToken({
  bunnyVideoId,
  expiresInSeconds = 3600,
  userIp = '',
}: GenerateBunnyTokenOptions): BunnyTokenResult {
  const securityKey = process.env.BUNNY_TOKEN_KEY
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME
  const libraryId = process.env.BUNNY_LIBRARY_ID || ''

  if (!securityKey || !cdnHostname) {
    throw new Error('Missing BUNNY_TOKEN_KEY or BUNNY_CDN_HOSTNAME environment variable')
  }

  const tokenPath = `/${bunnyVideoId}/`
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds

  // 1. Direct HLS token (SHA256 Base64URL)
  const hlsPath = `/${bunnyVideoId}/playlist.m3u8`
  const hashableHls = securityKey + hlsPath + expires + (userIp || '')
  const hashHls = crypto.createHash('sha256').update(hashableHls).digest('base64')
  const token = hashHls.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const signedUrl = `https://${cdnHostname}${hlsPath}?token=${token}&expires=${expires}`

  // 2. Bunny Stream Embed token (SHA256 Hex)
  const hashableEmbed = securityKey + bunnyVideoId + expires
  const embedToken = crypto.createHash('sha256').update(hashableEmbed).digest('hex')
  const embedUrl = libraryId
    ? `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?token=${embedToken}&expires=${expires}&autoplay=true`
    : ''

  return {
    signedUrl,
    embedUrl,
    expires,
    token,
    tokenPath,
  }
}

/**
 * Resolves relative child playlist or segment URLs.
 */
export function resolveSegmentUrl(basePlaylistUrl: string, relativeSegmentPath: string): string {
  const url = new URL(basePlaylistUrl)
  const pathname = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)
  url.pathname = pathname + relativeSegmentPath
  return url.toString()
}
