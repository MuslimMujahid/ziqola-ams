#!/bin/bash

# Development Deployment Script for Ziqola AMS
# This script prepares the development environment.

set -e

echo "🚀 Starting development deployment..."

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
echo "📦 Installing dependencies..."
pnpm install

# 2. Setup Database package
echo "🗄️ Preparing database package..."
pnpm --filter @repo/db build

# 3. Synchronize Database Schema (Development)
# Using db:push to synchronize schema without creating migrations
echo "🔄 Synchronizing database schema..."
pnpm --filter @repo/db db:push

# 4. Seed Database (Optional but recommended for dev)
if [ "$1" == "--seed" ]; then
  echo "🌱 Seeding database..."
  pnpm --filter @repo/db db:seed
fi

# 5. Start Development Servers
echo "🚀 Starting development servers..."
pnpm dev

echo "✅ Development deployment and startup complete!"
