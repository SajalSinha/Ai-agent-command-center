# 🎖️ Agent HQ — Your Personal AI Squad

A full-stack Next.js app with **Max** as your Squad Leader, backed by **9 specialist AI agents** powered by Groq (free LLM), with real integrations for Gmail, Google Drive, web search, weather, and sports.

## 🤖 The Team

| Agent | Power | Integration |
|-------|-------|-------------|
| **Max** | Squad Leader / Orchestrator | Groq LLaMA 3.3 70B |
| **Aria** | Email Agent | Gmail API (OAuth2) |
| **Dex** | Drive Agent | Google Drive API |
| **Nova** | Design Agent | Canva / Figma (described) |
| **Scout** | Research Agent | Tavily Search API |
| **Voyage** | Travel + Weather | OpenWeatherMap API |
| **Blitz** | Sports Agent | API-Sports |
| **Quill** | Writer Agent | Groq LLM |
| **Byte** | Code Agent | Groq LLM |
| **Forge** | Document Agent | Groq LLM |

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/agent-hq.git
cd agent-hq
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Then fill in your API keys (see **Getting API Keys** below).

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔑 Getting Your API Keys (all free)

### Groq — LLM Brain (FREE)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → API Keys → Create new key
3. Add to `.env.local`: `GROQ_API_KEY=gsk_...`

### Tavily — Web Search (FREE · 1000 searches/month)
1. Go to [app.tavily.com](https://app.tavily.com)
2. Sign up → copy your API key
3. Add: `TAVILY_API_KEY=tvly-...`

### OpenWeatherMap — Weather (FREE · 1M calls/month)
1. Go to [openweathermap.org/api](https://openweathermap.org/api)
2. Sign up → API Keys tab → copy default key
3. Add: `OPENWEATHER_API_KEY=...`

### API-Sports — Sports (FREE · 100 req/day)
1. Go to [api-sports.io](https://api-sports.io)
2. Sign up → Dashboard → copy your key
3. Add: `APISPORTS_API_KEY=...`

### Google (Gmail + Drive) — OAuth2 (FREE)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "agent-hq")
3. Enable APIs: **Gmail API** and **Google Drive API**
4. Go to **Credentials** → Create Credentials → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:3000/api/auth/callback`
7. Copy Client ID and Client Secret to `.env.local`
8. **Authorize your account** (one-time):
   - Run the app locally
   - Visit `http://localhost:3000/api/auth/google`
   - Sign in and approve permissions
   - You'll get `access_token` and `refresh_token` in the response
   - Copy both to `.env.local`

---

## ☁️ Deploy to Vercel

### One-click method:
1. Push to GitHub (see commands below)
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add all environment variables in Vercel dashboard under **Settings → Environment Variables**
4. For Google OAuth on prod: add `https://your-app.vercel.app/api/auth/callback` to Google Cloud Console → Authorized redirect URIs
5. Update `GOOGLE_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` in Vercel env vars
6. Click **Deploy** 🚀

### Push commands:
```bash
git init
git add .
git commit -m "🎖️ Initial Agent HQ deployment"
git remote add origin https://github.com/YOUR_USERNAME/agent-hq.git
git push -u origin main
```

---

## 🗂️ Project Structure

```
agent-hq/
├── app/
│   ├── page.tsx              ← Main UI (Max + all agents)
│   ├── layout.tsx            ← App layout + fonts
│   ├── globals.css           ← Base styles
│   └── api/
│       ├── chat/route.ts     ← Max (Groq LLaMA)
│       ├── search/route.ts   ← Scout (Tavily)
│       ├── weather/route.ts  ← Voyage (OpenWeatherMap)
│       ├── sports/route.ts   ← Blitz (API-Sports)
│       ├── gmail/route.ts    ← Aria (Gmail)
│       ├── drive/route.ts    ← Dex (Google Drive)
│       └── auth/
│           ├── google/       ← OAuth init
│           └── callback/     ← OAuth token exchange
├── lib/
│   └── agents.ts             ← Agent configs + Max system prompt
├── .env.local.example        ← Copy → .env.local, fill keys
├── .gitignore                ← .env.local is excluded ✅
└── README.md
```

---

## 💡 Tips

- **Without API keys**: Max still works for writing, coding, planning tasks (Groq only)
- **Free tier limits**: All services above have generous free tiers for personal use
- **Groq model**: Using `llama-3.3-70b-versatile` — fastest and smartest free model available
- **Adding agents**: Add new routes in `app/api/` and update `runTools()` in `page.tsx`
