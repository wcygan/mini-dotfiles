#!/usr/bin/env -S deno run --allow-all

import $ from "jsr:@david/dax";
import { dirname } from "jsr:@std/path";
import { log } from "./log.ts";
import { getFileMappings } from "./files.ts";

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
  const mapping = getFileMappings();

  await log.info(STEP, "copying dotfiles…");
  for (const { src, dst } of mapping) {
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
