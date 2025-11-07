#!/bin/bash
# Bash script to safely clean Next.js .next directory
# Works on Linux, macOS, and Windows (Git Bash/WSL)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEXT_DIR="$SCRIPT_DIR/../.next"

echo "🧹 Cleaning Next.js build directory..."

if [ ! -d "$NEXT_DIR" ]; then
    echo "✓ .next directory doesn't exist, nothing to clean"
    exit 0
fi

echo "Found .next directory at: $NEXT_DIR"

# Stop any running Node processes
echo "Stopping Node.js processes..."
pkill -f "next dev" || true
sleep 2

# Remove the directory
echo "Removing .next directory..."
rm -rf "$NEXT_DIR"

if [ ! -d "$NEXT_DIR" ]; then
    echo "✅ Cleanup complete!"
    exit 0
else
    echo "⚠ Warning: Could not completely clean .next directory"
    exit 1
fi

