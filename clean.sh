#!/usr/bin/env bash

##############################################################################
#   Filename: clean.sh                                                       #
# Maintainer: Will Cygan <wcygan.io@gmail.com>                               #
#        URL: http://github.com/wcygan/mini-dotfiles                         #
#                                                                            #
# Sections:                                                                  #
#   01. Preamble & Globals .... Flags, logging, helpers                      #
#   02. Targets ................ Which symlinks are managed                  #
#   03. Cleanup ............... Remove repo-managed symlinks safely          #
#   04. CLI & Entry Point ...... Args, usage, and main                       #
##############################################################################

##############################################################################
# 01. Preamble & Globals                                                     #
##############################################################################

set -euo pipefail

YES=false
DRY_RUN=false
VERBOSE=false

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="${SCRIPT_DIR}/dotfiles"

#!/usr/bin/env bash

# Color + emoji logging ------------------------------------------------------
# Disable with NO_COLOR=1 or when not a TTY.
_enable_color=false
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  if command -v tput >/dev/null 2>&1 && [ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]; then
    _enable_color=true
  fi
fi

if $_enable_color; then
  C_RESET="$(tput sgr0)"
  C_BOLD="$(tput bold)"
  C_RED="$(tput setaf 1)"
  C_GREEN="$(tput setaf 2)"
  C_YELLOW="$(tput setaf 3)"
  C_BLUE="$(tput setaf 4)"
  C_MAGENTA="$(tput setaf 5)"
  C_CYAN="$(tput setaf 6)"
else
  C_RESET=""; C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_MAGENTA=""; C_CYAN=""
fi

EMOJI_INFO="ℹ️"; EMOJI_WARN="⚠️"; EMOJI_ERROR="❌"; EMOJI_OK="✅"; EMOJI_RUN="▶️"

log() { printf "%s\n" "$*"; }
info() { printf "%s%s %s[INFO]%s %s\n" "$C_BLUE" "$EMOJI_INFO" "$C_BOLD" "$C_RESET" "$*"; }
warn() { printf "%s%s %s[WARN]%s %s\n" "$C_YELLOW" "$EMOJI_WARN" "$C_BOLD" "$C_RESET" "$*" 1>&2; }
err()  { printf "%s%s %s[ERROR]%s %s\n" "$C_RED" "$EMOJI_ERROR" "$C_BOLD" "$C_RESET" "$*" 1>&2; }
ok()   { printf "%s%s %s[OK]%s %s\n" "$C_GREEN" "$EMOJI_OK" "$C_BOLD" "$C_RESET" "$*"; }

run() {
  if $DRY_RUN; then
    printf "%s🧪 %s[DRY-RUN]%s %s\n" "$C_MAGENTA" "$C_BOLD" "$C_RESET" "$*"
  else
    if $VERBOSE; then
      printf "%s%s %s[RUN]%s %s\n" "$C_CYAN" "$EMOJI_RUN" "$C_BOLD" "$C_RESET" "$*"
    fi
    eval "$@"
  fi
}

confirm() {
  local prompt=${1:-"Proceed?"}
  if $YES; then return 0; fi
  read -r -p "$prompt [y/N] " reply || reply=""
  case "$reply" in
    [yY][eE][sS]|[yY]) return 0 ;;
    *) return 1 ;;
  esac
}

##############################################################################
# 02. Targets                                                                #
##############################################################################

# List of repo-managed links: <source> -> <dest>
TARGETS=(
  "$DOTFILES_DIR/zshrc|$HOME/.zshrc"
  "$DOTFILES_DIR/bashrc|$HOME/.bashrc"
  "$DOTFILES_DIR/gitconfig|$HOME/.gitconfig"
  "$DOTFILES_DIR/aliases.sh|$HOME/.aliases.sh"
  "$DOTFILES_DIR/tmux.conf|$HOME/.tmux.conf"
)

##############################################################################
# 03. Cleanup                                                                #
##############################################################################

remove_managed_link() {
  # remove_managed_link <source> <dest>
  local src="$1"
  local dst="$2"

  if [ ! -e "$src" ]; then
    warn "❓ Source missing (skipping): $src"
    return 0
  fi

  if [ -L "$dst" ]; then
    local target
    target="$(readlink "$dst" || true)"
    if [ "$target" = "$src" ]; then
      info "🔗🗑️  Removing symlink $dst -> $src"
      run "rm -f '$dst'"
    else
      warn "⏭️  Skipping: $dst is a symlink to a different target ($target)"
    fi
  elif [ -e "$dst" ]; then
    warn "🧱 Skipping: $dst exists and is not a symlink"
  else
    info "🫥 No-op: $dst does not exist"
  fi
}

cleanup_links() {
  info "🧹 Cleaning repo-managed symlinks..."
  local entry src dst
  for entry in "${TARGETS[@]}"; do
    src="${entry%%|*}"
    dst="${entry##*|}"
    remove_managed_link "$src" "$dst"
  done
}

##############################################################################
# 04. CLI & Entry Point                                                      #
##############################################################################

usage() {
  cat <<EOF
mini-dotfiles cleanup

Usage: ./clean.sh [options]

Removes symlinks created by ./install.sh when they still point to files in
this repository's dotfiles directory. Safe and idempotent; won't delete
non-symlink files or symlinks pointing elsewhere.

Options:
  --yes           Assume yes for prompts
  --dry-run       Print actions without executing
  --verbose       Print commands as they run
  -h, --help      Show this help
EOF
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --yes) YES=true ;;
      --dry-run) DRY_RUN=true ;;
      --verbose) VERBOSE=true ;;
      -h|--help) usage; exit 0 ;;
      *) err "Unknown option: $1"; usage; exit 1 ;;
    esac
    shift
  done
}

main() {
  parse_args "$@"
  info "🚀 Starting mini-dotfiles cleanup"
  info "🧰 Preamble: remove repo-managed symlinks if present."
  if confirm "Remove symlinks managed by mini-dotfiles?"; then
    cleanup_links
    ok "🎉 Cleanup complete."
  else
    warn "Cleanup aborted by user."
  fi
}

main "$@"
