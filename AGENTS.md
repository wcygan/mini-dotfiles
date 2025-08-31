# Repository Guidelines

## Project Structure & Module Organization

- `install.sh`: POSIX bootstrap. Ensures repo checkout, installs Deno, runs
  `deno task install`.
- `installer/`: Deno TypeScript scripts. Entry `main.ts` imports
  `install-files.ts` then `install-software.ts` (sequential installers using
  `jsr:@david/dax`).
- `dotfiles/`: Managed configs (e.g., `zshrc`, `bashrc`, `gitconfig`,
  `tmux.conf`, `aliases.sh`).
- `test/`: Bats tests and Dockerfiles (`test/bats/*.bats`, `test/docker/*`).
- `deno.json`: Tasks for install/test and convenience commands.

## Build, Test, and Development Commands

- `./install.sh`: Bootstrap install (idempotent); ensures Deno and runs
  installers.
- `deno task install`: Runs `installer/main.ts` directly (useful during
  development).
- `deno run --allow-all installer/install-files.ts`: Run a specific installer.
- `deno task test` or `bats test/bats`: Execute Bats tests locally.
- Docker (optional):
  `docker build -f test/docker/Dockerfile.ubuntu -t md:test . && docker run --rm -v "$PWD":/dotfiles md:test`

## Coding Style & Naming Conventions

- TypeScript (Deno): 2-space indent, prefer explicit
  `await $\`...\``steps; filenames`install-*.ts` (kebab-case).
- Shell: POSIX `sh` in `install.sh`; keep functions small, defensive
  (`set -eu`).
- Formatting/Linting: Use `deno fmt` and `deno lint` for `installer/*.ts`; keep
  scripts executable (`chmod +x`).

## Testing Guidelines

