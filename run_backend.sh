#!/usr/bin/env bash
set -euo pipefail

echo "Starting PostgreSQL..."
docker compose up -d db

echo "Waiting for PostgreSQL..."
until docker compose exec -T db pg_isready -U splitapp_user -d splitapp_db >/dev/null 2>&1; do
  sleep 1
done

echo "Starting API..."
dotnet run --project backend/SplitApp.Api
