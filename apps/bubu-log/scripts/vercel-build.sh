#!/usr/bin/env bash

set -euo pipefail

if [[ "${VERCEL:-}" == "1" || "${RUN_DB_MIGRATE_ON_BUILD:-}" == "1" ]]; then
  echo "🔧 Running DB migration before build..."
  pnpm db:migrate
else
  echo "ℹ️ Skipping DB migration (set RUN_DB_MIGRATE_ON_BUILD=1 to force)."
fi

next build
