#!/usr/bin/env bash

##############################################################################
#   Filename: install.sh                                                     #
# Maintainer: Will Cygan <wcygan.io@gmail.com>                               #
#        URL: http://github.com/wcygan/mini-dotfiles                         #
#                                                                            #
# Sections:                                                                  #
#   01. Preamble & Globals .... Flags, logging, helpers                      #
#   02. OS Detection ........... Identify platform and package manager       #
#   03. Package Bootstrap ...... Install/update base tools                   #
#   04. Shell Setup ............ Preferred shell & chsh                      #
#   05. Dotfiles Linking ....... Symlink with backups                        #
#   06. CLI & Entry Point ...... Args, usage, and main                       #
##############################################################################

##############################################################################
# 01. Preamble & Globals                                                     #
##############################################################################

set -euo pipefail

# Globals
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
# 02. OS Detection                                                           #
##############################################################################

detect_platform() {
  local uname_s
  uname_s=$(uname -s)
  case "$uname_s" in
    Darwin) OS="macos" ;;
    Linux) OS="linux" ;;
    *) err "Unsupported OS: $uname_s"; exit 1 ;;
  esac

  if [ "$OS" = "macos" ]; then
    PKG_MGR="brew"
  else
    if command -v apt-get >/dev/null 2>&1; then
      PKG_MGR="apt"
    elif command -v dnf >/dev/null 2>&1; then
      PKG_MGR="dnf"
    else
      PKG_MGR="unknown"
    fi
  fi

  info "Detected OS: $OS; package manager: $PKG_MGR"
}

##############################################################################
# 03. Package Bootstrap                                                      #
##############################################################################

bootstrap_package_manager() {
  case "$PKG_MGR" in
    brew)
      if ! command -v brew >/dev/null 2>&1; then
        info "Homebrew not found; installing..."
        if confirm "Install Homebrew?"; then
          run "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
          # Ensure brew in PATH for current session (Apple Silicon + Intel)
          if [ -d "/opt/homebrew/bin" ]; then eval "$($DRY_RUN && echo ":" || /opt/homebrew/bin/brew shellenv)" 2>/dev/null || true; fi
          if [ -d "/usr/local/bin" ]; then eval "$($DRY_RUN && echo ":" || /usr/local/bin/brew shellenv)" 2>/dev/null || true; fi
        else
          warn "Skipped Homebrew installation."
        fi
      else
        info "Homebrew present. Updating taps..."
        run "brew update"
      fi
      ;;
    apt)
      info "Updating apt and installing basics (git curl zsh)..."
      run "sudo apt-get update -y"
      run "sudo apt-get install -y git curl zsh"
      ;;
    dnf)
      info "Updating dnf and installing basics (git curl zsh)..."
      run "sudo dnf -y update --refresh"
      run "sudo dnf -y install git curl zsh"
      ;;
    *)
      warn "No supported package manager detected; skipping bootstrap."
      ;;
  esac
}

##############################################################################
# 04. Shell Setup                                                            #
##############################################################################

ensure_shell() {
  # Prefer zsh if available
  local preferred_shell
  if command -v zsh >/dev/null 2>&1; then
    preferred_shell="$(command -v zsh)"
  else
    preferred_shell="$(command -v bash || true)"
  fi

  if [ -n "${preferred_shell}" ] && [ "$SHELL" != "$preferred_shell" ]; then
    info "Default shell is $SHELL; preferred is $preferred_shell"
    if confirm "Change default shell to $preferred_shell for user $(whoami)?"; then
      if ! grep -q "$preferred_shell" /etc/shells 2>/dev/null; then
        warn "$preferred_shell not in /etc/shells; attempting to add (requires sudo)."
        run "echo $preferred_shell | sudo tee -a /etc/shells >/dev/null"
      fi
      run "chsh -s $preferred_shell"
    else
      warn "Skipped changing default shell."
    fi
  else
    info "Shell is already set to preferred or no alternative found."
  fi
}

##############################################################################
# 05. Dotfiles Linking                                                       #
##############################################################################

backup_file() {
  # backup_file <path>
  local target="$1"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ -L "$target" ] && [ "$(readlink "$target" || true)" = "$2" ]; then
      return 0
    fi
    local ts
    ts=$(date +%Y%m%d-%H%M%S)
    local backup="${target}.bak.${ts}"
    warn "Backing up $target -> $backup"
    run "mv -f '$target' '$backup'"
  fi
}

link_file() {
  # link_file <source> <dest>
  local src="$1"
  local dst="$2"
  if [ ! -e "$src" ]; then
    warn "Source missing: $src (skipping)"
    return 0
  fi
  mkdir -p "$(dirname "$dst")"
  if [ -L "$dst" ] && [ "$(readlink "$dst" || true)" = "$src" ]; then
    info "Link exists: $dst -> $src"
    return 0
  fi
  backup_file "$dst" "$src"
  info "Linking $dst -> $src"
  run "ln -s '$src' '$dst'"
}

link_dotfiles() {
  info "Linking basic dotfiles..."
  link_file "${DOTFILES_DIR}/zshrc" "$HOME/.zshrc"
  link_file "${DOTFILES_DIR}/bashrc" "$HOME/.bashrc"
  link_file "${DOTFILES_DIR}/gitconfig" "$HOME/.gitconfig"
}

##############################################################################
# 06. CLI & Entry Point                                                      #
##############################################################################

usage() {
  cat <<EOF
mini-dotfiles installer

Usage: ./install.sh [options]

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
  info "Starting mini-dotfiles installation"
  info "Preamble: detect OS, bootstrap packages, set shell, link dotfiles."
  detect_platform
  bootstrap_package_manager
  ensure_shell
  link_dotfiles
  info "Done. You may restart your shell to apply changes."
}

main "$@"
