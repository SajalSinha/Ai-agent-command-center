import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Aria Agent — Gmail read access (OAuth2)
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
    const { action, query = 'is:unread', maxResults = 10 } = await req.json();

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google OAuth not configured. See SETUP.md.' }, { status: 503 });
    }

    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    if (action === 'list') {
      const list = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = list.data.messages ?? [];
      const details = await Promise.all(
        messages.slice(0, 6).map(async (m) => {
          const msg = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date'] });
          const headers = msg.data.payload?.headers ?? [];
          const get = (name: string) => headers.find(h => h.name === name)?.value ?? '';
          return { id: m.id, subject: get('Subject'), from: get('From'), date: get('Date'), snippet: msg.data.snippet };
        })
      );

      return NextResponse.json({ emails: details, total: list.data.resultSizeEstimate });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
