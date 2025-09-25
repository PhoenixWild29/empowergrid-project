#!/usr/bin/env bash
set -eo pipefail

# Build the Anchor program and deploy to the configured cluster.
# After running this script, copy the program ID into both
# programs/empower_grid/Anchor.toml and app/.env.local (for RPC usage).

anchor build
anchor keys list
anchor deploy