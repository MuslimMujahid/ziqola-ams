@echo off
setlocal enabledelayedexpansion

:: Development Deployment Script for Ziqola AMS (Windows)
:: This script prepares the development environment.

echo 🚀 Starting development deployment...

:: 0. Setup environment files
echo 🔐 Setting up environment files...

:: Determine source env file
set "ENV_SOURCE=.env.example"
if exist .env (
    set "ENV_SOURCE=.env"
    echo ℹ️ Using existing root .env as source
) else (
    echo 📄 Creating root .env from .env.example
    copy .env.example .env
)

:: Distribute env to apps and packages
for %%d in (packages\db apps\backend apps\academic apps\web) do (
    echo 📄 Syncing %%d\.env from !ENV_SOURCE!
    copy /y !ENV_SOURCE! %%d\.env >nul
)

if not exist apps\backend\.env (
    echo 📄 Creating apps\backend\.env from .env.example
    copy .env.example apps\backend\.env
)

if not exist apps\academic\.env (
    echo 📄 Creating apps\academic\.env from .env.example
    copy .env.example apps\academic\.env
)

if not exist apps\web\.env (
    echo 📄 Creating apps\web\.env from .env.example
    copy .env.example apps\web\.env
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
