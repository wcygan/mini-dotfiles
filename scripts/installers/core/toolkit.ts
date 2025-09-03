import $ from "jsr:@david/dax";
import { join } from "jsr:@std/path";
import { binDir, cmdExists, homeDir, runSudo } from "./utils.ts";

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
    try {
      await $`rm -rf ${fzfDir}`.quiet();
    } catch {}
    await $`git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`;
  }
  await $`${join(fzfDir, "install")} ${installFlags}`;
}

export async function installTarballBinary(opts: {
  url: string; // final URL (versioned or latest/download/...)
  binName: string; // executable name inside extracted tarball
  dstName?: string; // optional rename at destination
}) {
  const tmp = await Deno.makeTempDir();
  const tgz = join(tmp, "artifact.tgz");
  await $`curl -fsSL -o ${tgz} ${opts.url}`;
  await $`tar -xzf ${tgz} -C ${tmp}`;
  const src = join(tmp, opts.binName);
  try {
    await Deno.chmod(src, 0o755);
  } catch {}
  const dst = join(binDir(), opts.dstName ?? opts.binName);
  try {
    await Deno.remove(dst);
  } catch {}
  await Deno.rename(src, dst);
}

export async function ghLatestRedirect(repo: string): Promise<string> {
  // Returns the effective URL of .../releases/latest after redirects, e.g. .../tag/v0.54.2
  const r =
    await $`sh -lc 'curl -Ls -o /dev/null -w %\{url_effective\} https://github.com/${repo}/releases/latest'`
      .quiet();
  return r.stdout.trim();
}

// Ensures the given shell is the user's default login shell.
// - Resolves path via `command -v <shellCmd>`
// - Adds to /etc/shells (via sudo) if missing
// - Runs chsh for current user if different
// Returns the resolved path and whether a change was performed.
export async function ensureDefaultShell(
  shellCmd: string,
): Promise<{ path: string; changed: boolean }> {
  const { stdout } = await $`sh -lc 'command -v ${shellCmd}'`.quiet();
  const shellPath = stdout.trim();
  if (!shellPath) throw new Error(`${shellCmd} not found on PATH`);

  try {
    await runSudo(
      `sh -lc 'grep -qx ${shellPath} /etc/shells || echo ${shellPath} >> /etc/shells'`,
    );
  } catch {
    // best-effort: ignore inability to update /etc/shells
  }

  const cur =
    await $`sh -lc 'getent passwd "$USER" 2>/dev/null | cut -d: -f7 || dscl . -read /Users/$(whoami) UserShell 2>/dev/null | awk "NR==1{print $2}" || printf %s "$SHELL"'`
      .quiet();
  const currentShell = cur.stdout.trim();
  if (currentShell === shellPath) return { path: shellPath, changed: false };

  try {
    await $`chsh -s ${shellPath}`.quiet();
    return { path: shellPath, changed: true };
  } catch {
    try {
      await runSudo(`chsh -s ${shellPath} $USER`);
      return { path: shellPath, changed: true };
    } catch {
      return { path: shellPath, changed: false };
    }
  }
}
