import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`/?auth=error&reason=${error}`)
  }

  if (!code) {
    return NextResponse.redirect('/?auth=error&reason=no_code')
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error)
    }

    // Store tokens in a cookie (in production use encrypted httpOnly cookies or a DB)
    const response = NextResponse.redirect(`/?auth=success`)
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expires_in,
      path: '/',
    })
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error: unknown) {
    console.error('Google OAuth callback error:', error)
    const message = error instanceof Error ? error.message : 'oauth_failed'
    return NextResponse.redirect(`/?auth=error&reason=${encodeURIComponent(message)}`)
  }
}
