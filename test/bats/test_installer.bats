#!/usr/bin/env bats

# This test assumes we run INSIDE the checked-out repo.
# It does NOT require your TS scripts to do symlinks yet.

setup() {
  set -euo pipefail
  export REPO_ROOT="$(cd "$(dirname "${BATS_TEST_FILENAME}")/../.." && pwd)"
  export HOME="$(mktemp -d)"            # isolate HOME
  export XDG_CONFIG_HOME="$HOME/.config"
  
  # Configure git for CI environments
  git config --global user.email "test@example.com" 2>/dev/null || true
  git config --global user.name "Test User" 2>/dev/null || true
  git config --global init.defaultBranch main 2>/dev/null || true
  
  cd "$REPO_ROOT"
}

teardown() {
  # Clean up the temporary HOME directory
  if [ -n "${HOME:-}" ] && [ -d "$HOME" ] && [[ "$HOME" == /tmp/* ]]; then
    rm -rf "$HOME"
  fi
}

@test "install.sh runs and prints Files then Software" {
  run ./install.sh
  
  # Debug output for CI
  echo "Exit status: $status" >&2
  echo "Output: $output" >&2
  
  [ "$status" -eq 0 ]

  # Check that both markers appear in output
  echo "$output" | grep -q "Files"
  echo "$output" | grep -q "Software"

  # Check order: Files appears before Software
  files_line=$(echo "$output" | grep -n "Files" | head -1 | cut -d: -f1)
  software_line=$(echo "$output" | grep -n "Software" | head -1 | cut -d: -f1)
  
  [ "$files_line" -lt "$software_line" ]
}

@test "install-files symlinks dotfiles into HOME" {
  run ./install.sh
  [ "$status" -eq 0 ]

  for f in .bashrc .zshrc .gitconfig .tmux.conf .aliases.sh; do
    [ -L "$HOME/$f" ]
  done

  cmp -s "$HOME/.bashrc"     "$REPO_ROOT/dotfiles/bashrc"
  cmp -s "$HOME/.zshrc"      "$REPO_ROOT/dotfiles/zshrc"
  cmp -s "$HOME/.gitconfig"  "$REPO_ROOT/dotfiles/gitconfig"
  cmp -s "$HOME/.tmux.conf"  "$REPO_ROOT/dotfiles/tmux.conf"
  cmp -s "$HOME/.aliases.sh" "$REPO_ROOT/dotfiles/aliases.sh"
}

@test "deno is available in the same process after install" {
  # First run the installer
  ./install.sh >/dev/null 2>&1
  
  # Check if deno is in PATH
  # The ensure_deno function should have added it to PATH
  if [ -d "$HOME/.deno/bin" ]; then
    export PATH="$HOME/.deno/bin:$PATH"
  fi
  
  command -v deno >/dev/null 2>&1
}

@test "install.sh is idempotent (2nd run ok)" {
  # First run
  run ./install.sh
  [ "$status" -eq 0 ]
  first_output="$output"
  
  # Second run should also succeed
  run ./install.sh
  [ "$status" -eq 0 ]
  
  # Both runs should produce the markers
  echo "$output" | grep -q "Files"
  echo "$output" | grep -q "Software"
}
