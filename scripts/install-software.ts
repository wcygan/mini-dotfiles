#!/usr/bin/env -S deno run --allow-all

import $ from "jsr:@david/dax";
import { join } from "jsr:@std/path";
import { log } from "./log.ts";

const STEP = "install-software";
await log.stepBegin(STEP);
try {
  await log.info(STEP, "installing software…");

  // Install Starship in a platform-agnostic way using the official script.
  const home = Deno.env.get("HOME");
  if (!home) throw new Error("HOME not set");
  const binDir = join(home, ".local", "bin");
  await Deno.mkdir(binDir, { recursive: true }).catch(() => {});

  // Verify presence first (ensure PATH contains our binDir for this check)
  const path = Deno.env.get("PATH") ?? "";
  const verifyEnv = { PATH: `${binDir}:${path}` };

  let starshipPresent = false;
  try {
    await $`sh -lc 'command -v starship >/dev/null 2>&1'`.env(verifyEnv)
      .quiet();
    starshipPresent = true;
  } catch {
    starshipPresent = false;
  }

  if (starshipPresent) {
    await log.info(STEP, "starship already installed; skipping");
  } else {
    await log.info(STEP, `installing starship to ${binDir}…`);
    await $`curl -fsSL https://starship.rs/install.sh | sh -s -- -y -b ${binDir}`;

    // Verify install
    await $`sh -lc 'command -v starship >/dev/null 2>&1'`.env(verifyEnv);
    await log.success(STEP, "starship installed");
  }

  // Legacy marker for existing tests
  await $`echo Software`;

  // Install fzf with keybindings enabled by default
  await log.info(STEP, "installing fzf…");

  // Helper to check if command exists
  const cmdExists = async (cmd: string): Promise<boolean> => {
    try {
      await $`sh -lc 'command -v ${cmd} >/dev/null 2>&1'`;
      return true;
    } catch {
      return false;
    }
  };

  // Helper to check if running as root
  const isRoot = async (): Promise<boolean> => {
    try {
      const { stdout } = await $`sh -lc 'id -u'`.quiet();
      return stdout.trim() === "0";
    } catch {
      return false;
    }
  };

  // Try native package managers first; fall back to git installer
  const haveFzf = await cmdExists("fzf");
  if (!haveFzf) {
    const haveBrew = await cmdExists("brew");
    const haveApt = await cmdExists("apt-get");
    const haveDnf = await cmdExists("dnf");
    const haveSudo = await cmdExists("sudo");
    const root = await isRoot();

    let installed = false;

    if (!installed && haveBrew) {
      await log.info(STEP, "using Homebrew to install fzf…");
      try {
        await $`brew list --versions fzf >/dev/null 2>&1 || brew install fzf`;
        installed = true;
        // Optional: run fzf install script to set up shell resources without touching rc files
        try {
          const { stdout: prefix } = await $`brew --prefix`.quiet();
          await $`${prefix.trim()}/opt/fzf/install --key-bindings --completion --no-update-rc`;
        } catch {
          // best-effort; our dotfiles source the scripts directly
        }
      } catch (e) {
        await log.warn(
          STEP,
          `brew install fzf failed (${
            e instanceof Error ? e.message : String(e)
          }), will try other methods`,
        );
      }
    }

    if (!installed && haveApt) {
      await log.info(STEP, "using apt-get to install fzf…");
      try {
        const run = async (cmd: string) => {
          if (root) return await $`sh -lc ${cmd}`;
          if (haveSudo) return await $`sudo sh -lc ${cmd}`;
          throw new Error("need root or sudo for apt-get");
        };
        await run("apt-get update -y");
        await run("apt-get install -y fzf");
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `apt-get install fzf failed (${
            e instanceof Error ? e.message : String(e)
          }), will try other methods`,
        );
      }
    }

    if (!installed && haveDnf) {
      await log.info(STEP, "using dnf to install fzf…");
      try {
        const run = async (cmd: string) => {
          if (root) return await $`sh -lc ${cmd}`;
          if (haveSudo) return await $`sudo sh -lc ${cmd}`;
          throw new Error("need root or sudo for dnf");
        };
        await run("dnf install -y fzf");
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `dnf install fzf failed (${
            e instanceof Error ? e.message : String(e)
          }), will try git installer`,
        );
      }
    }

    if (!installed) {
      // Git-based installer (no root required)
      await log.info(STEP, "using git-based installer for fzf…");
      const fzfDir = join(home, ".fzf");
      try {
        try {
          const st = await Deno.stat(fzfDir);
          if (!st.isDirectory) {
            throw new Error("~/.fzf exists and is not a directory");
          }
        } catch {
          await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`;
        }
        await $`${
          join(fzfDir, "install")
        } --key-bindings --completion --no-update-rc`;
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `git-based fzf install failed: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // Verify
    try {
      await $`sh -lc 'command -v fzf >/dev/null 2>&1'`;
      await log.success(STEP, "fzf installed");
    } catch {
      await log.warn(STEP, "fzf not found on PATH after install attempts");
    }
  } else {
    await log.info(STEP, "fzf already installed");
  }

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
