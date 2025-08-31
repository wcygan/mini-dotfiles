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

  // Build a safe, system-first PATH to avoid broken user shims (e.g. a stray
  // ~/.local/bin/env). Keep existing entries but put system dirs up front.
  const systemFirst = [
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
    "/opt/homebrew/bin",
    "/usr/local/bin",
  ];
  const currentPath = Deno.env.get("PATH") ?? "";
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const p of systemFirst) {
    if (!seen.has(p)) {
      parts.push(p);
      seen.add(p);
    }
  }
  for (const p of currentPath.split(":").filter(Boolean)) {
    if (!seen.has(p)) {
      parts.push(p);
      seen.add(p);
    }
  }
  const safePATH = parts.join(":");
  try {
    Deno.env.set("PATH", safePATH);
    await log.debug(STEP, "using system-first PATH during install");
  } catch {
    // non-fatal
  }

  // Warn if suspicious user 'env' files exist that could break installers
  try {
    const localEnv = join(home, ".local", "bin", "env");
    const denoEnv = join(home, ".deno", "env");
    for (const p of [localEnv, denoEnv]) {
      try {
        const st = await Deno.stat(p);
        if (st.isFile) {
          await log.warn(
            STEP,
            `found '${p}' which may shadow system env; installers may fail`,
          );
        }
      } catch {
        // ignore missing
      }
    }
  } catch {
    // ignore
  }

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

  // Install lazygit
  await log.info(STEP, "ensuring lazygit is installed…");

  // For detection, include our ~/.local/bin to avoid false negatives
  let haveLazyGit = false;
  try {
    await $`sh -lc 'command -v lazygit >/dev/null 2>&1'`.env(verifyEnv).quiet();
    haveLazyGit = true;
  } catch {
    haveLazyGit = false;
  }
  if (haveLazyGit) {
    await log.info(STEP, "lazygit already installed; skipping");
  } else {
    const os = Deno.build.os; // "darwin" | "linux" | "windows"
    const haveBrew = await cmdExists("brew");
    const haveApt = await cmdExists("apt-get");
    const haveDnf = await cmdExists("dnf");
    const haveSudo = await cmdExists("sudo");
    const root = await isRoot();

    let installed = false;

    // On macOS, ensure Homebrew exists; if not, install it, but do not auto-update.
    if (os === "darwin" && !haveBrew) {
      try {
        await log.info(STEP, "Homebrew not found; installing Homebrew…");
        await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;
      } catch (e) {
        await log.warn(
          STEP,
          `failed to install Homebrew (${
            e instanceof Error ? e.message : String(e)
          })`,
        );
      }
    }

    // Refresh brew presence after potential install
    const brewNow = await cmdExists("brew");

    if (!installed && brewNow) {
      await log.info(STEP, "using Homebrew to install lazygit…");
      try {
        await $`env HOMEBREW_NO_AUTO_UPDATE=1 brew list --versions lazygit >/dev/null 2>&1 || env HOMEBREW_NO_AUTO_UPDATE=1 brew install lazygit`;
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `brew install lazygit failed (${
            e instanceof Error ? e.message : String(e)
          }), will try other methods`,
        );
      }
    }

    if (!installed && haveApt) {
      await log.info(STEP, "using apt-get to install lazygit…");
      try {
        const run = async (cmd: string) => {
          if (root) return await $`sh -lc ${cmd}`;
          if (haveSudo) return await $`sudo sh -lc ${cmd}`;
          throw new Error("need root or sudo for apt-get");
        };
        await run("apt-get update -y");
        await run("apt-get install -y lazygit");
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `apt-get install lazygit failed (${
            e instanceof Error ? e.message : String(e)
          })`,
        );
      }
    }

    if (!installed && haveDnf) {
      await log.info(STEP, "using dnf to install lazygit…");
      try {
        const run = async (cmd: string) => {
          if (root) return await $`sh -lc ${cmd}`;
          if (haveSudo) return await $`sudo sh -lc ${cmd}`;
          throw new Error("need root or sudo for dnf");
        };
        await run("dnf install -y lazygit");
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `dnf install lazygit failed (${
            e instanceof Error ? e.message : String(e)
          })`,
        );
      }
    }

    // Fallback: download latest GitHub release and install to ~/.local/bin
    if (!installed) {
      try {
        const arch = Deno.build.arch; // x86_64 | aarch64
        const assetOS = os === "linux" ? "Linux" : os === "darwin" ? "Darwin" : undefined;
        const assetArch = arch === "x86_64" ? "x86_64" : arch === "aarch64" ? "arm64" : undefined;
        if (!assetOS || !assetArch) throw new Error(`unsupported platform ${os}/${arch}`);

        await log.info(STEP, "installing lazygit from GitHub releases…");

        const latestRes = await fetch("https://api.github.com/repos/jesseduffield/lazygit/releases/latest", {
          headers: { "Accept": "application/vnd.github+json" },
        });
        if (!latestRes.ok) throw new Error(`failed to fetch latest release: ${latestRes.status}`);
        const latest = await latestRes.json();
        const tag = String(latest.tag_name ?? latest.tag ?? "");
        if (!tag) throw new Error("could not determine latest tag");
        const version = tag.replace(/^v/, "");
        const assetName = `lazygit_${version}_${assetOS}_${assetArch}.tar.gz`;
        const url = `https://github.com/jesseduffield/lazygit/releases/download/${tag}/${assetName}`;

        const tmpDir = await Deno.makeTempDir();
        const tarPath = join(tmpDir, assetName);
        await $`curl -fsSL -o ${tarPath} ${url}`;
        await $`tar -xzf ${tarPath} -C ${tmpDir}`;
        const binSrc = join(tmpDir, "lazygit");
        await Deno.chmod(binSrc, 0o755).catch(() => {});

        // Use earlier binDir (~/.local/bin)
        await Deno.mkdir(binDir, { recursive: true }).catch(() => {});
        const binDst = join(binDir, "lazygit");
        try { await Deno.remove(binDst); } catch {}
        await Deno.rename(binSrc, binDst);
        installed = true;
      } catch (e) {
        await log.warn(
          STEP,
          `GitHub release fallback for lazygit failed (${e instanceof Error ? e.message : String(e)})`,
        );
      }
    }

    // Verify
    try {
      await $`sh -lc 'command -v lazygit >/dev/null 2>&1'`.env(verifyEnv);
      await log.success(STEP, "lazygit installed");
    } catch {
      await log.warn(STEP, "lazygit not found on PATH after install attempts");
    }
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
