#!/usr/bin/env -S deno run --allow-all
import { detectOS, runInstaller } from "./core/types.ts";
import { installersFor } from "./registry.ts";
import { log } from "../log.ts";
import { binDir, ensureDir } from "./core/utils.ts";

const STEP = "install-software";
await log.stepBegin(STEP);
try {
  // Ensure bin dir exists for this process
  await ensureDir(binDir());

  const os = await detectOS();
  await log.info(STEP, `detected OS: ${os}`);

  for (const i of installersFor(os)) {
    await runInstaller(i);
  }

  // Marker for Bats ordering tests
  console.log("Software");

  await log.stepEnd(STEP, { ok: true });
} catch (err) {
  const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
  await log.error(STEP, msg);
  await log.stepEnd(STEP, { ok: false, error: msg });
  throw err;
}
