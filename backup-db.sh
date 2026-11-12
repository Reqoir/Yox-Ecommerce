#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="yox_ecommerce"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/server/.env"

if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/var/www/yox-ecommerce/server/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: server .env file not found at ${SCRIPT_DIR}/server/.env or /var/www/yox-ecommerce/server/.env" >&2
  exit 1
fi

MONGODB_URI=$(grep -E '^MONGODB_URI=' "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"\r'\'')

if [ -z "$MONGODB_URI" ]; then
  echo "❌ Error: MONGODB_URI not found in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# Create compressed dump
mongodump --uri="$MONGODB_URI" --archive="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.gz" --gzip

# Auto-delete backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -exec rm -f {} +

echo "✅ Database backup completed: ${DB_NAME}_${TIMESTAMP}.gz"
