#!/usr/bin/env sh

# Install Deno if not already available on PATH
set -eu

if ! command -v deno >/dev/null 2>&1; then
  echo "Deno not found. Installing..."
  curl -fsSL https://deno.land/install.sh | sh
else
  echo "Deno already installed at: $(command -v deno)"
fi

# Delegate to Deno for installation
deno task install