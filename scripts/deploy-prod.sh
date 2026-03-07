#!/bin/bash

# Production Deployment Script for Ziqola AMS
# This script prepares the production environment.

set -e

echo "🚀 Starting production deployment..."

# 0. Setup environment files
echo "🔐 Setting up environment files..."

# Determine source env file
ENV_SOURCE=".env.example"
if [ -f .env ]; then
  ENV_SOURCE=".env"
  echo "ℹ️ Using existing root .env as source"
else
  echo "📄 Creating root .env from .env.example"
  cp .env.example .env
fi

# Distribute env to apps and packages
for dir in packages/db apps/backend apps/academic apps/web; do
  echo "📄 Syncing $dir/.env from $ENV_SOURCE"
  cp "$ENV_SOURCE" "$dir/.env"
done
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
