#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

OUTPUT_FILE="${APP_ROOT}/.env.preview.neon-branch.local"
BASE_ENV_FILE="${APP_ROOT}/.env.preview.local"
PROJECT_ID="${NEON_PROJECT_ID:-}"
NEON_BRANCH=""

usage() {
  cat <<'EOF'
Usage:
  bash scripts/pull-neon-branch-env.sh [options]

Options:
  --project-id <id>    Neon project id. If omitted, tries NEON_PROJECT_ID from env/.env.preview.local.
  --branch <name>      Neon branch name. Default: preview/<current-git-branch>
  --out <path>         Output env file path. Default: .env.preview.neon-branch.local
  --base <path>        Base env file to copy non-DB vars from. Default: .env.preview.local
  -h, --help           Show help
EOF
}

read_env_var_from_file() {
  local file_path="$1"
  local key="$2"
  if [[ -f "$file_path" ]]; then
    grep -E "^${key}=" "$file_path" | head -n 1 | cut -d'=' -f2- | tr -d '"' || true
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id)
      PROJECT_ID="${2:-}"
      shift 2
      ;;
    --branch)
      NEON_BRANCH="${2:-}"
      shift 2
      ;;
    --out)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --base)
      BASE_ENV_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if ! command -v neonctl >/dev/null 2>&1; then
  echo "❌ neonctl not found. Install first: brew install neonctl"
  exit 1
fi

if [[ -z "${PROJECT_ID}" ]]; then
  PROJECT_ID="$(read_env_var_from_file "${BASE_ENV_FILE}" "NEON_PROJECT_ID")"
fi

if [[ -z "${PROJECT_ID}" && -f "${APP_ROOT}/.env.local" ]]; then
  PROJECT_ID="$(read_env_var_from_file "${APP_ROOT}/.env.local" "NEON_PROJECT_ID")"
fi

if [[ -z "${PROJECT_ID}" ]]; then
  echo "❌ Missing NEON project id."
  echo "Set --project-id or provide NEON_PROJECT_ID in ${BASE_ENV_FILE} / .env.local."
  exit 1
fi

if [[ -z "${NEON_BRANCH}" ]]; then
  GIT_BRANCH="$(git -C "${APP_ROOT}" rev-parse --abbrev-ref HEAD)"
  NEON_BRANCH="preview/${GIT_BRANCH}"
fi

if ! neonctl me >/dev/null 2>&1; then
  echo "❌ neonctl is not authenticated. Run: neonctl auth"
  exit 1
fi

if ! neonctl branches get "${NEON_BRANCH}" --project-id "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "❌ Neon branch not found: ${NEON_BRANCH}"
  echo "Available preview branches:"
  neonctl branches list --project-id "${PROJECT_ID}" || true
  exit 1
fi

echo "📥 Pulling connection strings from Neon..."
POOLED_URL="$(neonctl connection-string "${NEON_BRANCH}" --project-id "${PROJECT_ID}" --pooled -o json)"
UNPOOLED_URL="$(neonctl connection-string "${NEON_BRANCH}" --project-id "${PROJECT_ID}" -o json)"

mkdir -p "$(dirname "${OUTPUT_FILE}")"

if [[ -f "${BASE_ENV_FILE}" ]]; then
  awk '!/^(DATABASE_URL|DATABASE_URL_UNPOOLED|POSTGRES_URL|POSTGRES_URL_NON_POOLING|PAYLOAD_DATABASE_URL|PAYLOAD_DB_PUSH)=/' "${BASE_ENV_FILE}" > "${OUTPUT_FILE}"
else
  : > "${OUTPUT_FILE}"
fi

{
  echo "DATABASE_URL=\"${POOLED_URL}\""
  echo "DATABASE_URL_UNPOOLED=\"${UNPOOLED_URL}\""
  echo "POSTGRES_URL=\"${POOLED_URL}\""
  echo "POSTGRES_URL_NON_POOLING=\"${UNPOOLED_URL}\""
  echo "PAYLOAD_DATABASE_URL=\"${UNPOOLED_URL}\""
  echo "PAYLOAD_DB_PUSH=true"
} >> "${OUTPUT_FILE}"

echo "✅ Wrote ${OUTPUT_FILE}"
echo "   project: ${PROJECT_ID}"
echo "   branch : ${NEON_BRANCH}"
echo
echo "Use it locally:"
echo "  set -a; source ${OUTPUT_FILE}; set +a"
