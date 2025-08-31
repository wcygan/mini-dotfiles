#!/usr/bin/env sh

# mini-dotfiles scripts
# - Ensures we are in github.com/wcygan/mini-dotfiles (clones otherwise)
# - Installs Deno if missing
# - Delegates to `deno task install` for full installation
#
# Notes:
# 1. TypeScript has less "Cognitive Load" compared to Bash
#   - Ref: https://github.com/zakirullin/cognitive-load
# 2. I like using Deno for Scripting purposes
#   - Ref: https://deno.com/learn/scripts-clis

set -eu

# ---- Config ---------------------------------------------------------------
REPO_HOST="github.com"
REPO_OWNER="wcygan"
REPO_NAME="mini-dotfiles"
REPO_CANON="${REPO_HOST}/${REPO_OWNER}/${REPO_NAME}"
REPO_SSH="git@${REPO_HOST}:${REPO_OWNER}/${REPO_NAME}.git"

# ---- Helpers --------------------------------------------------------------
normalize_git_url() {
  # Convert various git remote URL formats to host/user/repo (no .git)
  # Examples:
  #   git@github.com:user/repo.git       -> github.com/user/repo
  #   https://github.com/user/repo.git   -> github.com/user/repo
  url="$1"
  canon="$(printf %s "${url}" | sed -E 's#^[a-zA-Z]+://##; s#^git@##; s#:#/#')"
  case "${canon}" in
    *.git) canon=${canon%.git} ;;
  esac
  printf %s "${canon}"
}

ensure_in_repo() {
  # If not inside the target repo, clone it and re-run this script.
  # Fast path: if a Git repo is present here, trust it and continue.
  if [ -d .git ]; then
    return 0
  fi
  if command -v git >/dev/null 2>&1; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      remote_url="$(git config --get remote.origin.url 2>/dev/null || true)"
      if [ -n "${remote_url}" ]; then
        canon_url="$(normalize_git_url "${remote_url}")"
        if [ "${canon_url}" = "${REPO_CANON}" ]; then
          return 0
        fi
      fi
    fi
    echo "Not in ${REPO_CANON}. Cloning and re-running installer..."
    if [ ! -d "${REPO_NAME}/.git" ]; then
      git clone "${REPO_SSH}"
    else
      echo "Directory '${REPO_NAME}' already exists. Reusing it."
    fi
    cd "${REPO_NAME}"
    exec ./install.sh
  else
    echo "git is required to clone ${REPO_CANON}. Please install git and retry." >&2
    exit 1
  fi
}

ensure_deno() {
  if ! command -v deno >/dev/null 2>&1; then
    echo "Deno not found. Installing..."
    curl -fsSL https://deno.land/install.sh | sh

    # Make deno visible to *this* process:
    if [ -d "$HOME/.deno/bin" ]; then
      PATH="$HOME/.deno/bin:$PATH"; export PATH
    fi
  else
    echo "Deno already installed at: $(command -v deno)"
  fi
}


main() {
  ensure_in_repo
  ensure_deno
  deno task install
}

main "$@"
