#!/usr/bin/env -S deno run --allow-all

import $ from "jsr:@david/dax";
import { log } from "./log.ts";

const STEP = "install-files";
await log.stepBegin(STEP);
try {
  await log.info(STEP, "copying dotfiles…");
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
    error: err instanceof Error ? err.stack ?? err.message : String(err),
  });
  throw err;
}
