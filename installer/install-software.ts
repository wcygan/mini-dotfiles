#!/usr/bin/env -S deno run --allow-all

import $ from "jsr:@david/dax";
import { log } from "./log.ts";

const STEP = "install-software";
await log.stepBegin(STEP);
try {
  await log.info(STEP, "installing software…");
  await $`echo Software`;
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
