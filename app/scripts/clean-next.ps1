# PowerShell script to safely clean Next.js .next directory on Windows
# This handles symlink issues that can occur with OneDrive syncing

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🧹 Cleaning Next.js build directory..." -ForegroundColor Cyan

$nextDir = Join-Path $PSScriptRoot ".." ".next"
$nextDir = Resolve-Path $nextDir -ErrorAction SilentlyContinue

if (-not $nextDir) {
    Write-Host "✓ .next directory doesn't exist, nothing to clean" -ForegroundColor Green
    exit 0
}

Write-Host "Found .next directory at: $nextDir" -ForegroundColor Yellow

# Stop any running Node processes that might be using the directory
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Try multiple deletion strategies for Windows/OneDrive compatibility
$maxRetries = 3
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    $retryCount++
    Write-Host "Attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
    
    try {
        # Method 1: Standard recursive delete
        if (Test-Path $nextDir) {
            Remove-Item -Path $nextDir -Recurse -Force -ErrorAction Stop
            Start-Sleep -Seconds 1
            
            if (-not (Test-Path $nextDir)) {
                $success = $true
                Write-Host "✓ Successfully cleaned .next directory" -ForegroundColor Green
                break
            }
        }
    } catch {
        Write-Host "  Method 1 failed: $($_.Exception.Message)" -ForegroundColor Red
        
        # Method 2: Delete files individually, then directories
        try {
            if (Test-Path $nextDir) {
                Get-ChildItem -Path $nextDir -Recurse -File | Remove-Item -Force -ErrorAction SilentlyContinue
                Get-ChildItem -Path $nextDir -Recurse -Directory | Sort-Object -Property FullName -Descending | Remove-Item -Force -ErrorAction SilentlyContinue
                Remove-Item -Path $nextDir -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
                
                if (-not (Test-Path $nextDir)) {
                    $success = $true
                    Write-Host "✓ Successfully cleaned .next directory (method 2)" -ForegroundColor Green
                    break
                }
            }
        } catch {
            Write-Host "  Method 2 failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Method 3: Use robocopy to delete (Windows native, handles symlinks better)
        try {
            if (Test-Path $nextDir) {
                $emptyDir = Join-Path $env:TEMP "empty_next_$(Get-Random)"
                New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
                robocopy $emptyDir $nextDir /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS | Out-Null
                Remove-Item -Path $emptyDir -Force -ErrorAction SilentlyContinue
                Remove-Item -Path $nextDir -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
                
                if (-not (Test-Path $nextDir)) {
                    $success = $true
                    Write-Host "✓ Successfully cleaned .next directory (method 3)" -ForegroundColor Green
                    break
                }
            }
        } catch {
            Write-Host "  Method 3 failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    if (-not $success -and $retryCount -lt $maxRetries) {
        Write-Host "Waiting before retry..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if (-not $success) {
    Write-Host "⚠ Warning: Could not completely clean .next directory" -ForegroundColor Yellow
    Write-Host "  You may need to:" -ForegroundColor Yellow
    Write-Host "  1. Close all applications using the directory" -ForegroundColor Yellow
    Write-Host "  2. Exclude .next from OneDrive syncing" -ForegroundColor Yellow
    Write-Host "  3. Manually delete the directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green

