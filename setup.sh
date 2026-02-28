#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Agent HQ — GitHub Setup Script
#  Run this ONCE inside the agent-hq folder after downloading it
# ─────────────────────────────────────────────────────────────

set -e  # Exit on any error

echo ""
echo "🎖️  Agent HQ — GitHub Setup"
echo "════════════════════════════"
echo ""

# 1. Check git is installed
if ! command -v git &> /dev/null; then
  echo "❌ git is not installed. Install it from https://git-scm.com"
  exit 1
fi

# 2. Ask for GitHub repo URL
echo "📋 Step 1: Create a new repo at https://github.com/new"
echo "   Name it: agent-hq"
echo "   Set it to Public or Private (your choice)"
echo "   Do NOT initialize with README (we have one already)"
echo ""
read -p "📎 Paste your GitHub repo URL (e.g. https://github.com/yourname/agent-hq): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "❌ No URL provided. Exiting."
  exit 1
fi

# 3. Copy env example
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local — fill in your API keys before running npm run dev"
fi

# 4. Git init & push
echo ""
echo "🚀 Initializing git and pushing to GitHub..."
git init
git add .
git commit -m "🎖️ Initial commit — Agent HQ with Max Squad Leader"
git branch -M main
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "════════════════════════════════════════════════"
echo "✅  Code pushed to GitHub successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Fill in .env.local with your API keys"
echo "     (see README.md for where to get each key)"
echo ""
echo "  2. Deploy to Vercel:"
echo "     → Go to https://vercel.com/new"
echo "     → Import your agent-hq repo"
echo "     → Add all env vars from .env.local"
echo "     → Click Deploy 🚀"
echo ""
echo "  3. Update GOOGLE_REDIRECT_URI in Vercel to:"
echo "     https://your-app.vercel.app/api/auth/google/callback"
echo ""
echo "  4. Also add that URL to Google Cloud Console"
echo "     → APIs & Services → Credentials → Your OAuth App"
echo "     → Authorized redirect URIs"
echo ""
echo "════════════════════════════════════════════════"
