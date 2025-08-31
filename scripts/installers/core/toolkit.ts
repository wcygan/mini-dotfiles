import $ from "jsr:@david/dax";
import { join } from "jsr:@std/path";
import { binDir, cmdExists, homeDir } from "./utils.ts";

export async function ensureUpstreamFzf(noUpdateRc = true) {
  const fzfDir = join(homeDir(), ".fzf");
  const installFlags = [
    "--key-bindings",
    "--completion",
    noUpdateRc ? "--no-update-rc" : "",
  ].filter(Boolean);
  try {
    await $`test -d ${fzfDir}`.quiet();
    await $`git -C ${fzfDir} pull --ff-only`.quiet();
  } catch {
    try { await $`rm -rf ${fzfDir}`.quiet(); } catch {}
    await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`;
  }
  await $`${join(fzfDir, "install")} ${installFlags}`;
}

export async function installTarballBinary(opts: {
  url: string;      // final URL (versioned or latest/download/...)
  binName: string;  // executable name inside extracted tarball
  dstName?: string; // optional rename at destination
}) {
  const tmp = await Deno.makeTempDir();
  const tgz = join(tmp, "artifact.tgz");
  await $`curl -fsSL -o ${tgz} ${opts.url}`;
  await $`tar -xzf ${tgz} -C ${tmp}`;
  const src = join(tmp, opts.binName);
  try { await Deno.chmod(src, 0o755); } catch {}
  const dst = join(binDir(), opts.dstName ?? opts.binName);
  try { await Deno.remove(dst); } catch {}
  await Deno.rename(src, dst);
}

export function ghLatestRedirect(repo: string): Promise<string> {
  // Returns the effective URL of .../releases/latest, e.g. .../tag/v0.54.2
  return $`sh -lc 'curl -sI -o /dev/null -w %\{url_effective\} https://github.com/${repo}/releases/latest'`
    .quiet().then(r => r.stdout.trim());
}

