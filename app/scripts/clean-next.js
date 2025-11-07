#!/usr/bin/env node
/**
 * Cross-platform script to clean Next.js .next directory
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const NEXT_DIR = path.join(__dirname, '..', '.next');

console.log('🧹 Cleaning Next.js build directory...');

function isWindows() {
  return process.platform === 'win32';
}

function killNodeProcesses() {
  try {
    if (isWindows()) {
      execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "next dev" || true', { stdio: 'ignore' });
    }
    // Wait a bit for processes to die
    setTimeout(() => {}, 2000);
  } catch (error) {
    // Ignore errors - processes might not be running
  }
}

function removeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log('✓ .next directory doesn\'t exist, nothing to clean');
    return true;
  }

  console.log(`Found .next directory at: ${dir}`);

  // Kill any running Node processes
  console.log('Stopping Node.js processes...');
  killNodeProcesses();

  try {
    // Try standard recursive delete
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    
    // Verify deletion
    if (!fs.existsSync(dir)) {
      console.log('✅ Cleanup complete!');
      return true;
    } else {
      console.log('⚠ Warning: Directory still exists after cleanup');
      return false;
    }
  } catch (error) {
    console.error('❌ Error cleaning directory:', error.message);
    console.log('\n⚠ Manual cleanup may be required:');
    console.log('  1. Close all applications using the directory');
    console.log('  2. Exclude .next from OneDrive syncing');
    console.log('  3. Manually delete the directory');
    return false;
  }
}

// Main execution
const success = removeDirectory(NEXT_DIR);
process.exit(success ? 0 : 1);

