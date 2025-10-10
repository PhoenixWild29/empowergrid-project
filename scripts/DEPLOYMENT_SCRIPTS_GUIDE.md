# 📦 EmpowerGRID Deployment Scripts - Complete Guide

**Version**: 1.0.0  
**Created**: October 10, 2025

---

## ✅ Scripts Created

All deployment scripts have been successfully created! Here's what you have:

| Script | Platform | Size | Purpose |
|--------|----------|------|---------|
| `deploy-production.sh` | Linux/Mac | 7.2 KB | Full production deployment |
| `deploy-production.ps1` | Windows | 8.4 KB | Windows production deployment |
| `setup-environment.sh` | Linux/Mac | 6.7 KB | Interactive env setup |
| `database-backup.sh` | Linux/Mac | 3.9 KB | Automated DB backup |
| `health-check.sh` | Linux/Mac | 4.9 KB | System health monitoring |
| `quick-deploy.sh` | Linux/Mac | 1.4 KB | Fast deployment |
| `README.md` | All | 8.2 KB | Complete documentation |

**Total**: 7 deployment scripts + documentation

---

## 🚀 Quick Start

### For Linux/Mac/Unix

#### 1. First Time Setup

```bash
# Navigate to project root
cd /path/to/empowergrid_project

# Make all scripts executable
chmod +x scripts/*.sh

# Configure environment
./scripts/setup-environment.sh

# Deploy to production
./scripts/deploy-production.sh
```

#### 2. Regular Deployments

```bash
# Full deployment (with migrations)
./scripts/deploy-production.sh

# Quick deployment (no migrations)
./scripts/quick-deploy.sh
```

#### 3. Monitoring & Maintenance

```bash
# Run health check
./scripts/health-check.sh

# Manual database backup
./scripts/database-backup.sh
```

### For Windows

#### 1. First Time Setup

```powershell
# Navigate to project root
cd C:\path\to\empowergrid_project

# Configure environment manually or use:
# Edit app\.env file with your settings

# Deploy to production
.\scripts\deploy-production.ps1
```

#### 2. Regular Deployments

```powershell
# Full deployment
.\scripts\deploy-production.ps1

# With custom directory
.\scripts\deploy-production.ps1 -AppDir "C:\inetpub\empowergrid"

# Skip tests for faster deployment
.\scripts\deploy-production.ps1 -SkipTests

# Skip backup (use with caution!)
.\scripts\deploy-production.ps1 -SkipBackup
```

---

## 📅 Automated Tasks Setup

### Linux Cron Jobs

Create cron jobs for automated tasks:

```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily database backup at 2 AM
0 2 * * * /var/www/empowergrid/scripts/database-backup.sh >> /var/log/empowergrid-backup.log 2>&1

# Hourly health check
0 * * * * /var/www/empowergrid/scripts/health-check.sh >> /var/log/empowergrid-health.log 2>&1

# Weekly disk cleanup (optional)
0 3 * * 0 find /var/backups/empowergrid -name "*.sql.gz" -mtime +30 -delete
```

### Windows Task Scheduler

Create scheduled tasks:

```powershell
# Database Backup (Daily at 2 AM)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\scripts\database-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "EmpowerGRID Backup" `
    -Action $action -Trigger $trigger

# Health Check (Hourly)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "EmpowerGRID Health Check" `
    -Action $action -Trigger $trigger
```

---

## 🔧 Configuration

### Environment Variables

Required in `app/.env`:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Solana
SOLANA_NETWORK="mainnet-beta"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
PROGRAM_ID="Your_Program_ID"

# Oracle
SWITCHBOARD_PROGRAM_ID="SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f"
SWITCHBOARD_FEED_ADDRESS="Your_Feed_Address"

# Security
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
ENCRYPTION_KEY="your-encryption-key-32-chars"

# Admin
ADMIN_WALLET_ADDRESS="Your_Admin_Wallet_Address"
```

### Script Configuration

Edit scripts to customize:

**deploy-production.sh**:
```bash
APP_DIR="/var/www/empowergrid"        # Application directory
BACKUP_DIR="/var/backups/empowergrid" # Backup location
LOG_FILE="/var/log/empowergrid-deploy.log"  # Log file
```

**database-backup.sh**:
```bash
BACKUP_DIR="/var/backups/empowergrid/database"
RETENTION_DAYS=30  # Keep backups for 30 days
```

**health-check.sh**:
```bash
APP_URL="http://localhost:3000"  # Application URL
TIMEOUT=10  # Timeout in seconds
```

---

## 📊 Deployment Workflow

### Typical Deployment Process

```
1. Pre-Deployment
   ├── Review changes in Git
   ├── Check current health status
   └── Notify team

2. Backup Phase
   ├── Create application backup
   ├── Create database backup
   └── Verify backup integrity

3. Deployment Phase
   ├── Pull latest code
   ├── Install dependencies
   ├── Run database migrations
   ├── Run type check
   ├── Build application
   └── Restart services

4. Verification Phase
   ├── Health check
   ├── Smoke tests
   └── Monitor logs

5. Post-Deployment
   ├── Verify all features
   ├── Check metrics
   └── Update documentation
```

