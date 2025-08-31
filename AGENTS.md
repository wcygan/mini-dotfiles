# Repository Guidelines

## Project Structure & Module Organization
- `install.sh`: POSIX bootstrap. Ensures repo checkout, installs Deno, runs `deno task install`.
- `installer/`: Deno TypeScript scripts. Entry `main.ts` imports `install-files.ts` then `install-software.ts` (sequential installers using `jsr:@david/dax`).
- `dotfiles/`: Managed configs (e.g., `zshrc`, `bashrc`, `gitconfig`, `tmux.conf`, `aliases.sh`).
- `test/`: Bats tests and Dockerfiles (`test/bats/*.bats`, `test/docker/*`).
- `deno.json`: Tasks for install/test and convenience commands.

## Build, Test, and Development Commands
- `./install.sh`: Bootstrap install (idempotent); ensures Deno and runs installers.
- `deno task install`: Runs `installer/main.ts` directly (useful during development).
- `deno run --allow-all installer/install-files.ts`: Run a specific installer.
- `deno task test` or `bats test/bats`: Execute Bats tests locally.
- Docker (optional): `docker build -f test/docker/Dockerfile.ubuntu -t md:test . && docker run --rm -v "$PWD":/dotfiles md:test`

## Coding Style & Naming Conventions
- TypeScript (Deno): 2-space indent, prefer explicit `await $\`...\`` steps; filenames `install-*.ts` (kebab-case).
- Shell: POSIX `sh` in `install.sh`; keep functions small, defensive (`set -eu`).
- Formatting/Linting: Use `deno fmt` and `deno lint` for `installer/*.ts`; keep scripts executable (`chmod +x`).

## Testing Guidelines
- Framework: [Bats](https://github.com/bats-core/bats-core).
- Location/Pattern: `test/bats/*.bats` (add new tests here, update existing if making modifications).
- Run: `deno task test` or `bats test/bats`.
- CI: GitHub Actions runs tests on Ubuntu, Fedora (container), and macOS; ensure cross-platform behavior.

## Commit & Pull Request Guidelines
- Commits: Short, imperative, lowercase subject (e.g., `installers`, `ci setup`, `add bats test`). Group related changes.
- PRs: Clear description, rationale, and scope. Link issues if applicable. Show sample output for installer changes and note tested platforms. Update docs (`README.md`) when user-visible behavior changes.

## Security & Configuration Tips
- Deno scripts use `--allow-all`; keep commands explicit and avoid secrets in repo or dotfiles. Review shell expansions and paths. Aim for idempotent, safe re-runs.

