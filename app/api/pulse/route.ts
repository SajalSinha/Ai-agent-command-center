import { NextRequest, NextResponse } from 'next/server';

/** Pulse: actually send messages to Telegram, Slack, or Discord */

type Channel = 'telegram' | 'slack' | 'discord';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, text, chatId } = body as { channel?: Channel; text?: string; chatId?: string };

    const message = typeof text === 'string' ? text.trim() : '';
    if (!message) {
      return NextResponse.json({ error: 'Missing or empty text' }, { status: 400 });
    }

    switch (channel) {
      case 'telegram': {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;
        if (!token) {
          return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 });
        }
        if (!targetChatId) {
          return NextResponse.json(
            { error: 'TELEGRAM_CHAT_ID not set. Message @BotFather, start your bot, then get chat ID (e.g. from /getids bot)' },
            { status: 400 }
          );
        }
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: message,
            disable_web_page_preview: true,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          return NextResponse.json({ error: data.description || 'Telegram API error', sent: false }, { status: 502 });
        }
        return NextResponse.json({ sent: true, channel: 'telegram' });
      }

      case 'slack': {
        const webhook = process.env.SLACK_WEBHOOK_URL;
        if (!webhook) {
          return NextResponse.json({ error: 'SLACK_WEBHOOK_URL not configured' }, { status: 503 });
        }
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message }),
        });
        if (!res.ok) {
          return NextResponse.json({ error: 'Slack webhook failed', sent: false }, { status: 502 });
        }
        return NextResponse.json({ sent: true, channel: 'slack' });
      }

      case 'discord': {
        const webhook = process.env.DISCORD_WEBHOOK_URL;
        if (!webhook) {
          return NextResponse.json({ error: 'DISCORD_WEBHOOK_URL not configured' }, { status: 503 });
        }
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message.slice(0, 2000),
          }),
        });
        if (!res.ok) {
          return NextResponse.json({ error: 'Discord webhook failed', sent: false }, { status: 502 });
        }
        return NextResponse.json({ sent: true, channel: 'discord' });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid channel. Use telegram, slack, or discord' },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    console.error('Pulse error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, sent: false }, { status: 500 });
  }
}
