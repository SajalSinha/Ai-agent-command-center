import { NextRequest, NextResponse } from 'next/server';

// Voyage Agent (Weather) — powered by OpenWeatherMap free tier
export async function POST(req: NextRequest) {
  try {
    const { city } = await req.json();
    if (!city) return NextResponse.json({ error: 'No city provided' }, { status: 400 });

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENWEATHER_API_KEY not configured' }, { status: 500 });

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&cnt=8`),
    ]);

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    if (current.cod !== 200) {
      return NextResponse.json({ error: `City not found: ${city}` }, { status: 404 });
    }

    return NextResponse.json({
      city: current.name,
      country: current.sys.country,
      temp: Math.round(current.main.temp),
      feels_like: Math.round(current.main.feels_like),
      description: current.weather[0].description,
      humidity: current.main.humidity,
      wind_speed: current.wind.speed,
      icon: current.weather[0].icon,
      forecast: forecast.list?.map((f: { dt_txt: string; main: { temp: number }; weather: Array<{ description: string }> }) => ({
        time: f.dt_txt,
        temp: Math.round(f.main.temp),
        description: f.weather[0].description,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
