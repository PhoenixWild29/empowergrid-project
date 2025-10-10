#!/bin/bash

###############################################################################
# EmpowerGRID Platform - Production Deployment Script
# Version: 1.0.0
# Description: Automated production deployment with safety checks
###############################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/empowergrid"
BACKUP_DIR="/var/backups/empowergrid"
LOG_FILE="/var/log/empowergrid-deploy.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as correct user
check_user() {
    if [ "$EUID" -eq 0 ]; then 
        error "Do not run this script as root"
        exit 1
    fi
    success "User check passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required commands exist
    for cmd in node npm git; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is not installed"
            exit 1
        fi
    done
    success "Required commands available"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18 or higher (found: $NODE_VERSION)"
        exit 1
    fi
    success "Node.js version check passed (v$NODE_VERSION)"
    
    # Check if .env file exists
    if [ ! -f "$APP_DIR/app/.env" ]; then
        error ".env file not found at $APP_DIR/app/.env"
        exit 1
    fi
    success "Environment file found"
    
    # Check database connectivity
    log "Checking database connectivity..."
    cd "$APP_DIR/app"
    if npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
        success "Database connection successful"
    else
        error "Database connection failed"
        exit 1
    fi
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup application code
    if [ -d "$APP_DIR" ]; then
        tar -czf "$BACKUP_DIR/app_$TIMESTAMP.tar.gz" -C "$APP_DIR" . 2>/dev/null
        success "Application backup created: app_$TIMESTAMP.tar.gz"
    fi
    
    # Backup database
    source "$APP_DIR/app/.env"
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_$TIMESTAMP.sql" 2>/dev/null
        success "Database backup created: db_$TIMESTAMP.sql"
    else
        warn "DATABASE_URL not found, skipping database backup"
    fi
}

# Pull latest code
pull_code() {
    log "Pulling latest code from repository..."
    cd "$APP_DIR"
    
    # Save current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log "Current branch: $CURRENT_BRANCH"
    
    # Pull latest changes
    git fetch origin
    git pull origin "$CURRENT_BRANCH"
    
    success "Code updated successfully"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    cd "$APP_DIR/app"
    
    # Install Node.js dependencies
    npm ci --production=false
    success "Node.js dependencies installed"
    
    # Generate Prisma Client
    npx prisma generate
    success "Prisma Client generated"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd "$APP_DIR/app"
    
    # Run migrations
    npx prisma migrate deploy
    success "Database migrations applied"
}

# Build application
build_application() {
    log "Building application..."
    cd "$APP_DIR/app"
    
    # Type check
    log "Running type check..."
    npm run type-check
    success "Type check passed"
    
    # Build
    log "Building Next.js application..."
    npm run build
    success "Build completed successfully"
}

# Restart application
restart_application() {
    log "Restarting application..."
    
    # Using PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart empowergrid || pm2 start npm --name "empowergrid" -- start
        pm2 save
        success "Application restarted with PM2"
    # Using systemd
    elif systemctl is-active --quiet empowergrid; then
        sudo systemctl restart empowergrid
        success "Application restarted with systemd"
    else
        warn "No process manager found. Please restart application manually."
    fi
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait for application to start
    sleep 5
    
    # Health check
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        success "Health check passed"
    else
        error "Health check failed"
        warn "Consider rolling back the deployment"
        exit 1
    fi
    
    # Check if build artifacts exist
    if [ -f "$APP_DIR/app/.next/BUILD_ID" ]; then
        BUILD_ID=$(cat "$APP_DIR/app/.next/BUILD_ID")
        success "Build ID: $BUILD_ID"
    fi
}

# Cleanup old backups (keep last 10)
cleanup_backups() {
    log "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    
    # Remove old app backups
    ls -t app_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    
    # Remove old db backups
    ls -t db_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
    
    success "Old backups cleaned up"
}

# Rollback function
rollback() {
    error "Deployment failed! Starting rollback..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/app_*.tar.gz 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log "Restoring from: $LATEST_BACKUP"
        cd "$APP_DIR"
        tar -xzf "$LATEST_BACKUP"
        restart_application
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment flow
main() {
    log "========================================="
    log "Starting EmpowerGRID Production Deployment"
    log "Timestamp: $TIMESTAMP"
    log "========================================="
    
    # Set trap to rollback on error
    trap rollback ERR
    
    check_user
    pre_deployment_checks
    create_backup
    pull_code
    install_dependencies
    run_migrations
    build_application
    restart_application
    verify_deployment
    cleanup_backups
    
    log "========================================="
    success "Deployment completed successfully! 🎉"
    log "========================================="
    
    # Display deployment info
    echo ""
    log "Deployment Summary:"
    log "  - Backup: $BACKUP_DIR/app_$TIMESTAMP.tar.gz"
    log "  - Build ID: $(cat $APP_DIR/app/.next/BUILD_ID 2>/dev/null || echo 'N/A')"
    log "  - Timestamp: $TIMESTAMP"
    echo ""
    log "Next steps:"
    log "  1. Monitor logs: tail -f /var/log/empowergrid.log"
    log "  2. Check metrics: pm2 monit"
    log "  3. Verify functionality in browser"
}

# Run main function
main "$@"

