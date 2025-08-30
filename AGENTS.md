**Overview**
- **Project type:** Dotfiles repo for platform-agnostic setup.
- **Targets:** macOS and Linux (Debian/Ubuntu/Fedora family) without forking logic everywhere.
- **Entry point:** `install.sh` orchestrates bootstrap and configuration.
- **Usage:** `git clone git@github.com:wcygan/mini-dotfiles.git && cd mini-dotfiles && ./install.sh`.

**Goals**
- **Platform-agnostic:** Detect OS and apply appropriate steps without TOO MUCH duplicative code.
- **Minimal defaults:** Ship a lean, fast bootstrap; add extras behind flags.
- **Idempotent runs:** Safe to re-run; no duplicate packages or broken links.
- **Clear structure:** Small, composable scripts with obvious flow and logging.
- **Safe by default:** No destructive actions without explicit confirmation.

**How To Run**
- **Clone:** `git clone git@github.com:wcygan/mini-dotfiles.git` then `cd mini-dotfiles`.
- **Install:** Run `./install.sh` (make executable if needed: `chmod +x install.sh`).

**Guardrails**
- **OS detection:** Use `uname`/`$OSTYPE` once; branch to minimal, well-named functions (e.g., `setup_macos`, `setup_linux`).
- **Package managers:**
  - macOS: Homebrew for packages and casks.
  - Linux: Prefer `apt` or `dnf` based on detection; avoid distro-specific hacks.
- **Dotfiles linking:** Prefer symlinks into the repo; back up existing files before linking.
- **Interactivity:** Ask before overwriting; offer `--yes` to bypass prompts when safe.
- **Logging:** Echo clear steps; provide `--verbose` for debug output.
- **Idempotence:** Check-before-install/link; avoid repeated work.

**Implementation Notes**
- **Script style:** POSIX-compatible where feasible; when not, keep bash-only features minimal and documented.
- **Structure:**
  - Entry point: `install.sh`. Helper scripts are organized in `scripts/`.
  - Keep per-platform logic gated in functions, not scattered conditionals.
- **Extensibility:** Add optional components behind flags (e.g., `--dev`, `--desktop`).
- **Testing:** Dry-run mode (`--dry-run`) prints planned actions without changing the system.

**Roadmap**
- **v0:** Minimal installer scaffolding (hello + skeleton) [current].
- **v1:** OS detection, package manager bootstrap, shell setup, basic dotfile links.
- **v2:** Optional profiles (dev/tools/desktop), font installs, terminal config.
- **v3:** CI smoke checks, linting for shell scripts, integration tests.

**Contribution Guide For Agents**
- **Keep changes surgical:** Small, reviewable diffs; consistent naming.
- **Prefer functions:** One responsibility per function; top-level flow remains readable.
- **Document flags:** Update this file when adding or changing CLI flags.
- **No hidden side effects:** Echo what will be done; honor `--dry-run`.
- **Cross-platform first:** Always consider both macOS and Linux paths.

**Non-Goals**
- **Heavy distro specialization:** Avoid deep distro-specific branches beyond package manager differences.
- **Monolithic scripts:** Do not add huge, intertwined logic; keep things modular.
