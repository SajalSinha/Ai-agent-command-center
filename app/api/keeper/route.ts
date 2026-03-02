import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const KEEPER_DIR = join(process.cwd(), '.keeper');

/** Keeper: save files, list storage. Creates .keeper/ in project root (gitignored). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, filename, content, mimeType } = body as {
      action?: string;
      filename?: string;
      content?: string;
      mimeType?: string;
    };

    await mkdir(KEEPER_DIR, { recursive: true });

    switch (action) {
      case 'save': {
        if (!filename || content === undefined) {
          return NextResponse.json(
            { error: 'save requires filename and content (string or base64)' },
            { status: 400 }
          );
        }
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
        const path = join(KEEPER_DIR, safeName);
        const buf = typeof content === 'string' && content.startsWith('data:')
          ? Buffer.from(content.split(',')[1], 'base64')
          : Buffer.from(content, 'utf8');
        await writeFile(path, buf);
        return NextResponse.json({
          ok: true,
          path: `.keeper/${safeName}`,
          filename: safeName,
          message: `Saved ${safeName}`,
        });
      }

      case 'list': {
        const entries = await readdir(KEEPER_DIR, { withFileTypes: true });
        const files = entries
          .filter((e) => e.isFile())
          .map((e) => ({ name: e.name }));
        return NextResponse.json({ ok: true, files });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use save or list' },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    console.error('Keeper error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
