#!/bin/bash

# Development Deployment Script for Ziqola AMS
# This script prepares the development environment.

set -e

echo "🚀 Starting development deployment..."

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
