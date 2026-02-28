import { NextRequest, NextResponse } from 'next/server';

// Blitz Agent — powered by API-Sports (free tier: 100 requests/day)
const SPORT_LEAGUE_MAP: Record<string, { sport: string; league: number; name: string }> = {
  nba: { sport: 'basketball', league: 12, name: 'NBA' },
  nfl: { sport: 'american-football', league: 1, name: 'NFL' },
  ipl: { sport: 'cricket', league: 2, name: 'IPL' },
  epl: { sport: 'football', league: 39, name: 'Premier League' },
  tennis: { sport: 'tennis', league: 1, name: 'ATP' },
};

export async function POST(req: NextRequest) {
  try {
    const { sport = 'nba', type = 'scores' } = await req.json();
    const apiKey = process.env.APISPORTS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'APISPORTS_API_KEY not configured' }, { status: 500 });

    const league = SPORT_LEAGUE_MAP[sport.toLowerCase()] ?? SPORT_LEAGUE_MAP['nba'];
    const today = new Date().toISOString().split('T')[0];

    const res = await fetch(
      `https://v1.${league.sport}.api-sports.io/games?league=${league.league}&season=2024&date=${today}`,
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': `v1.${league.sport}.api-sports.io` } }
    );

    const data = await res.json();
    const games = data.response ?? [];

    if (games.length === 0) {
      return NextResponse.json({ message: `No ${league.name} games today (${today}).`, games: [] });
    }

    return NextResponse.json({
      league: league.name,
      date: today,
      games: games.slice(0, 8).map((g: {
        teams: { home: { name: string }; visitors?: { name: string }; away?: { name: string } };
        scores?: { home: { points: number }; visitors?: { points: number }; away?: { points: number } };
        status: { long: string };
      }) => ({
        home: g.teams.home.name,
        away: g.teams.visitors?.name ?? g.teams.away?.name ?? 'TBD',
        home_score: g.scores?.home?.points ?? 0,
        away_score: g.scores?.visitors?.points ?? g.scores?.away?.points ?? 0,
        status: g.status?.long ?? 'Scheduled',
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
