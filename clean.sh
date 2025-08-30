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

log() { printf "%s\n" "$*"; }
info() { printf "[INFO] %s\n" "$*"; }
warn() { printf "[WARN] %s\n" "$*" 1>&2; }
err()  { printf "[ERROR] %s\n" "$*" 1>&2; }

run() {
  if $DRY_RUN; then
    info "DRY-RUN: $*"
  else
    $VERBOSE && info "RUN: $*"
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
)

##############################################################################
# 03. Cleanup                                                                #
##############################################################################

remove_managed_link() {
  # remove_managed_link <source> <dest>
  local src="$1"
  local dst="$2"

  if [ ! -e "$src" ]; then
    warn "Source missing (skipping): $src"
    return 0
  fi

  if [ -L "$dst" ]; then
    local target
    target="$(readlink "$dst" || true)"
    if [ "$target" = "$src" ]; then
      info "Removing symlink $dst -> $src"
      run "rm -f '$dst'"
    else
      warn "Skipping: $dst is a symlink to a different target ($target)"
    fi
  elif [ -e "$dst" ]; then
    warn "Skipping: $dst exists and is not a symlink"
  else
    info "No-op: $dst does not exist"
  fi
}

cleanup_links() {
  info "Cleaning repo-managed symlinks..."
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
  info "Starting mini-dotfiles cleanup"
  info "Preamble: remove repo-managed symlinks if present."
  if confirm "Remove symlinks managed by mini-dotfiles?"; then
    cleanup_links
    info "Cleanup complete."
  else
    warn "Cleanup aborted by user."
  fi
}

main "$@"