### Emergency Rollback

If deployment fails:

```bash
# Automatic rollback (built into deploy-production.sh)
# Manual rollback:

# 1. Find latest backup
ls -lt /var/backups/empowergrid/

# 2. Restore application
cd /var/www/empowergrid
tar -xzf /var/backups/empowergrid/app_TIMESTAMP.tar.gz

# 3. Restore database (if needed)
psql $DATABASE_URL < /var/backups/empowergrid/db_TIMESTAMP.sql

# 4. Restart
pm2 restart empowergrid
```

---

## 🔍 Monitoring & Alerts

### Log Files

Monitor these logs:

```bash
# Deployment logs
tail -f /var/log/empowergrid-deploy.log

# Backup logs
tail -f /var/log/empowergrid-backup.log

# Application logs
tail -f /var/log/empowergrid.log
pm2 logs empowergrid

# System logs
journalctl -u empowergrid -f
```

### Setting Up Alerts

**Email Alerts** (using mailutils):
```bash
# Install mailutils
sudo apt-get install mailutils

# Test email
echo "Test" | mail -s "Test Alert" admin@empowergrid.com

# Add to health check cron
0 * * * * /path/to/scripts/health-check.sh || \
    echo "Health check failed" | mail -s "ALERT: Health Check Failed" admin@empowergrid.com
```

**Slack Alerts** (using webhook):
```bash
# Add to scripts
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_slack_alert() {
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$1\"}" \
        $SLACK_WEBHOOK
}

# Use in scripts
send_slack_alert "Deployment completed successfully"
```

---

## 📈 Performance Optimization

### Script Optimization Tips

1. **Parallel Operations**:
```bash
# Run multiple backups in parallel
(pg_dump "$DATABASE_URL" > backup1.sql) &
(pg_dump --schema-only "$DATABASE_URL" > backup2.sql) &
wait
```

2. **Faster npm Install**:
```bash
# Use npm ci instead of npm install
npm ci --production=false

# Or use pnpm for faster installs
pnpm install --prod=false
```

3. **Build Optimization**:
```bash
# Use multiple CPU cores
npm run build -- --max-old-space-size=4096
```

---

## 🛡️ Security Best Practices

### Script Security

1. **Secure Permissions**:
```bash
# Scripts
chmod 700 scripts/*.sh

# Environment
chmod 600 app/.env

# Backups
chmod 700 /var/backups/empowergrid
```

2. **Audit Logging**:
```bash
# Add to scripts
log_audit() {
    echo "[$(date)] $USER: $1" >> /var/log/empowergrid-audit.log
}
```

3. **Secrets Management**:
```bash
# Never hardcode secrets
# Use environment variables
# Consider using Vault or AWS Secrets Manager
```

---

## 🆘 Troubleshooting

### Common Issues

#### "Permission Denied"
```bash
chmod +x scripts/*.sh
```

#### "Command Not Found: pg_dump"
```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client
```

#### "Node Version Mismatch"
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 18
nvm install 18
nvm use 18
```

#### "Build Failed"
```bash
# Clear cache
rm -rf app/.next app/node_modules

# Reinstall
cd app
npm install
npm run build
```

#### "Database Connection Failed"
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check DATABASE_URL format
echo $DATABASE_URL

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

---

## 📚 Additional Resources

### Documentation
- **Deployment Guide**: `../DEPLOYMENT_GUIDE.md`
- **System Architecture**: `../SYSTEM_ARCHITECTURE.md`
- **Production Checklist**: `../PRODUCTION_READINESS_CHECKLIST.md`
- **Project Summary**: `../PROJECT_COMPLETE_SUMMARY.md`

### External Resources
- Next.js Deployment: https://nextjs.org/docs/deployment
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup.html

---

## ✅ Deployment Checklist

Before running deployment scripts:

- [ ] All changes committed to Git
- [ ] Tests passing locally
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan ready
- [ ] Monitoring enabled

After deployment:

- [ ] Health check passed
- [ ] All endpoints responding
- [ ] Database migrations applied
- [ ] Logs show no errors
- [ ] Key features verified
- [ ] Monitoring data looks normal
- [ ] Team notified of completion

---

## 🎉 Success!

You now have a complete set of deployment scripts ready for production use!

**What's Included**:
- ✅ Full production deployment automation
- ✅ Interactive environment setup
- ✅ Automated database backups
- ✅ Comprehensive health monitoring
- ✅ Quick deployment for hotfixes
- ✅ Complete documentation
- ✅ Windows & Linux support

**Next Steps**:
1. Configure your environment
2. Run first deployment
3. Set up automated tasks
4. Configure monitoring
5. Test rollback procedure

**Need Help?**
- Check the README.md in scripts/
- Review the DEPLOYMENT_GUIDE.md
- Contact: devops@empowergrid.com

---

**Happy Deploying!** 🚀

**Document Version**: 1.0.0  
**Last Updated**: October 10, 2025  
**Maintained By**: EmpowerGRID DevOps Team

