import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const { tokens } = await oauth2Client.getToken(code);
  // In production store these in a DB. For now we return them so you can add to .env.local
  return NextResponse.json({
    message: 'Copy these tokens into your .env.local file',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
}
