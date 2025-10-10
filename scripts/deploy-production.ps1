# EmpowerGRID Platform - Production Deployment Script (PowerShell)
# Version: 1.0.0
# Description: Automated production deployment for Windows

param(
    [string]$AppDir = "C:\inetpub\empowergrid",
    [string]$BackupDir = "C:\Backups\empowergrid",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$LogFile = "C:\Logs\empowergrid-deploy.log"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        default { Write-Host $logMessage -ForegroundColor Cyan }
    }
    
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = (node --version) -replace 'v', ''
        $majorVersion = [int]($nodeVersion.Split('.')[0])
        
        if ($majorVersion -lt 18) {
            Write-Log "Node.js version must be 18 or higher (found: $nodeVersion)" "ERROR"
            exit 1
        }
        Write-Log "Node.js version check passed (v$nodeVersion)" "SUCCESS"
    }
    catch {
        Write-Log "Node.js is not installed" "ERROR"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Log "npm version: $npmVersion" "SUCCESS"
    }
    catch {
        Write-Log "npm is not installed" "ERROR"
        exit 1
    }
    
    # Check if .env exists
    if (-not (Test-Path "$AppDir\app\.env")) {
        Write-Log ".env file not found at $AppDir\app\.env" "ERROR"
        exit 1
    }
    Write-Log "Environment file found" "SUCCESS"
}

function New-Backup {
    if ($SkipBackup) {
        Write-Log "Skipping backup (--SkipBackup flag set)" "WARNING"
        return
    }
    
    Write-Log "Creating backup before deployment..."
    
    # Create backup directory
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    # Backup application code
    $backupFile = "$BackupDir\app_$Timestamp.zip"
    Compress-Archive -Path "$AppDir\*" -DestinationPath $backupFile -Force
    Write-Log "Application backup created: $backupFile" "SUCCESS"
    
    # Backup database (if PostgreSQL tools available)
    if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
        $envContent = Get-Content "$AppDir\app\.env"
        $databaseUrl = ($envContent | Select-String "DATABASE_URL").ToString().Split('=')[1].Trim('"')
        
        if ($databaseUrl) {
            $dbBackupFile = "$BackupDir\db_$Timestamp.sql"
            & pg_dump $databaseUrl > $dbBackupFile
            Write-Log "Database backup created: $dbBackupFile" "SUCCESS"
        }
    }
    else {
        Write-Log "pg_dump not found, skipping database backup" "WARNING"
    }
}

function Update-Code {
    Write-Log "Pulling latest code from repository..."
    
    Set-Location $AppDir
    
    # Get current branch
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Log "Current branch: $currentBranch"
    
    # Pull latest changes
    git fetch origin
    git pull origin $currentBranch
    
    Write-Log "Code updated successfully" "SUCCESS"
}

function Install-Dependencies {
    Write-Log "Installing dependencies..."
    
    Set-Location "$AppDir\app"
    
    # Install Node.js dependencies
    npm ci --production=false
    Write-Log "Node.js dependencies installed" "SUCCESS"
    
    # Generate Prisma Client
    npx prisma generate
    Write-Log "Prisma Client generated" "SUCCESS"
}

function Invoke-DatabaseMigrations {
    Write-Log "Running database migrations..."
    
    Set-Location "$AppDir\app"
    
    # Run migrations
    npx prisma migrate deploy
    Write-Log "Database migrations applied" "SUCCESS"
}

function Build-Application {
    Write-Log "Building application..."
    
    Set-Location "$AppDir\app"
    
    # Type check
    if (-not $SkipTests) {
        Write-Log "Running type check..."
        npm run type-check
        Write-Log "Type check passed" "SUCCESS"
    }
    
    # Build
    Write-Log "Building Next.js application..."
    npm run build
    Write-Log "Build completed successfully" "SUCCESS"
}

function Restart-Application {
    Write-Log "Restarting application..."
    
    # Check if running as IIS application
    if (Get-Command iisreset -ErrorAction SilentlyContinue) {
        iisreset /restart
        Write-Log "IIS restarted successfully" "SUCCESS"
    }
    # Check if running as Windows Service
    elseif (Get-Service -Name "EmpowerGRID" -ErrorAction SilentlyContinue) {
        Restart-Service -Name "EmpowerGRID"
        Write-Log "Service restarted successfully" "SUCCESS"
    }
    # PM2 for Node.js
    elseif (Get-Command pm2 -ErrorAction SilentlyContinue) {
        pm2 restart empowergrid
        pm2 save
        Write-Log "Application restarted with PM2" "SUCCESS"
    }
    else {
        Write-Log "No process manager found. Please restart application manually." "WARNING"
    }
}

function Test-Deployment {
    Write-Log "Verifying deployment..."
    
    # Wait for application to start
    Start-Sleep -Seconds 5
    
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Log "Health check passed" "SUCCESS"
        }
        else {
            Write-Log "Health check failed with status: $($response.StatusCode)" "ERROR"
            exit 1
        }
    }
    catch {
        Write-Log "Health check failed: $_" "ERROR"
        exit 1
    }
    
    # Check build ID
    $buildIdFile = "$AppDir\app\.next\BUILD_ID"
    if (Test-Path $buildIdFile) {
        $buildId = Get-Content $buildIdFile
        Write-Log "Build ID: $buildId" "SUCCESS"
    }
}

function Remove-OldBackups {
    Write-Log "Cleaning up old backups..."
    
    # Keep only last 10 backups
    Get-ChildItem -Path $BackupDir -Filter "app_*.zip" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -Skip 10 | 
        Remove-Item -Force
    
    Get-ChildItem -Path $BackupDir -Filter "db_*.sql" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -Skip 10 | 
        Remove-Item -Force
    
    Write-Log "Old backups cleaned up" "SUCCESS"
}

# Main deployment flow
function Start-Deployment {
    Write-Log "========================================="
    Write-Log "Starting EmpowerGRID Production Deployment"
    Write-Log "Timestamp: $Timestamp"
    Write-Log "========================================="
    
    try {
        Test-Prerequisites
        New-Backup
        Update-Code
        Install-Dependencies
        Invoke-DatabaseMigrations
        Build-Application
        Restart-Application
        Test-Deployment
        Remove-OldBackups
        
        Write-Log "========================================="
        Write-Log "Deployment completed successfully! 🎉" "SUCCESS"
        Write-Log "========================================="
        
        Write-Host ""
        Write-Log "Deployment Summary:"
        Write-Log "  - Backup: $BackupDir\app_$Timestamp.zip"
        if (Test-Path "$AppDir\app\.next\BUILD_ID") {
            $buildId = Get-Content "$AppDir\app\.next\BUILD_ID"
            Write-Log "  - Build ID: $buildId"
        }
        Write-Log "  - Timestamp: $Timestamp"
        Write-Host ""
        Write-Log "Next steps:"
        Write-Log "  1. Monitor application logs"
        Write-Log "  2. Verify functionality in browser"
        Write-Log "  3. Check monitoring dashboards"
    }
    catch {
        Write-Log "Deployment failed: $_" "ERROR"
        Write-Log "Consider rolling back to previous version" "WARNING"
        exit 1
    }
}

# Run deployment
Start-Deployment

