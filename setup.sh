#!/bin/bash

echo ""
echo "================================================"
echo "  🎮 Block Blast Solver - Next.js Setup"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    echo "   Download from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Setup .env.local
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "📝 Created .env.local from template"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your Anthropic API key:"
    echo "   ANTHROPIC_API_KEY=your_key_here"
    echo ""
    echo "   Get your key at: https://console.anthropic.com"
    echo ""
    echo "   (Image AI detection requires this key)"
    echo "   (Manual mode works without the key)"
    echo ""
else
    echo "✅ .env.local already exists"
fi

echo "================================================"
echo "  🚀 Setup complete!"
echo "================================================"
echo ""
echo "To start the app:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
