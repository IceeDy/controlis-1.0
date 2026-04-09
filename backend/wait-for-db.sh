#!/usr/bin/env sh
set -eu

HOST="${1:-postgres}"
PORT="${2:-5432}"
USER_NAME="${POSTGRES_USER:-controlis}"
DB_NAME="${POSTGRES_DB:-controlis}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if pg_isready -h "$HOST" -p "$PORT" -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "PostgreSQL disponível em ${HOST}:${PORT}."
    exit 0
  fi

  echo "Aguardando PostgreSQL (${attempt}/${MAX_ATTEMPTS})..."
  attempt=$((attempt + 1))
  sleep "$SLEEP_SECONDS"
done

echo "PostgreSQL não ficou disponível dentro do tempo esperado." >&2
exit 1
