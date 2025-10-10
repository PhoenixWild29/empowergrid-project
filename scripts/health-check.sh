#!/bin/bash

###############################################################################
# EmpowerGRID Platform - Health Check Script
# Version: 1.0.0
# Description: Comprehensive system health check
###############################################################################

# Configuration
APP_URL="http://localhost:3000"
TIMEOUT=10
EXIT_CODE=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    EXIT_CODE=1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}EmpowerGRID Health Check${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 1. Application Health
echo -e "${BLUE}[1/8] Checking Application Health...${NC}"
if curl -f -s -m $TIMEOUT "$APP_URL/api/health" > /dev/null 2>&1; then
    success "Application is responding"
else
    error "Application is not responding"
fi
echo ""

# 2. Database Connection
echo -e "${BLUE}[2/8] Checking Database Connection...${NC}"
if [ -f "app/.env" ]; then
    source app/.env
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database connection successful"
    else
        error "Database connection failed"
    fi
else
    warn ".env file not found, skipping database check"
fi
echo ""

# 3. Database Size
echo -e "${BLUE}[3/8] Checking Database Size...${NC}"
if [ -n "$DATABASE_URL" ]; then
    DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | xargs)
    if [ -n "$DB_SIZE" ]; then
        info "Database size: $DB_SIZE"
    fi
fi
echo ""

# 4. Active Database Connections
echo -e "${BLUE}[4/8] Checking Database Connections...${NC}"
if [ -n "$DATABASE_URL" ]; then
    ACTIVE_CONN=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs)
    TOTAL_CONN=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
    
    if [ -n "$ACTIVE_CONN" ]; then
        info "Active connections: $ACTIVE_CONN"
        info "Total connections: $TOTAL_CONN"
        
        if [ "$TOTAL_CONN" -gt 80 ]; then
            warn "High number of database connections"
        else
            success "Database connections normal"
        fi
    fi
fi
echo ""

# 5. Disk Space
echo -e "${BLUE}[5/8] Checking Disk Space...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    success "Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    warn "Disk usage: ${DISK_USAGE}% (consider cleanup)"
else
    error "Disk usage: ${DISK_USAGE}% (critical!)"
fi
echo ""

# 6. Memory Usage
echo -e "${BLUE}[6/8] Checking Memory Usage...${NC}"
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 80 ]; then
    success "Memory usage: ${MEM_USAGE}%"
elif [ "$MEM_USAGE" -lt 90 ]; then
    warn "Memory usage: ${MEM_USAGE}% (consider investigation)"
else
    error "Memory usage: ${MEM_USAGE}% (critical!)"
fi
echo ""

# 7. Process Check
echo -e "${BLUE}[7/8] Checking Application Process...${NC}"
if pgrep -f "next" > /dev/null; then
    success "Application process is running"
    PROCESS_COUNT=$(pgrep -f "next" | wc -l)
    info "Process count: $PROCESS_COUNT"
elif command -v pm2 &> /dev/null && pm2 list | grep -q "empowergrid"; then
    success "Application process is running (PM2)"
else
    error "Application process not found"
fi
echo ""

# 8. API Response Time
echo -e "${BLUE}[8/8] Checking API Response Time...${NC}"
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' "$APP_URL/api/health" || echo "0")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d'.' -f1)

if [ "$RESPONSE_MS" -lt 500 ]; then
    success "Response time: ${RESPONSE_MS}ms"
elif [ "$RESPONSE_MS" -lt 1000 ]; then
    warn "Response time: ${RESPONSE_MS}ms (slow)"
else
    error "Response time: ${RESPONSE_MS}ms (very slow!)"
fi
echo ""

# 9. Optional: Check SSL Certificate
if [[ "$APP_URL" == https://* ]]; then
    echo -e "${BLUE}[9/8] Checking SSL Certificate...${NC}"
    CERT_EXPIRY=$(echo | openssl s_client -servername $(echo $APP_URL | cut -d'/' -f3) -connect $(echo $APP_URL | cut -d'/' -f3):443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d'=' -f2)
    info "Certificate expires: $CERT_EXPIRY"
    echo ""
fi

# Summary
echo -e "${BLUE}=========================================${NC}"
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All health checks passed! ✓${NC}"
else
    echo -e "${RED}Some health checks failed! ✗${NC}"
fi
echo -e "${BLUE}=========================================${NC}"

exit $EXIT_CODE

