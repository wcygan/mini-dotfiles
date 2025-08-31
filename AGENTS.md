# Installer Architecture (OS-aware)

We install software via **explicit, OS-scoped classes** that implement a common contract. Each tool (fzf, starship, lazygit, …) gets one class per supported OS, plus shared utilities.

## Directory layout

```
scripts/
  installers/
    core/
      types.ts     # Installer interface, runner, OS detection
      utils.ts     # cmdExists, runSudo, homeDir, binDir, safePATH, ensureDir
    ubuntu/
      base.ts      # abstract UbuntuInstaller (apt helpers)
      fzf.ts       # FzfUbuntuInstaller
      ...          # StarshipUbuntuInstaller, LazyGitUbuntuInstaller, etc.
    fedora/
      base.ts
      fzf.ts
      ...
    mac/
      base.ts
      fzf.ts
      ...
    registry.ts    # returns the list of installers for the detected OS
    run.ts         # orchestrator (prints "Software" marker on success)
```

`install-files.ts` remains separate and runs before software installers. Tests rely on “Files” then “Software” ordering.

---

## Contracts

### `Installer` Interface

```ts
// scripts/installers/core/types.ts
export interface Installer {
  readonly name: string;          // kebab-case, e.g., "fzf-ubuntu"
  shouldRun?(): Promise<boolean>; // optional filter (feature flags, etc.)
  pre(): Promise<void>;           // preflight: dirs, env checks
  run(): Promise<void>;           // idempotent installation
  post(): Promise<void>;          // verification + finishing touches
}
```

### OS Base Classes

* `UbuntuInstaller` exposes `aptUpdate()` and `aptInstall(...pkgs)`.
* `FedoraInstaller` exposes `dnfInstall(...pkgs)`.
* `MacInstaller` ensures Homebrew and defers to `brew` in concrete classes.

Each concrete installer extends one of these bases and implements `name`, `run`, and `post` (and optionally `pre`/`shouldRun`).

---

## Orchestration

* `detectOS()` picks `ubuntu | fedora | mac`.
* `installersFor(os)` returns the concrete installers to run for that OS.
* `runInstaller(installer)` wraps `pre → run → post` with step logging via `scripts/log.ts`.
* `scripts/installers/run.ts` executes all installers and prints `Software` for Bats.

`scripts/main.ts` sequence:

1. `install-files.ts` (prints `Files`)
2. `installers/run.ts` (prints `Software`)
3. post-install reload hint

---

## Logging & Idempotency Rules

* Use `log.stepBegin/stepEnd/info/warn/error/success`.
* Every installer **must** be idempotent:

  * Prefer `command -v <tool>` checks before installing.
  * Package managers may be no-ops if already installed.
  * Upstream scripts must run with flags that avoid modifying user rc files (`--no-update-rc`)—our dotfiles source completions/keybindings explicitly.
* Keep PATH mutations local to the process using `safePATH()` where needed; do not write user rc files from installers.

---

## Authoring Checklist (add a new tool)

1. **Create concrete classes**

  * `scripts/ubuntu/<tool>.ts` → `class <Tool>UbuntuInstaller extends UbuntuInstaller`
  * `scripts/fedora/<tool>.ts` → `class <Tool>FedoraInstaller extends FedoraInstaller`
  * `scripts/mac/<tool>.ts`    → `class <Tool>MacInstaller extends MacInstaller`
2. **Implement contract**

  * `name`: `"tool-ubuntu" | "tool-fedora" | "tool-mac"`
  * `pre()`: create dirs (`ensureDir(binDir())`), sanity checks
  * `run()`: perform install (prefer system PM, or upstream fallback)
  * `post()`: verify (`cmdExists("tool")`) and throw if missing
3. **Wire into registry**

  * Add instances to `scripts/installers/registry.ts` arrays for each OS in the desired order (dependencies first).
4. **Keep rc mutation out of installers**

  * Completions/keybindings must be exposed by files under standard locations; dotfiles (`bashrc`, `zshrc`) already source them conditionally.
5. **Tests**

  * Extend Bats or add new tests to assert: presence on PATH, keybinding/completion availability (where applicable), and idempotent re-runs.

---

## Naming & Conventions

* Classes: `FzfUbuntuInstaller`, `FzfFedoraInstaller`, `FzfMacInstaller`.
* Step IDs / `name`: kebab-case with tool + os, e.g., `fzf-ubuntu`.
* Keep **program logic inside the OS class**; use `core/utils.ts` for shared helpers.
* Prefer newest viable source:

  * Ubuntu: try upstream (git) first when distro packages are stale; fallback to `apt`.
  * Fedora: try `dnf` first; fallback to upstream if needed.
  * macOS: use `brew` and run any tool-specific post-install script without touching rc files.

---

## Templates

### Per-OS Base (already present)

* `scripts/ubuntu/base.ts`: exposes `aptUpdate()`/`aptInstall()`.
* `scripts/fedora/base.ts`: exposes `dnfInstall()`.
* `scripts/mac/base.ts`: ensures Homebrew.

### Concrete Installer (template)

