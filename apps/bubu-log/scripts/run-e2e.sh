#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CONTAINER_NAME="bubu-log-e2e-db"
DB_PORT="5434"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="bubu_log_e2e"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
DATABASE_URL_UNPOOLED="${DATABASE_URL}"

cleanup() {
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
}

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker is required to run e2e tests."
  exit 1
fi

trap cleanup EXIT

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

docker run \
  --name "${CONTAINER_NAME}" \
  -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
  -e POSTGRES_DB="${DB_NAME}" \
  -p "${DB_PORT}:5432" \
  -d postgres:16-alpine >/dev/null

echo "⏳ Waiting for test database to be ready..."
for _ in {1..30}; do
  if docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
  echo "❌ Test database failed to start."
  exit 1
fi

cd "${APP_DIR}"

DATABASE_URL="${DATABASE_URL}" DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED}" pnpm db:push -- --force-reset
DATABASE_URL="${DATABASE_URL}" DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED}" pnpm db:seed:test
DATABASE_URL="${DATABASE_URL}" DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED}" pnpm exec playwright test "$@"
