#!/usr/bin/env sh

set -eu

# Ensure we're operating inside the correct git repository.
# If not, clone it, cd into it, and re-run this script.
REPO_CANON="github.com/wcygan/mini-dotfiles"

in_target_repo=false
if command -v git >/dev/null 2>&1; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    remote_url="$(git config --get remote.origin.url 2>/dev/null || true)"
    if [ -n "${remote_url}" ]; then
      # Normalize remote URL to the form: github.com/user/repo
      canon_url="$(printf %s "${remote_url}" | sed -E 's#^[a-zA-Z]+://##; s#^git@##; s#:#/#')"
      case "${canon_url}" in
        *.git) canon_url=${canon_url%.git} ;;
      esac
      if [ "${canon_url}" = "${REPO_CANON}" ]; then
        in_target_repo=true
      fi
    fi
  fi
fi

if [ "${in_target_repo}" != "true" ]; then
  echo "Not in ${REPO_CANON}. Cloning and re-running installer..."
  if ! command -v git >/dev/null 2>&1; then
    echo "git is required to clone ${REPO_CANON}. Please install git and retry."
    exit 1
  fi
  if [ ! -d "mini-dotfiles/.git" ]; then
    git clone git@github.com:wcygan/mini-dotfiles.git
  else
    echo "Directory 'mini-dotfiles' already exists. Reusing it."
  fi
  cd mini-dotfiles
  exec ./install.sh
fi

# Install Deno if not already available on PATH
if ! command -v deno >/dev/null 2>&1; then
  echo "Deno not found. Installing..."
  curl -fsSL https://deno.land/install.sh | sh
else
  echo "Deno already installed at: $(command -v deno)"
fi

# Delegate to Deno for installation
deno task install
