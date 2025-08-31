#!/usr/bin/env -S deno run --allow-all

// Run installers in sequence
await import("./install-files.ts");
await import("./install-software.ts");
