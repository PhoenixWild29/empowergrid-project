# 🚀 EmpowerGRID Deployment Scripts

**Version**: 1.0.0  
**Platform**: Linux/Unix & Windows

---

## 📋 Available Scripts

### Production Deployment

#### 1. **deploy-production.sh** (Linux/Mac)
Complete production deployment with safety checks, backups, and rollback.

**Usage**:
```bash
# Make executable
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh
```

**Features**:
- ✅ Pre-deployment checks
- ✅ Automatic backups
- ✅ Database migrations
- ✅ Type checking
- ✅ Build & restart
- ✅ Health verification
- ✅ Automatic rollback on failure

#### 2. **deploy-production.ps1** (Windows)
PowerShell version for Windows servers.

**Usage**:
```powershell
# Run deployment
.\scripts\deploy-production.ps1

# With options
.\scripts\deploy-production.ps1 -AppDir "C:\app" -SkipTests
```

**Parameters**:
- `-AppDir`: Application directory (default: `C:\inetpub\empowergrid`)
- `-BackupDir`: Backup directory (default: `C:\Backups\empowergrid`)
- `-SkipTests`: Skip type checking
- `-SkipBackup`: Skip backup creation

---

### Environment Setup

#### 3. **setup-environment.sh**
Interactive environment configuration wizard.

**Usage**:
```bash
chmod +x scripts/setup-environment.sh
./scripts/setup-environment.sh
```

**Creates**:
- `app/.env` - Production environment variables
- `app/.env.example` - Template for reference

**Configures**:
- Database connection
- Solana network
- Oracle settings
- API configuration
- Security secrets
- Admin settings

---

### Database Management

#### 4. **database-backup.sh**
Automated database backup with compression and retention.

**Usage**:
```bash
chmod +x scripts/database-backup.sh
./scripts/database-backup.sh
```

**Features**:
- Full database backup
- Schema-only backup
- Data-only backup (critical tables)
- Automatic compression
- 30-day retention policy
- S3 upload (optional)
- Integrity verification

