#!/bin/bash

###############################################################################
# EmpowerGRID Platform - Database Backup Script
# Version: 1.0.0
# Description: Automated database backup with retention policy
###############################################################################

set -e

# Configuration
BACKUP_DIR="/var/backups/empowergrid/database"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/empowergrid-backup.log"

# Source environment variables
if [ -f "/var/www/empowergrid/app/.env" ]; then
    source "/var/www/empowergrid/app/.env"
else
    echo "ERROR: .env file not found"
    exit 1
fi

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "========================================="
log "Starting EmpowerGRID Database Backup"
log "Timestamp: $TIMESTAMP"
log "========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL not set in environment"
    exit 1
fi

# Full database backup
BACKUP_FILE="$BACKUP_DIR/empowergrid_full_$TIMESTAMP.sql"
log "Creating full database backup..."

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    success "Full backup created: $BACKUP_FILE"
    
    # Compress backup
    log "Compressing backup..."
    gzip "$BACKUP_FILE"
    success "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Get compressed size
    SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    log "Backup size: $SIZE"
else
    error "Backup failed"
    exit 1
fi

# Schema-only backup
SCHEMA_FILE="$BACKUP_DIR/empowergrid_schema_$TIMESTAMP.sql"
log "Creating schema-only backup..."

if pg_dump --schema-only "$DATABASE_URL" > "$SCHEMA_FILE" 2>> "$LOG_FILE"; then
    success "Schema backup created: $SCHEMA_FILE"
    gzip "$SCHEMA_FILE"
else
    error "Schema backup failed"
fi

# Data-only backup for critical tables
DATA_FILE="$BACKUP_DIR/empowergrid_data_$TIMESTAMP.sql"
log "Creating data-only backup..."

if pg_dump --data-only \
    --table=users \
    --table=projects \
    --table=fundings \
    --table=escrow_contracts \
    "$DATABASE_URL" > "$DATA_FILE" 2>> "$LOG_FILE"; then
    success "Data backup created: $DATA_FILE"
    gzip "$DATA_FILE"
else
    error "Data backup failed"
fi

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sql" -mtime +$RETENTION_DAYS -delete
success "Old backups cleaned up"

# Upload to S3 (optional, if AWS CLI is configured)
if command -v aws &> /dev/null; then
    S3_BUCKET="s3://empowergrid-backups/database"
    log "Uploading to S3: $S3_BUCKET"
    
    if aws s3 cp "${BACKUP_FILE}.gz" "$S3_BUCKET/" 2>> "$LOG_FILE"; then
        success "Backup uploaded to S3"
    else
        error "S3 upload failed"
    fi
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "${BACKUP_FILE}.gz" 2>> "$LOG_FILE"; then
    success "Backup integrity verified"
else
    error "Backup integrity check failed!"
    exit 1
fi

log "========================================="
success "Database backup completed successfully!"
log "========================================="

# Output backup information
log "Backup Details:"
log "  Location: ${BACKUP_FILE}.gz"
log "  Size: $SIZE"
log "  Retention: $RETENTION_DAYS days"
log ""

# Send notification (optional, if mail is configured)
if command -v mail &> /dev/null; then
    echo "Database backup completed successfully at $TIMESTAMP" | \
        mail -s "EmpowerGRID Backup Success" admin@empowergrid.com
fi

exit 0

