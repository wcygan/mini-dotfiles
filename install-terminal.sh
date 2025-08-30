#!/usr/bin/env bash

##############################################################################
#   Filename: install-terminal.sh                                            #
# Maintainer: Will Cygan <wcygan.io@gmail.com>                               #
#        URL: http://github.com/wcygan/mini-dotfiles                         #
#                                                                            #
# Purpose: Install terminal programs in a platform-agnostic way.            #
#          Starts with: starship (prompt).                                   #
#                                                                            #
# Flags: --yes, --dry-run, --verbose, -h/--help                              #
##############################################################################

set -euo pipefail

YES=false
DRY_RUN=false
VERBOSE=false

# Logging (colors + emojis); respects NO_COLOR
_enable_color=false
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  if command -v tput >/dev/null 2>&1 && [ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]; then
    _enable_color=true
  fi
fi
if $_enable_color; then
  C_RESET="$(tput sgr0)"; C_BOLD="$(tput bold)"
  C_RED="$(tput setaf 1)"; C_GREEN="$(tput setaf 2)"; C_YELLOW="$(tput setaf 3)"; C_BLUE="$(tput setaf 4)"; C_MAGENTA="$(tput setaf 5)"; C_CYAN="$(tput setaf 6)"
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
  case "$reply" in [yY][eE][sS]|[yY]) return 0 ;; *) return 1 ;; esac
}

detect_platform() {
  local uname_s; uname_s=$(uname -s)
  case "$uname_s" in
    Darwin) OS="macos" ;;
    Linux) OS="linux" ;;
    *) err "Unsupported OS: $uname_s"; exit 1 ;;
  esac
  if [ "$OS" = "macos" ]; then
    PKG_MGR="brew"
  else
    if command -v apt-get >/dev/null 2>&1; then PKG_MGR="apt"
    elif command -v dnf >/dev/null 2>&1; then PKG_MGR="dnf"
    else PKG_MGR="unknown"; fi
  fi
  info "🧭 Detected OS: $OS; package manager: $PKG_MGR"
}

config_dir() {
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    printf "%s\n" "$XDG_CONFIG_HOME"
  else
    printf "%s\n" "$HOME/.config"
  fi
}

ensure_unzip() {
  if command -v unzip >/dev/null 2>&1; then return 0; fi
  case "$PKG_MGR" in
    brew) info "📦 Installing unzip via brew"; run "brew install unzip" ;;
    apt)  info "📦 Installing unzip via apt"; run "sudo apt-get update -y"; run "sudo apt-get install -y unzip" ;;
    dnf)  info "📦 Installing unzip via dnf"; run "sudo dnf -y install unzip" ;;
    *) warn "🚫 unzip not found and no known package manager; font install may fail." ;;
  esac
}

