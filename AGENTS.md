##############################################################################
#   Filename: AGENTS.md                                                      #
# Maintainer: Will Cygan <wcygan.io@gmail.com>                               #
#        URL: http://github.com/wcygan/mini-dotfiles                         #
#                                                                            #
# Sections:                                                                  #
#   01. Preamble & Principles ..... Short preface for collaborators          #
#   02. Goals ..................... What this repo optimizes for             #
#   03. Guardrails ................ Safe defaults and constraints             #
#   04. Implementation Notes ...... Structure, style, and testing            #
#   05. v1 Details ................ Current scope delivered                  #
#   06. Usage ..................... How to run and flags                     #
#   07. Contribution Guide ........ How to make changes                      #
#   08. Roadmap ................... What’s next                              #
#   09. Non-Goals ................. Explicitly out of scope                  #
##############################################################################

##############################################################################
# 01. Preamble & Principles                                                  #
##############################################################################
- Prefer a concise preamble before grouped actions or tool calls. Keep it to
  1–2 sentences that explain what’s about to run and why.
- Keep sections organized and discoverable. Use headers like the banner above
  to structure shell files into numbered, named blocks.
- Be safe, idempotent, and explicit. Echo intended actions; support `--dry-run`.
- Keep changes surgical; respect cross‑platform constraints first.

Example preamble lines when automating or running commands:
- “I’ve explored the repo; now checking the API route definitions.”
- “Next, I’ll patch the config and update the related tests.”
- “I’m about to scaffold the CLI commands and helper functions.”

##############################################################################
# 02. Goals                                                                  #
##############################################################################
- Platform‑agnostic: Detect OS and apply appropriate steps without duplicative
  code.
- Minimal defaults: Lean, fast bootstrap; extras behind flags.
- Idempotent runs: Safe to re‑run; no duplicate packages or broken links.
- Clear structure: Small, composable scripts with obvious flow and logging.
- Safe by default: No destructive actions without explicit confirmation.

##############################################################################
# 03. Guardrails                                                             #
##############################################################################
- OS detection: Use `uname`/`$OSTYPE` once; branch to well‑named functions
  like `setup_macos` and `setup_linux`.
- Package managers:
  - macOS: Homebrew for packages and casks.
  - Linux: Prefer `apt` or `dnf` based on detection; avoid distro‑specific hacks.
- Dotfiles linking: Prefer symlinks into the repo; back up existing files before
  linking.
- Interactivity: Ask before overwriting; offer `--yes` to bypass prompts when safe.
- Logging: Echo clear steps; provide `--verbose` for debug output.
- Logging: Echo clear steps; provide `--verbose` for debug output. Prefer
  visual logs with color and emojis for clarity (respects `NO_COLOR` and falls
  back to plain text when color is unavailable).
- Idempotence: Check‑before‑install/link; avoid repeated work.
- State outside git: Never write runtime state into the repo. Use a per-user
  state/cache directory (see `STATE_DIR`) for timestamps and caches; do not
  track these in git.

##############################################################################
# 04. Implementation Notes                                                   #
##############################################################################
- Script style: POSIX‑compatible where feasible; when not, keep bash‑only
  features minimal and documented.
- Structure:
  - Single `install.sh` orchestrates setup via small, well‑named functions.
  - Keep per‑platform logic gated in functions, not scattered conditionals.
- Extensibility: Add optional components behind flags (e.g., `--dev`, `--desktop`).
- Testing: Dry‑run mode (`--dry-run`) prints planned actions without changes.
- Header pattern: Add banner + numbered section blocks to shell files to aid
  navigation and reviews.
- State/cache directory: Scripts use `STATE_DIR`, resolved via XDG paths
  (`$XDG_STATE_HOME` → `$XDG_CACHE_HOME` → `~/.local/state` → `~/.cache`). Use
  this directory for ephemeral data (e.g., timestamps, caches). Keep it outside
  the repository; do not add it to version control.

##############################################################################
# 05. v1 Details (implemented)                                               #
##############################################################################
- OS detection: `install.sh` identifies macOS vs Linux and selects `brew`,
  `apt`, or `dnf`.
- Package bootstrap:
  - macOS: Installs Homebrew if missing; updates taps at most monthly
    (skips `brew update` when the last update was <30 days ago).
  - Linux: Updates package index; installs `git`, `curl`, and `zsh` via `apt`
    or `dnf`.
- State dir: Uses `STATE_DIR` for lightweight tracking (e.g., Homebrew update
  timestamp). Lives outside the repo and is not tracked by git.
- Shell setup: Prefers `zsh`; offers to `chsh` to the detected path if not
  default. Adds shell path to `/etc/shells` when needed.
- Dotfile links: Symlinks minimal `~/.zshrc`, `~/.bashrc`, `~/.gitconfig`, and
  `~/.aliases.sh` from `dotfiles/`, backing up existing files with timestamped
  `.bak.*` suffixes.
- Idempotence: Skips re‑linking when links already point to this repo; backups
  only when replacing real files.
- Flags: `--yes`, `--dry-run`, `--verbose` support safe, transparent runs.

##############################################################################
# 06. Usage                                                                  #
##############################################################################
- Clone: `git clone git@github.com:wcygan/mini-dotfiles.git` then `cd mini-dotfiles`.
- Install: `./install.sh` (make executable if needed: `chmod +x install.sh`).
- Dry run: `./install.sh --dry-run` to preview actions.
- Non‑interactive: Add `--yes` to suppress confirmations when safe.
- Verbose: Use `--verbose` to print invoked commands.
- Clean: `./clean.sh` to remove repo-managed symlinks created by `install.sh`
  (safe, idempotent; supports `--dry-run`, `--yes`, `--verbose`).

##############################################################################
# 07. Contribution Guide For Agents                                          #
##############################################################################
- Keep changes surgical: Small, reviewable diffs; consistent naming.
- Prefer functions: One responsibility per function; readable top‑level flow.
- Document flags: Update this file when adding or changing CLI flags.
- No hidden side effects: Echo intended actions and honor `--dry-run`.
- Cross‑platform first: Always consider both macOS and Linux paths.
- Preamble first: Add a brief, clear preamble before grouped actions.

##############################################################################
# 08. Roadmap                                                                #
##############################################################################
- v0: Minimal installer scaffolding (hello + skeleton) [done].
- v1: OS detection, package manager bootstrap, shell setup, basic dotfile
  links. [done]
- v2: Optional profiles: aliases.sh, exports.sh, path.sh, font installs, terminal config.
  [next]
- v3: CI smoke checks, linting for shell scripts, integration tests. [later]

##############################################################################
# 09. Non-Goals                                                              #
##############################################################################
- Heavy distro specialization: Avoid deep distro‑specific branches beyond
  package manager differences.
- Monolithic scripts: Do not add huge, intertwined logic; keep things modular.
