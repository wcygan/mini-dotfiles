#!/usr/bin/env -S deno run --allow-all

import { log } from "./log.ts";
import { getFileMappings } from "./files.ts";

const STEP = "uninstall-files";

async function removeSymlinkIfOwned(src: string, dst: string) {
  try {
    const info = await Deno.lstat(dst);
    if (info.isSymlink) {
      const target = await Deno.readLink(dst).catch(() => undefined);
      if (target === src) {
        await Deno.remove(dst);
        return true;
      }
    }
  } catch {
    // not found; nothing to do
  }
  return false;
}

await log.stepBegin(STEP);
try {
  const mappings = getFileMappings();
  await log.info(STEP, "removing dotfile symlinks…");

  for (const { src, dst } of mappings) {
    const removed = await removeSymlinkIfOwned(src, dst);
    if (removed) {
      await log.debug(STEP, `removed symlink ${dst}`);
    } else {
      await log.debug(STEP, `skip ${dst} (not our symlink or missing)`);
    }
  }

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
