#!/bin/bash
# ─────────────────────────────────────────────
# Agent HQ — Deploy Script
# Run this after filling in your .env.local
# Usage: bash deploy.sh YOUR_GITHUB_USERNAME
# ─────────────────────────────────────────────

GITHUB_USER=${1:-"YOUR_USERNAME"}
REPO="agent-hq"

echo "🤖 Agent HQ — Deploy Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Init git
git init
git add .
git commit -m "🎖️ Initial Agent HQ deployment"

echo ""
echo "📡 Next steps:"
echo "1. Create a repo at: https://github.com/new"
echo "   Repo name: $REPO  (make it Public or Private)"
echo ""
echo "2. Then run:"
echo "   git remote add origin https://github.com/$GITHUB_USER/$REPO.git"
echo "   git push -u origin main"
echo ""
echo "3. Go to vercel.com → New Project → Import GitHub repo"
echo "4. Add env vars from your .env.local in Vercel dashboard"
echo "5. Deploy! 🚀"
echo ""
echo "🔑 Don't forget: Add all API keys to Vercel environment variables!"
