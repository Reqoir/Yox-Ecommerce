#!/usr/bin/env bash
# =============================================================================
# dev.sh — Start both server and client in parallel
# Requires: Node.js >= 18
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Starting YOX Ecommerce Dev Servers"
echo "======================================"
echo "  → Server: http://localhost:5000"
echo "  → Client: http://localhost:3000"
echo "  → Press Ctrl+C to stop all"
echo ""

# Start both servers and kill both on exit
trap 'kill %1 %2 2>/dev/null; exit 0' INT TERM

cd "$ROOT_DIR/server" && npm run dev &
cd "$ROOT_DIR/client" && npm run dev &

wait
