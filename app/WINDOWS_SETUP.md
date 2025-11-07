# Windows Setup Guide for EmpowerGRID

This guide addresses Windows-specific setup issues, particularly when working with OneDrive-synced directories.

## Common Issues

### 1. Next.js Symlink Errors with OneDrive

**Problem:** Next.js may fail to start with errors like:
```
Error: EINVAL: invalid argument, readlink 'C:\Users\...\OneDrive\...\app\.next\trace'
```

**Cause:** OneDrive's syncing can interfere with Next.js's symlink creation in the `.next` directory.

**Solutions:**

#### Option A: Exclude .next from OneDrive (Recommended)
1. Right-click on the `.next` folder
2. Select "OneDrive" → "Free up space" or "Always keep on this device"
3. Or add `.next` to OneDrive's exclusion list:
   - Settings → Sync and backup → Advanced settings → Choose folders
   - Exclude the `.next` directory

#### Option B: Use Cleanup Script
Run the provided cleanup script before starting the dev server:
```powershell
# PowerShell
.\app\scripts\clean-next.ps1

# Or Git Bash/WSL
bash app/scripts/clean-next.sh
```

#### Option C: Work Outside OneDrive
Move your project to a non-OneDrive location:
```powershell
# Example: Move to C:\dev
mkdir C:\dev
# Copy or move your project there
```

### 2. Port Already in Use

**Problem:** `localhost:3000` is already in use.

**Solution:**
```powershell
# Find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use the cleanup script which handles this automatically
```

### 3. PowerShell Script Execution Policy

**Problem:** Scripts won't run due to execution policy.

**Solution:**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Quick Start

1. **Clean build directory:**
   ```powershell
   cd app
   .\scripts\clean-next.ps1
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm run dev
   ```

## Package.json Scripts

Add these scripts to `package.json` for convenience:

```json
{
  "scripts": {
    "clean": "node scripts/clean-next.js || powershell -ExecutionPolicy Bypass -File scripts/clean-next.ps1",
    "dev:clean": "npm run clean && npm run dev",
    "dev:safe": "npm run clean && npm run dev"
  }
}
```

## Troubleshooting

### Server Won't Start

1. **Check for Node processes:**
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue
   Stop-Process -Name node -Force
   ```

2. **Clean .next directory:**
   ```powershell
   Remove-Item -Path .next -Recurse -Force
   ```

3. **Check port availability:**
   ```powershell
   netstat -ano | findstr :3000
   ```

4. **Verify routing conflicts:**
   - Ensure no duplicate dynamic routes (`[id]` vs `[projectId]`)
   - Check for conflicting route names

### Build Errors

1. **Clear all caches:**
   ```powershell
   Remove-Item -Path .next -Recurse -Force
   Remove-Item -Path node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
   npm cache clean --force
   ```

2. **Reinstall dependencies:**
   ```powershell
   Remove-Item -Path node_modules -Recurse -Force
   npm install
   ```

### Database Connection Issues

1. **Verify DATABASE_URL in .env.local:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/empowergrid"
   ```

2. **Check PostgreSQL is running:**
   ```powershell
   # Using Docker
   docker-compose ps

   # Or check Windows service
   Get-Service -Name postgresql*
   ```

## Best Practices

1. **Exclude from OneDrive:**
   - `.next/`
   - `node_modules/`
   - `.env.local`
   - `.git/` (if using Git)

2. **Use WSL2 for better compatibility:**
   - Install Windows Subsystem for Linux
   - Run commands from WSL terminal
   - Better symlink support

3. **Regular cleanup:**
   - Run cleanup script before major operations
   - Clear `.next` when switching branches
   - Restart dev server after major dependency changes

## Additional Resources

- [Next.js Windows Setup](https://nextjs.org/docs/getting-started/installation)
- [OneDrive Sync Issues](https://support.microsoft.com/en-us/onedrive)
- [PowerShell Scripting](https://docs.microsoft.com/en-us/powershell/)

