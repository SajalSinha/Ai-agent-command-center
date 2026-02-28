import { NextRequest, NextResponse } from 'next/server';

// Scout Agent — powered by Tavily (free tier: 1000 searches/month)
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'No query provided' }, { status: 400 });

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 });

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      }),
    });

    const data = await res.json();
    return NextResponse.json({
      answer: data.answer,
      results: data.results?.map((r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 300),
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
