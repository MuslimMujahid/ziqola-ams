@echo off
setlocal enabledelayedexpansion

:: Development Deployment Script for Ziqola AMS (Windows)
:: This script prepares the development environment.

echo 🚀 Starting development deployment...

:: 0. Setup environment files
echo 🔐 Setting up environment files...
if not exist .env (
    echo 📄 Creating root .env from .env.example
    copy .env.example .env
)

if not exist packages\db\.env (
    echo 📄 Creating packages\db\.env from .env.example
    copy .env.example packages\db\.env
)
echo 📦 Installing dependencies...
call pnpm install
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

:: 2. Setup Database package
echo 🗄️ Preparing database package...
call pnpm --filter @repo/db build
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

:: 3. Synchronize Database Schema (Development)
echo 🔄 Synchronizing database schema...
call pnpm --filter @repo/db db:push
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

:: 4. Seed Database
if "%1"=="--seed" (
    echo 🌱 Seeding database...
    call pnpm --filter @repo/db db:seed
    if !ERRORLEVEL! neq 0 exit /b !ERRORLEVEL!
)

:: 5. Start Development Servers
echo 🚀 Starting development servers...
call pnpm dev
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo ✅ Development deployment and startup complete!
