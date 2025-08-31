import $ from "jsr:@david/dax";
import { UbuntuInstaller } from "./base.ts";
import { binDir, cmdExists, ensureDir } from "../core/utils.ts";
import { log } from "../../log.ts";
import { join } from "jsr:@std/path";

export class LazyGitUbuntuInstaller extends UbuntuInstaller {
  readonly name = "lazygit-ubuntu";

  override async pre() { await ensureDir(binDir()); }

  override async run() {
    if (await cmdExists("lazygit")) {
      await log.info("install-software", "lazygit already installed; skipping");
      return;
    }

    // 1) Try distro package (Ubuntu 25.10+/Debian 13+)
    try {
      await this.aptUpdate();
      await this.aptInstall("lazygit");
      return;
    } catch {
      // fall through
    }

    // 2) Upstream tarball from latest. Prefer GitHub API for tag, but fall back to redirect.
    const os = Deno.build.os; // linux here
    const arch = Deno.build.arch; // x86_64 | aarch64
    const assetOS = os === "linux" ? "Linux" : "";
    const assetArch = arch === "x86_64" ? "x86_64" : arch === "aarch64" ? "arm64" : "";
    if (!assetOS || !assetArch) throw new Error(`unsupported platform ${os}/${arch}`);

    let tag = "";
    try {
      const latestRes = await fetch("https://api.github.com/repos/jesseduffield/lazygit/releases/latest", {
        headers: { "Accept": "application/vnd.github+json" },
      });
      if (latestRes.ok) {
        const latest = await latestRes.json();
        tag = String(latest.tag_name ?? latest.tag ?? "");
      }
    } catch {}
    if (!tag) {
      // API rate-limited or blocked; derive from redirect
      const { stdout: eff } = await $`sh -lc 'curl -sI -o /dev/null -w %\{url_effective\} https://github.com/jesseduffield/lazygit/releases/latest'`.quiet();
      tag = eff.trim().split("/").pop() ?? ""; // e.g., v0.54.2
    }
    const version = tag.replace(/^v/, "");
    if (!version) throw new Error("could not determine latest lazygit version");

    // Try versioned asset first
    let assetName = `lazygit_${version}_${assetOS}_${assetArch}.tar.gz`;
    let url = `https://github.com/jesseduffield/lazygit/releases/download/${tag}/${assetName}`;

    const tmpDir = await Deno.makeTempDir();
    const tarPath = join(tmpDir, assetName);
    let downloaded = await $`curl -fsSL -o ${tarPath} ${url}`.quiet().then(() => true, () => false);
    if (!downloaded) {
      // Fallback to versionless latest/download asset name
      assetName = `lazygit_${assetOS}_${assetArch}.tar.gz`;
      url = `https://github.com/jesseduffield/lazygit/releases/latest/download/${assetName}`;
      downloaded = await $`curl -fsSL -o ${tarPath} ${url}`.quiet().then(() => true, () => false);
      if (!downloaded) throw new Error(`failed to download lazygit from ${url}`);
    }
    await $`tar -xzf ${tarPath} -C ${tmpDir}`;
    const binSrc = join(tmpDir, "lazygit");
    await Deno.chmod(binSrc, 0o755).catch(() => {});

    const dst = join(binDir(), "lazygit");
    try { await Deno.remove(dst); } catch {}
    await Deno.rename(binSrc, dst);
  }

  override async post() {
    if (!(await cmdExists("lazygit"))) throw new Error("lazygit not found after install");
  }
}
