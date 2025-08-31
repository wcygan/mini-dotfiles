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
  # Robust detection: include the intended bin dir for verification only.
  # This avoids false negatives before the user's shell PATH is updated.
  VERIFY_PATH="$HOME/.deno/bin:$PATH"
  if PATH="$VERIFY_PATH" command -v deno >/dev/null 2>&1; then
    # Ensure this process can invoke deno without modifying user profiles.
    if ! command -v deno >/dev/null 2>&1 && [ -d "$HOME/.deno/bin" ]; then
      PATH="$HOME/.deno/bin:$PATH"; export PATH
    fi
    echo "Deno already installed at: $(PATH="$VERIFY_PATH" command -v deno)"
    return 0
  fi

  echo "Deno not found. Installing..."
  # Use non-interactive install and avoid modifying shell profiles here.
  # We manage PATH via our dotfiles; see dotfiles/bashrc and dotfiles/zshrc.
  curl -fsSL https://deno.land/install.sh | sh -s -- -y --no-modify-path

  # Make deno visible to *this* process:
  if [ -d "$HOME/.deno/bin" ]; then
    PATH="$HOME/.deno/bin:$PATH"; export PATH
  fi
}


main() {
  ensure_in_repo
  ensure_deno
  deno task install

  # Post-install: optional auto-reload of the current shell (opt-in)
  # Use DOTFILES_RELOAD=1 to replace the current shell with a login shell.
  # This is off by default because scripts cannot modify their parent shell
  # environment portably and auto-replacing shells can surprise users.
  if [ "${DOTFILES_RELOAD:-0}" = "1" ] && [ -n "${SHELL:-}" ] && [ -t 1 ]; then
    echo "Reloading current shell as login shell (DOTFILES_RELOAD=1)…"
    exec "$SHELL" -l
  fi

  # Otherwise, print a friendly hint.
  echo
  echo "Next steps: reload your shell so PATH changes apply."
  echo "  Generic: exec \"\$SHELL\" -l"
  # Best-effort hints for common shells
  case "${SHELL:-}" in
    *bash) echo "  bash:    exec bash -l    (# or: source ~/.bashrc)" ;;
    *zsh)  echo "  zsh:     exec zsh -l     (# or: source ~/.zshrc)" ;;
    *fish) echo "  fish:    exec fish -l" ;;
  esac
}

main "$@"
