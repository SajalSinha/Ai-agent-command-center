# ⚡ Quick Setup Checklist

Copy this checklist as you set up Agent HQ.

## Step 1 — Local Setup
- [ ] `npm install` in the project folder
- [ ] Copy `.env.local.example` → `.env.local`

## Step 2 — API Keys (get in this order, easiest first)
- [ ] **Groq** → [console.groq.com](https://console.groq.com) → `GROQ_API_KEY`
- [ ] **Tavily** → [app.tavily.com](https://app.tavily.com) → `TAVILY_API_KEY`
- [ ] **OpenWeatherMap** → [openweathermap.org/api](https://openweathermap.org/api) → `OPENWEATHER_API_KEY`
- [ ] **API-Sports** → [api-sports.io](https://api-sports.io) → `APISPORTS_API_KEY`
- [ ] **Google OAuth** → [console.cloud.google.com](https://console.cloud.google.com)
  - [ ] New project → Enable Gmail API + Drive API
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add redirect URI: `http://localhost:3000/api/auth/callback`
  - [ ] Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - [ ] Run `npm run dev`, visit `/api/auth/google`, copy tokens to `.env.local`

## Step 3 — Test locally
- [ ] `npm run dev` → open http://localhost:3000
- [ ] Chat with Max: "What's the weather in Mumbai?"
- [ ] Chat with Max: "Search for latest AI news"
- [ ] Chat with Max: "Check my unread emails"

## Step 4 — Deploy to Vercel
- [ ] Push code to GitHub (see commands in README)
- [ ] Import repo at vercel.com → New Project
- [ ] Add ALL env vars in Vercel dashboard
- [ ] Add production redirect URI to Google Cloud Console
- [ ] Deploy! 🚀

## Env vars needed in Vercel
```
GROQ_API_KEY
TAVILY_API_KEY
OPENWEATHER_API_KEY
APISPORTS_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
GOOGLE_ACCESS_TOKEN
GOOGLE_REFRESH_TOKEN
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