**Setup Cron Job**:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/database-backup.sh >> /var/log/empowergrid-backup.log 2>&1
```

---

### Health Monitoring

#### 5. **health-check.sh**
Comprehensive system health check.

**Usage**:
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

**Checks**:
- ✅ Application responsiveness
- ✅ Database connectivity
- ✅ Database size & connections
- ✅ Disk space usage
- ✅ Memory usage
- ✅ Process status
- ✅ API response time
- ✅ SSL certificate (if HTTPS)

**Exit Codes**:
- `0` - All checks passed
- `1` - One or more checks failed

**Setup Monitoring**:
```bash
# Check every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh || mail -s "Health Check Failed" admin@example.com
```

---

### Quick Deployment

#### 6. **quick-deploy.sh**
Fast deployment for minor updates (no database changes).

**Usage**:
```bash
chmod +x scripts/quick-deploy.sh
./scripts/quick-deploy.sh
```

**Use When**:
- Minor code changes
- UI updates
- No database migrations
- Quick hotfixes

**⚠️ Warning**: Does not run migrations or create backups!

---

## 🔧 Setup Instructions

### Initial Setup

1. **Clone Repository**:
```bash
cd /var/www
git clone https://github.com/your-org/empowergrid_project.git empowergrid
cd empowergrid
```

2. **Make Scripts Executable**:
```bash
chmod +x scripts/*.sh
```

3. **Configure Environment**:
```bash
./scripts/setup-environment.sh
```

4. **First Deployment**:
```bash
./scripts/deploy-production.sh
```

### Automated Backups

Add to crontab (`crontab -e`):
```bash
# Daily database backup at 2 AM
0 2 * * * /var/www/empowergrid/scripts/database-backup.sh

# Hourly health check
0 * * * * /var/www/empowergrid/scripts/health-check.sh
```

### Monitoring Setup

Create systemd service for health monitoring:
```bash
sudo nano /etc/systemd/system/empowergrid-health.service
```

```ini
[Unit]
Description=EmpowerGRID Health Check
After=network.target

[Service]
Type=oneshot
ExecStart=/var/www/empowergrid/scripts/health-check.sh
User=www-data

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable empowergrid-health.timer
sudo systemctl start empowergrid-health.timer
```

---

## 📁 Directory Structure

```
scripts/
├── deploy-production.sh          # Linux production deployment
├── deploy-production.ps1         # Windows production deployment
├── setup-environment.sh          # Environment configuration
├── database-backup.sh            # Database backup automation
├── health-check.sh               # System health monitoring
├── quick-deploy.sh               # Fast deployment
└── README.md                     # This file
```

---

## 🔐 Security Best Practices

### File Permissions

```bash
# Scripts - executable by owner only
chmod 700 scripts/*.sh

# Environment file - read/write by owner only
chmod 600 app/.env

# Backup directory - restricted access
chmod 700 /var/backups/empowergrid
```

### Environment Variables

Never commit `.env` files! Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### Backup Security

- Store backups in separate location
- Encrypt sensitive backups
- Implement off-site backup storage
- Test restoration regularly

---

## 📊 Deployment Workflow

### Standard Deployment

```bash
# 1. Check current status
./scripts/health-check.sh

# 2. Run full deployment
./scripts/deploy-production.sh

# 3. Verify deployment
./scripts/health-check.sh

# 4. Monitor logs
tail -f /var/log/empowergrid.log
```

### Emergency Hotfix

```bash
# 1. Quick deploy (if no DB changes)
./scripts/quick-deploy.sh

# 2. Verify
./scripts/health-check.sh
```

### Rollback Procedure

```bash
# Automatic rollback on failure
# Manual rollback:
cd /var/www/empowergrid
tar -xzf /var/backups/empowergrid/app_TIMESTAMP.tar.gz
pm2 restart empowergrid
```

---

## 🔍 Troubleshooting

### Script Fails to Execute

```bash
# Check permissions
ls -la scripts/

# Make executable
chmod +x scripts/deploy-production.sh

# Check line endings (if copied from Windows)
dos2unix scripts/deploy-production.sh
```

### Database Backup Fails

```bash
# Check pg_dump availability
which pg_dump

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check backup directory permissions
ls -la /var/backups/empowergrid
```

### Deployment Fails

```bash
# Check logs
cat /var/log/empowergrid-deploy.log

# Verify Node.js version
node --version

# Check disk space
df -h

# Verify environment
cat app/.env
```

### Health Check Fails

```bash
# Run with verbose output
bash -x scripts/health-check.sh

# Check application status
pm2 status

# Check application logs
pm2 logs empowergrid
```

---

## 📝 Customization

### Modify Backup Retention

Edit `database-backup.sh`:
```bash
RETENTION_DAYS=30  # Change to desired days
```

### Change Deployment Directory

Edit `deploy-production.sh`:
```bash
APP_DIR="/your/custom/path"
```

### Add Custom Checks

Add to `health-check.sh`:
```bash
# Custom check example
echo -e "${BLUE}[9/8] Checking Custom Service...${NC}"
if systemctl is-active --quiet my-service; then
    success "Custom service is running"
else
    error "Custom service is not running"
fi
```

---

## 🆘 Support

### Documentation
- Deployment Guide: `../DEPLOYMENT_GUIDE.md`
- Architecture: `../SYSTEM_ARCHITECTURE.md`
- Production Checklist: `../PRODUCTION_READINESS_CHECKLIST.md`

### Logs
- Deployment: `/var/log/empowergrid-deploy.log`
- Backup: `/var/log/empowergrid-backup.log`
- Application: `/var/log/empowergrid.log`

### Contact
- Email: devops@empowergrid.com
- Discord: [Server Invite]
- GitHub: [Repository Issues]

---

## 📜 License

Copyright © 2025 EmpowerGRID Platform  
All rights reserved.

---

**Last Updated**: October 10, 2025  
**Maintained By**: EmpowerGRID DevOps Team

