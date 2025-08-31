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

  await log.info(STEP, `installing starship to ${binDir}…`);
  await $`curl -fsSL https://starship.rs/install.sh | sh -s -- -y -b ${binDir}`;

  // Verify install (ensure PATH contains our binDir for this check)
  const path = Deno.env.get("PATH") ?? "";
  const verifyEnv = { PATH: `${binDir}:${path}` };
  await $`sh -lc 'command -v starship >/dev/null 2>&1'`.env(verifyEnv);
  await log.success(STEP, "starship installed");

  // Legacy marker for existing tests
  await $`echo Software`;

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
