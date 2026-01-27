import { NextRequest, NextResponse } from 'next/server'

/**
 * Runtime Configuration Endpoint
 *
 * This endpoint provides server-side environment variables to the client at runtime.
 * This solves the NEXT_PUBLIC_* limitation where variables are baked into the build.
 *
 * Environment Variables:
 * - API_URL: Where the browser/client should make API requests (public/external URL)
 *   - If empty or not set: Returns '' (empty string) so frontend uses relative /api/* paths
 *   - If set to a URL: Returns that URL for direct API access
 * - INTERNAL_API_URL: Where Next.js server-side should proxy API requests (internal URL)
 *   Default: http://localhost:5055 (used by Next.js rewrites in next.config.ts)
 *
 * For Cloudflare Tunnel / Reverse Proxy:
 * - Leave API_URL empty so frontend uses relative URLs
 * - Next.js rewrites will proxy /api/* to INTERNAL_API_URL
 * - This works because the tunnel only exposes the frontend port (8080)
 *
 * This allows the same Docker image to work in different deployment scenarios.
 */
export async function GET(request: NextRequest) {
  // Check if API_URL is explicitly set (and not empty)
  const envApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

  if (envApiUrl && envApiUrl.trim() !== '') {
    console.log('[runtime-config] Using explicit API_URL:', envApiUrl)
    return NextResponse.json({
      apiUrl: envApiUrl,
    })
  }

  // For Cloudflare Tunnel / reverse proxy setups, use empty string
  // This tells the frontend to use relative URLs (/api/*) which Next.js rewrites will proxy
  // This is the recommended setup for tunnels and reverse proxies
  console.log('[runtime-config] Using relative API path (empty string) for tunnel/proxy compatibility')
  return NextResponse.json({
    apiUrl: '',
  })
}

