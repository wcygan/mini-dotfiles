# mini-dotfiles: shared aliases (bash & zsh)

# General
alias c='clear'
alias dt='deno task'

# Reload current shell as login to re-source rc files
alias reload='exec "$SHELL" -l'

# Refresh command lookup cache (bash/zsh)
rehash_path() {
  hash -r 2>/dev/null || true
  command -v rehash >/dev/null 2>&1 && rehash || true
}
alias rpath='rehash_path'

# Git
alias gs='git status'
alias gd='git diff'
alias gc='git commit'
alias gaa='git add .'
alias gp='git push'
alias gpr='git pull --rebase'
alias gm='git merge'
alias gl='git log'
alias gca='git commit --amend --no-edit'
alias gpr='git pull --rebase'
alias lg='lazygit'
