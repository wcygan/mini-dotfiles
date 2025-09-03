# mini-dotfiles: fish config (minimal, platform-agnostic)

# Helper: add path if directory exists, duplications avoided when fish_add_path exists
function __add_path_safe --argument-names dir
    if test -d $dir
        if functions -q fish_add_path
            fish_add_path --path $dir
        else
            set -gx PATH $dir $PATH
        end
    end
end

# Paths
__add_path_safe "$HOME/.deno/bin"
__add_path_safe "$HOME/.local/bin"
__add_path_safe "$HOME/.fzf/bin"

# Homebrew (macOS) common locations
__add_path_safe "/opt/homebrew/bin"
__add_path_safe "/opt/homebrew/sbin"
__add_path_safe "/usr/local/bin"
__add_path_safe "/usr/local/sbin"

# Aliases (fish-native)
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias c='clear'
alias dt='deno task'
alias vi='nvim'
alias vim='nvim'
alias lg='lazygit'
alias gs='git status'

alias lfg='codex --dangerously-bypass-approvals-and-sandbox'
alias lfgc='claude --model opus --dangerously-skip-permissions'

# Reload current shell as login to re-source rc files
function reload
    exec $SHELL -l
end

# fzf completion and keybindings (prefer self-printing integration when available)
if command -vq fzf
    if fzf --help 2>&1 | string match -q '*--fish*'
        status --is-interactive; and fzf --fish | source; and set -g __FZF_INTEGRATION_LOADED 1
    end
end

# Fallbacks for older distro fzf (no --fish). Skip if already loaded.
if not set -q __FZF_INTEGRATION_LOADED
    if command -vq brew
        set -l brew_prefix (brew --prefix 2>/dev/null)
        if test -n "$brew_prefix"
            if test -f "$brew_prefix/opt/fzf/shell/completion.fish"
                source "$brew_prefix/opt/fzf/shell/completion.fish"
            end
            if test -f "$brew_prefix/opt/fzf/shell/key-bindings.fish"
                source "$brew_prefix/opt/fzf/shell/key-bindings.fish"
            end
        end
    end

    if test -f "/usr/share/fzf/completion.fish"
        source "/usr/share/fzf/completion.fish"
    end
    if test -f "/usr/share/fzf/key-bindings.fish"
        source "/usr/share/fzf/key-bindings.fish"
    end

    if test -f "$HOME/.fzf/shell/completion.fish"
        source "$HOME/.fzf/shell/completion.fish"
    end
    if test -f "$HOME/.fzf/shell/key-bindings.fish"
        source "$HOME/.fzf/shell/key-bindings.fish"
    end
end

# Starship prompt (if installed)
if command -vq starship
    starship init fish | source
end

# Editor defaults
set -gx EDITOR nvim
set -gx VISUAL nvim

# Nicer man pages via bat when available
if command -vq bat
    set -gx MANPAGER "sh -c 'col -bx | bat -l man -p'"
end

