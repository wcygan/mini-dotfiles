#!/usr/bin/env -S deno run --allow-all

import { log } from "./log.ts";

// Harden PATH exactly once for the whole run.
try {
  const { safePATH } = await import("./installers/core/utils.ts");
  Deno.env.set("PATH", safePATH());
} catch {
  // env may be locked; best effort
}

// Run installers in sequence
await import("./install-files.ts");
await import("./installers/run.ts");

// Post-install guidance: emit a JSONL + pretty log with the reload hint
try {
  const shell = (Deno.env.get("SHELL") ?? "").toLowerCase();
  let cmd = 'exec "$SHELL" -l';
  if (shell.includes("bash")) cmd = "exec bash -l";
  else if (shell.includes("zsh")) cmd = "exec zsh -l";
  await log.success("post-install", `reload shell: ${cmd}`);
} catch (_) {
  // ignore env access errors
}
