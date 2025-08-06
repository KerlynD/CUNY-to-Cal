#!/bin/bash

echo "🧪 Testing CI/CD Pipeline Locally"
echo "=================================="

echo "📦 Installing dependencies..."
if [ -f package-lock.json ]; then
    echo "✅ Found package-lock.json, using npm ci"
    npm ci
else
    echo "⚠️  No package-lock.json found, using npm install"
    npm install
fi

echo ""
echo "🔍 Running type check..."
npm run type-check

echo ""
echo "🧹 Running linter..."
npm run lint

echo ""
echo "🧪 Running unit tests..."
npm test

echo ""
echo "🔬 Running e2e tests..."
npm run test:e2e

echo ""
echo "🏗️  Building extension..."
npm run build

echo ""
echo "📦 Creating zip package..."
npm run zip

echo ""
echo "✅ All CI/CD steps completed successfully!"
echo "🚀 Ready for deployment!"