install_nerd_fonts() {
  # Install a Nerd Font (JetBrains Mono) for powerline glyphs.
  local installed=false
  case "$OS" in
    macos)
      # Detect via user font directory (preferred) or fontconfig if available
      if ls "$HOME/Library/Fonts" 2>/dev/null | grep -Eqi "JetBrainsMono.*Nerd.*Font.*ttf"; then installed=true; fi || true
      if ! $installed && command -v fc-list >/dev/null 2>&1; then
        if fc-list | grep -qi "JetBrainsMono Nerd Font"; then installed=true; fi || true
      fi
      if ! $installed; then
        info "🔤 Installing JetBrains Mono Nerd Font (macOS)"
        # First, try Homebrew cask directly (tap is deprecated/empty)
        run "brew install --cask font-jetbrains-mono-nerd-font" || true
        # Re-check; if still missing, fallback to direct download
        if ! ls "$HOME/Library/Fonts" 2>/dev/null | grep -Eqi "JetBrainsMono.*Nerd.*Font.*ttf"; then
          warn "Homebrew font install not available; falling back to direct download"
          ensure_curl
          local tmpd
          tmpd="$(mktemp -d)"
          run "curl -fsSL -o '$tmpd/JetBrainsMono.tar.xz' 'https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.tar.xz'"
          run "mkdir -p '$tmpd/extract'"
          run "tar -xJf '$tmpd/JetBrainsMono.tar.xz' -C '$tmpd/extract'"
          run "mkdir -p '$HOME/Library/Fonts'"
          run "cp -f '$tmpd'/extract/*.ttf '$HOME/Library/Fonts/'"
        fi
      else
        ok "🔤 Nerd Font already present"
      fi
      ;;
    linux)
      local font_dir="$HOME/.local/share/fonts"
      if ls "$font_dir" 2>/dev/null | grep -Eqi "JetBrainsMono.*Nerd.*Font.*ttf"; then installed=true; fi || true
      if ! $installed; then
        info "🔤 Installing JetBrains Mono Nerd Font (Linux user fonts)"
        ensure_curl
        ensure_unzip
        run "mkdir -p '$font_dir'"
        run "curl -fsSL -o '$font_dir/JetBrainsMono.zip' 'https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip'"
        run "unzip -o '$font_dir/JetBrainsMono.zip' -d '$font_dir' >/dev/null"
        run "rm -f '$font_dir/JetBrainsMono.zip'"
        if command -v fc-cache >/dev/null 2>&1; then run "fc-cache -fv '$font_dir'"; fi
      else
        ok "🔤 Nerd Font already present"
      fi
      ;;
  esac
}

ensure_curl() {
  if command -v curl >/dev/null 2>&1; then return 0; fi
  case "$PKG_MGR" in
    brew) info "📦 Installing curl via brew"; run "brew install curl" ;;
    apt)  info "📦 Installing curl via apt";  run "sudo apt-get update -y"; run "sudo apt-get install -y curl" ;;
    dnf)  info "📦 Installing curl via dnf";  run "sudo dnf -y install curl" ;;
    *) warn "🚫 No known package manager to install curl; starship install may fail." ;;
  esac
}

install_starship() {
  if command -v starship >/dev/null 2>&1; then
    ok "🚀 starship already installed; skipping"
    return 0
  fi
  info "🚀 Installing starship prompt"
  case "$PKG_MGR" in
    brew)
      run "brew install starship"
      ;;
    apt|dnf|unknown)
      ensure_curl
      # Official script, non-interactive (-y)
      run "curl -sS https://starship.rs/install.sh | sh -s -- -y"
      ;;
  esac
  if command -v starship >/dev/null 2>&1; then ok "✨ starship installed"; else err "Failed to install starship"; fi
}

apply_starship_preset() {
  if ! command -v starship >/dev/null 2>&1; then
    warn "Starship not found; skipping preset application"
    return 0
  fi
  local cfg_dir cfg_file ts backup
  cfg_dir="$(config_dir)"
  cfg_file="$cfg_dir/starship.toml"
  run "mkdir -p '$cfg_dir'"
  if [ -f "$cfg_file" ]; then
    ts=$(date +%Y%m%d-%H%M%S)
    backup="${cfg_file}.bak.${ts}"
    warn "💾 Backing up existing starship config -> $backup"
    run "mv -f '$cfg_file' '$backup'"
  fi
  info "🎨 Applying Starship preset: Catppuccin Powerline"
  if $DRY_RUN; then
    info "DRY-RUN: starship preset catppuccin-powerline -o '$cfg_file'"
  else
    run "starship preset catppuccin-powerline -o '$cfg_file'"
  fi
}

usage() {
  cat <<EOF
Install terminal programs (platform-agnostic)

Usage: ./install-terminal.sh [options]

Programs:
  - starship: cross-shell prompt

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
  info "🚀 Starting terminal tools installation"
  detect_platform
  # Fonts first for powerline glyphs
  install_nerd_fonts
  install_starship
  apply_starship_preset
  ok "🎉 Terminal tools installation complete"
  info "ℹ️ To enable starship in your shell, ensure your rc files include the init lines."
}

main "$@"