```ts
// scripts/ubuntu/mytool.ts
import { UbuntuInstaller } from "./base.ts";
import { cmdExists, ensureDir, binDir } from "../core/utils.ts";
import $ from "jsr:@david/dax";

export class MyToolUbuntuInstaller extends UbuntuInstaller {
  readonly name = "mytool-ubuntu";

  async pre() {
    await ensureDir(binDir());
    // optional: this.aptUpdate();
  }

  async run() {
    // preferred path: distro package
    try {
      await this.aptInstall("mytool");
    } catch {
      // fallback: upstream (example)
      await $`curl -fsSL https://example.com/install.sh | sh -s -- -y`;
    }
  }

  async post() {
    if (!(await cmdExists("mytool"))) throw new Error("mytool not found");
  }
}
```

Repeat for `scripts/fedora/mytool.ts` and `scripts/mac/mytool.ts` with the appropriate PM.

### Registry

```ts
// scripts/installers/registry.ts
import { OS } from "./core/types.ts";
import { FzfUbuntuInstaller } from "./ubuntu/fzf.ts";
import { FzfFedoraInstaller } from "./fedora/fzf.ts";
import { FzfMacInstaller } from "./mac/fzf.ts";
// import Starship/LazyGit installers...

export function installersFor(os: OS) {
  switch (os) {
    case "ubuntu":
      return [
        new FzfUbuntuInstaller(),
        // new StarshipUbuntuInstaller(),
        // new LazyGitUbuntuInstaller(),
      ];
    case "fedora":
      return [
        new FzfFedoraInstaller(),
        // new StarshipFedoraInstaller(),
        // new LazyGitFedoraInstaller(),
      ];
    case "mac":
      return [
        new FzfMacInstaller(),
        // new StarshipMacInstaller(),
        // new LazyGitMacInstaller(),
      ];
  }
}
```

---

## Bash/Zsh integration policy (applies to every tool)

* **No rc mutation inside installers.**
  Use flags like `--no-update-rc`. Our dotfiles load completions/keybindings if present at:

  * Homebrew paths (mac)
  * `/usr/share/...` or `/etc/bash_completion.d/...` (Linux)
  * `~/.fzf/shell/*.bash|*.zsh` for upstream fzf
* New tools should expose their shell integration in standard locations so the existing rc logic picks them up automatically.

---

## Testing Guidance

* Existing Bats tests assert:

  * `Files` then `Software` ordering
  * symlinks for dotfiles
  * `deno` availability
  * fzf integrations for bash/zsh
  * JSONL log assertions for “already installed”
* When adding a new tool:

  * Assert it’s on PATH after `./install.sh`.
  * If it provides shell widgets/completions, assert presence (e.g., `type -t <widget>` / `complete -p <cmd>` in `bash -ilc`).
  * Re-run `./install.sh` and confirm idempotency + logs.

---

## Feature Flags (optional)

* To conditionally run an installer, implement `shouldRun()` and read an env var (e.g., `DOTFILES_ONLY_FZF`, `DOTFILES_SKIP_LAZYGIT`). Keep flags additive and documented inline in the class.

---

Here’s a concrete way you could update **AGENTS.md** to codify the preference for minimal cognitive load. Think of it as rules the repo’s “installation agents” must follow, so future contributors don’t re-introduce scattered complexity.

---

## Cognitive Load Principles

To keep this repository approachable and maintainable, all agents and installers MUST adhere to a **minimal cognitive load** philosophy. This means:

1. **One Mental Model per Class of Tasks**

  * All installers follow the same shape:

    ```
    if already installed → return
    else try system package manager
    else fallback (helper)
    verify postcondition
    ```
  * Avoid special-case branches that deviate from this model unless strictly necessary.

2. **Deep, Not Wide**

  * Shared helpers (e.g. `ensureUpstreamFzf`, `installTarballBinary`) live in `scripts/installers/core/toolkit.ts`.
  * Duplicated flows (git-based fzf bootstrap, GitHub tarball download/unpack) must call into these helpers rather than re-implement them.
  * Prefer depth (strong abstractions, fewer moving parts) over breadth (lots of nearly-identical implementations).

3. **Single Source of Truth**

  * Environment setup (PATH hardening, binDir creation) happens once in the entrypoint (`scripts/main.ts`), not scattered across installers.
  * Post-install verification messages are uniform: `throw new Error("verify: <tool> missing on PATH");`.

4. **Explicit Over Implicit**

  * Every `run()` clearly lists its steps. Each step should be 1–2 lines, ideally invoking a helper.
  * If a step requires OS-specific handling, document the reason inline.

5. **Tests Enforce the Contract**

  * Bats tests check the observable behavior (tool ends up on PATH).
  * Tests must not duplicate setup logic—they import the same helpers.

6. **Consistency First**

  * Prefer consistent naming (`install-<tool>-<os>`) across all installers.
  * Logging always uses the parent step `"install-software"` with child steps keyed by installer name.

---

## Why

By codifying these rules, new contributors (and future you) only have to memorize:

* *Where things live* (`toolkit.ts` for shared logic, `installers/<os>/<tool>.ts` for orchestration).
* *One lifecycle shape* (pre → run → post).
* *One invariant* (binary must be present on PATH after install).

Everything else should be discoverable, predictable, and boring.

---

## Acceptance Criteria (per new tool)

* ✅ Installs cleanly on Ubuntu, Fedora, macOS (or explicitly documented as N/A for an OS).
* ✅ No rc file edits by the installer.
* ✅ Verifies itself in `post()` and throws on failure.
* ✅ Idempotent (2nd run is a no-op).
* ✅ Wired into `registry.ts` in a sensible order.
* ✅ Tests cover presence + (if applicable) shell integration.

---

## Rationale

* **Clarity:** All platform-specific logic is explicit and testable.
* **Safety:** Logging + idempotency reduce risk.
* **Extensibility:** Adding Arch/Alpine means adding a base + tool classes, then extending the registry—no rewrites elsewhere.
