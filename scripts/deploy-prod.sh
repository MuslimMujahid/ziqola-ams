#!/bin/bash

# Production Deployment Script for Ziqola AMS
# This script prepares the production environment.

set -e

echo "🚀 Starting production deployment..."

# 0. Setup environment files
echo "🔐 Setting up environment files..."
if [ ! -f .env ]; then
  echo "📄 Creating root .env from .env.example"
  cp .env.example .env
fi

if [ ! -f packages/db/.env ]; then
  echo "📄 Creating packages/db/.env from .env.example"
  cp .env.example packages/db/.env
fi
echo "📦 Installing dependencies (frozen lockfile)..."
pnpm install --frozen-lockfile

# 2. Build Database package
echo "🗄️ Building database package..."
pnpm --filter @repo/db build

# 3. Run Database Migrations (Production)
echo "📂 Running database migrations..."
pnpm --filter @repo/db db:migrate

# 4. Build Applications
echo "🏗️ Building applications for production..."
pnpm build

echo "✅ Production deployment complete!"