- Framework: [Bats](https://github.com/bats-core/bats-core).
- Location/Pattern: `test/bats/*.bats` (add new tests here, update existing if
  making modifications).
- Run: `deno task test` or `bats test/bats`.
- CI: GitHub Actions runs tests on Ubuntu, Fedora (container), and macOS; ensure
  cross-platform behavior.

### Test Suite Details (`/test`)

- Location: `test/bats/test_installer.bats`.
- Isolation: tests run with a temporary `HOME` via `mktemp -d` to avoid touching
  the real user profile.
- Current assertions:
  - Pretty output markers appear (and order: "Files" before "Software").
  - Deno becomes available in PATH after install.
  - Idempotent second run.
  - Symlink checks: each expected dotfile is a symlink (`-L`) and contents match
    the repo source via `cmp -s`.
- Prefer stable checks on JSON logs when practical: see Logging Mandate for `jq`
  examples against `./.logs/install.jsonl`.

## Commit & Pull Request Guidelines

- Commits: Short, imperative, lowercase subject (e.g., `installers`, `ci setup`,
  `add bats test`). Group related changes.
- PRs: Clear description, rationale, and scope. Link issues if applicable. Show
  sample output for installer changes and note tested platforms. Update docs
  (`README.md`) when user-visible behavior changes.

## Security & Configuration Tips

- Deno scripts use `--allow-all`; keep commands explicit and avoid secrets in
  repo or dotfiles. Review shell expansions and paths. Aim for idempotent, safe
  re-runs.

## Installer Behavior (Install-Once Preference)

- Prefer install-only-if-needed: before installing any tool, first detect if it
  is already present and usable on `PATH` and skip re-installation if found.
- Detection: use `command -v <tool>` and, when applicable, include the intended
  bin directory (for example, `${HOME}/.local/bin`) at the front of `PATH` for
  verification only. This avoids false negatives when the directory isn’t yet
  in the user’s shell `PATH`.
- Idempotency: all installers should be safe to run multiple times. If a tool
  is already installed, log a concise info message and continue without error.
- Robust PATH usage: when invoking external package managers or installers,
  prefer a PATH that prioritizes system directories (e.g., `/usr/bin:/bin:/usr/sbin:/sbin`) and
  common package manager locations (e.g., Homebrew) to avoid being affected by
  accidentally shadowed shims in user directories.

## Logging Mandate (Pretty + JSONL)

- All installer code MUST use `installer/log.ts` for logging.
- Step lifecycle:
  - Call `await log.stepBegin("<step-id>")` at the start of each installer
    module/major phase.
  - Emit progress with `log.info|warn|error|success(step, msg)` as needed.
  - Always finish with `await log.stepEnd("<step-id>", { ok: true })` on
    success, or `{ ok: false, error }` on failure inside a `catch`.
- Step ids: Use kebab-case, matching the file or phase name (e.g.,
  `install-files`, `install-software`).
- Dual outputs (Option 1):
  - Pretty stdout: color + emoji when attached to a TTY and `NO_COLOR` is not
    set.
  - JSON Lines: append one object per line to `./.logs/install.jsonl`.
- JSON fields (stable for tests): `ts`, `lvl`, `ev`
  (`step_begin`|`log`|`step_end`), `step`, `msg`, `ok`, `code`, `duration_ms`,
  `component`, `version`, `error`.
- Environment variables:
  - `LOG_FORMAT=pretty|json|both` (default: `both`)
  - `LOG_FILE` path for JSONL (default: `./.logs/install.jsonl`)
  - `NO_COLOR=1` to disable colors; `LOG_EMOJI=0` to disable emojis
- Bats test guidance:
  - Prefer assertions on JSONL. Example:
    `jq -e 'select(.ev=="step_end" and .step=="install-files" and .ok==true)' ./.logs/install.jsonl >/dev/null`
  - Ordering check example:
    `awk '/"step":"install-files"/ && /"ev":"step_begin"/{b=NR} /"step":"install-files"/ && /"ev":"step_end"/{e=NR} END{exit !(b && e && b<e)}' ./.logs/install.jsonl`
- Example pattern:
  ```ts
  import { log } from "./scripts/log.ts";
  const STEP = "install-foo";
  await log.stepBegin(STEP);
  try {
    await log.info(STEP, "doing work…");
    // ... work ...
    await log.stepEnd(STEP, { ok: true });
  } catch (err) {
    await log.error(
      STEP,
      `failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    await log.stepEnd(STEP, {
      ok: false,
      error: err instanceof Error ? (err.stack ?? err.message) : String(err),
    });
    throw err;
  }
  ```

## Symlink Strategy (installer/install-files.ts)

- Goal: manage dotfiles as symlinks pointing to files tracked in `dotfiles/`.
- Default mapping:
  - `dotfiles/bashrc` → `$HOME/.bashrc`
  - `dotfiles/zshrc` → `$HOME/.zshrc`
  - `dotfiles/gitconfig` → `$HOME/.gitconfig`
  - `dotfiles/tmux.conf` → `$HOME/.tmux.conf`
  - `dotfiles/aliases.sh` → `$HOME/.aliases.sh`
- Behavior:
  - Create parent directories as needed.
  - If target exists and is the correct symlink, do nothing (idempotent).
  - If target is a wrong symlink or a regular file, remove it and recreate
    pointing to the repo file.
  - Uses Deno `lstat`, `readLink`, and `symlink({ type: "file" })` for file
    links.
- Platforms: macOS/Linux are primary targets; Windows symlinks may require
  admin/dev-mode.
- Extending: add new pairs to the mapping in `installer/install-files.ts` and
  update Bats tests accordingly.

## Shell Support Scope

- Supported shells: Bash and Zsh only.
- Supported OS: macOS and Linux only.
- Not supported: Fish, PowerShell, and other shells (nu, xonsh, tcsh, etc.).
- Starship setup: initialize in `dotfiles/bashrc` and `dotfiles/zshrc` only.
- Do not add configs, symlinks, or installer steps for unsupported shells.
