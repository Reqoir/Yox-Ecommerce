#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="yox_ecommerce"
DB_USER="yox_app"
DB_PASS="StrongAppPassword123!"

mkdir -p "$BACKUP_DIR"

# Create compressed dump
mongodump --db "$DB_NAME" --username "$DB_USER" --password "$DB_PASS" --authenticationDatabase "$DB_NAME" --archive="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.gz" --gzip

# Auto-delete backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -exec rm -f {} +

echo "✅ Database backup completed: ${DB_NAME}_${TIMESTAMP}.gz"
