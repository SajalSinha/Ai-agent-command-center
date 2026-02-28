import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  oauth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

export async function POST(req: NextRequest) {
  try {
    const { query, maxResults = 8 } = await req.json();
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google OAuth not configured.' }, { status: 503 });
    }
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });
    const res = await drive.files.list({
      q: query ? `fullText contains '${query}' and trashed=false` : 'trashed=false',
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink, owners)',
      orderBy: 'modifiedTime desc',
    });
    const files = res.data.files ?? [];
    return NextResponse.json({
      files: files.map((f: { id?: string | null; name?: string | null; mimeType?: string | null; modifiedTime?: string | null; webViewLink?: string | null; owners?: Array<{ displayName?: string | null }> }) => ({
        id: f.id,
        name: f.name,
        type: f.mimeType?.split('.').pop() ?? 'file',
        modified: f.modifiedTime,
        link: f.webViewLink,
        owner: f.owners?.[0]?.displayName,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
