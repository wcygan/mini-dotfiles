#!/usr/bin/env -S deno run --allow-all

import $ from "jsr:@david/dax";
import { dirname, join } from "jsr:@std/path";
import { log } from "./log.ts";

const STEP = "install-files";

async function ensureSymlink(src: string, dst: string) {
  await Deno.mkdir(dirname(dst), { recursive: true }).catch(() => {});

  try {
    const info = await Deno.lstat(dst);
    if (info.isSymlink) {
      const target = await Deno.readLink(dst).catch(() => undefined);
      if (target === src) return;
      await Deno.remove(dst);
    } else {
      await Deno.remove(dst).catch(() => {});
    }
  } catch {
    // not found
  }

  await Deno.symlink(src, dst, { type: "file" });
}

await log.stepBegin(STEP);
try {
  const home = Deno.env.get("HOME");
  if (!home) throw new Error("HOME not set");

  const repo = Deno.cwd();
  const configDir = Deno.env.get("XDG_CONFIG_HOME") ?? join(home, ".config");
  const mapping: Array<[string, string]> = [
    [join(repo, "dotfiles", "bashrc"), join(home, ".bashrc")],
    [join(repo, "dotfiles", "bash_profile"), join(home, ".bash_profile")],
    [join(repo, "dotfiles", "zshrc"), join(home, ".zshrc")],
    [join(repo, "dotfiles", "gitconfig"), join(home, ".gitconfig")],
    [join(repo, "dotfiles", "tmux.conf"), join(home, ".tmux.conf")],
    [join(repo, "dotfiles", "aliases.sh"), join(home, ".aliases.sh")],
    [join(repo, "dotfiles", "starship.toml"), join(configDir, "starship.toml")],
  ];

  await log.info(STEP, "copying dotfiles…");
  for (const [src, dst] of mapping) {
    await log.debug(STEP, `link ${dst} -> ${src}`);
    await ensureSymlink(src, dst);
  }

  // Legacy marker for existing tests
  await $`echo Files`;

  await log.success(STEP, "done");
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
