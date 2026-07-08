#!/usr/bin/env bash
# =============================================================================
# setup.sh — Install all project dependencies
# Run once after cloning the repo.
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔧 YOX Ecommerce — Project Setup"
echo "================================="

# ─── Server ──────────────────────────────────────────────────────────────────
echo ""
echo "📦 Installing server dependencies..."
cd "$ROOT_DIR/server"
npm install

# Create .env from .env.example if it doesn't exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "📋 Created server/.env from .env.example — please fill in your values."
fi

# ─── Client ──────────────────────────────────────────────────────────────────
echo ""
echo "📦 Installing client dependencies..."
cd "$ROOT_DIR/client"
npm install

# Create .env.local from .env.example if it doesn't exist
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "📋 Created client/.env.local from .env.example."
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in server/.env with your credentials"
echo "  2. Run: bash scripts/dev.sh"
