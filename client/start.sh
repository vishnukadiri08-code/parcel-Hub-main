#!/bin/bash
# 1-Click Startup for Campus Parcel Hub
cd "$(dirname "$0")"

echo "=========================================="
echo "  CAMPUS PARCEL HUB — COMMAND CENTER"
echo "=========================================="

# Check if ports are already running
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
  echo "✓ Backend server is already running on http://localhost:5001"
else
  echo "→ Starting Backend Server..."
  node ../server/index.js &
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
  echo "✓ Frontend server is already running on http://localhost:3000"
else
  echo "→ Starting Vite Frontend..."
  npm run client &
fi

sleep 2
echo ""
echo "🚀 Campus Parcel Hub is Live:"
echo "👉 http://localhost:3000"
echo ""
open http://localhost:3000 2>/dev/null || true
